/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";

type ConversationItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
};

type ExecutedAction = {
  id: string;
  summary: string;
  payload: Record<string, unknown>;
  at: string;
};

const templates = [
  "Increase capacity for the IoT slice in Mumbai by 30%",
  "Scale UPF replicas in Frankfurt to 4 and keep latency under 20ms",
  "Reduce bandwidth on idle enterprise slice by 15%",
  "Prepare failover action for SMF in Singapore",
];

function parseQuickIntent(prompt: string) {
  const lowered = prompt.toLowerCase();
  const action = lowered.includes("scale") || lowered.includes("increase") ? "scale" : lowered.includes("reduce") ? "optimize" : "analyze";
  const target = lowered.includes("slice") ? "slice" : lowered.includes("upf") ? "network_function" : "network";
  const percentage = Number(lowered.match(/(\d+)%/)?.[1] ?? 0);
  return { action, target, percentage };
}

function fairnessWarnings(prompt: string) {
  const warnings: string[] = [];
  if (/all subscribers|everyone|all users/i.test(prompt)) {
    warnings.push("Broad impact scope detected. Consider narrowing target segments to reduce unintended impact.");
  }
  if (/block|deny|throttle/i.test(prompt) && !/policy|qos|approved/i.test(prompt)) {
    warnings.push("Potential restrictive action without explicit policy context.");
  }
  if (/urgent|immediately|now/i.test(prompt) && !/confirm|review/i.test(prompt)) {
    warnings.push("High urgency command without explicit confirmation language.");
  }
  return warnings;
}

export function IntentConsole() {
  const [prompt, setPrompt] = useState(templates[0]);
  const [response, setResponse] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [actionDraft, setActionDraft] = useState(`{\n  "target_type": "slice",\n  "target_id": "",\n  "replicas": 2\n}`);
  const [executed, setExecuted] = useState<ExecutedAction[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [governorEnabled, setGovernorEnabled] = useState(true);
  const [confirmApply, setConfirmApply] = useState(false);
  const [allowHistoryLearning, setAllowHistoryLearning] = useState(false);
  const [allowTelemetry, setAllowTelemetry] = useState(true);
  const [ackFairness, setAckFairness] = useState(false);

  const quick = useMemo(() => parseQuickIntent(prompt), [prompt]);
  const warnings = useMemo(() => fairnessWarnings(prompt), [prompt]);

  const confidence = useMemo(() => {
    let score = 62;
    if (quick.action === "scale") score += 12;
    if (quick.target === "slice") score += 8;
    if (quick.percentage > 0 && quick.percentage <= 35) score += 10;
    if (warnings.length > 0) score -= 18;
    return Math.max(25, Math.min(95, score));
  }, [quick.action, quick.target, quick.percentage, warnings.length]);

  const stage = useMemo(() => {
    if (loading) return "Parsing intent and validating policy...";
    if (response) return "Intent parsed. Awaiting human confirmation.";
    return "Waiting for input.";
  }, [loading, response]);

  const canApply = !governorEnabled || (confirmApply && (warnings.length === 0 || ackFairness));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    setConversation((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        text: prompt,
        at: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const body = await res.json();
      const payload = (body?.data ?? body) as Record<string, any>;
      setResponse(payload);

      const preview = payload?.preview_changes ?? {
        target_type: quick.target,
        amount_percent: quick.percentage,
      };

      setActionDraft(JSON.stringify(preview, null, 2));

      setConversation((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `Suggested action: ${preview.action ?? quick.action} on ${preview.target ?? quick.target}.`,
          at: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function applyAction() {
    setMessage(null);
    if (!canApply) {
      setMessage("Enable confirmation to apply the action.");
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(actionDraft) as Record<string, unknown>;
    } catch {
      setMessage("Action JSON is invalid.");
      return;
    }

    const endpoint = quick.action === "scale" ? "/api/orchestration/scale" : "/api/orchestration/update";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    const body = await res.json();
    if (!res.ok) {
      setMessage(body?.message ?? "Failed to apply action.");
      return;
    }

    const record: ExecutedAction = {
      id: String((body?.data as { id?: string } | undefined)?.id ?? `local-${Date.now()}`),
      summary: `${quick.action} -> ${quick.target}`,
      payload: parsed,
      at: new Date().toLocaleTimeString(),
    };

    setExecuted((prev) => [record, ...prev]);
    setMessage("Action applied with human approval.");
    setConfirmApply(false);
  }

  async function undoLastAction() {
    const last = executed[0];
    if (!last) {
      setMessage("No action to undo.");
      return;
    }

    await fetch("/api/orchestration/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollback_of: last.id, source: "intent_console" }),
    });

    setExecuted((prev) => prev.slice(1));
    setMessage("Undo request submitted.");
  }

  function startVoice() {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      setMessage("Voice input is not supported in this browser.");
      return;
    }

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript;
      if (text) setPrompt((prev) => `${prev} ${text}`.trim());
    };
    rec.onerror = () => setMessage("Voice input failed. Try again.");
    rec.start();
  }

  return (
    <section className="surface-card p-4">
      <h3 className="text-base font-semibold text-slate-900">Intent-Based Networking Console</h3>
      <p className="mt-1 text-sm text-slate-600">Agentic AI with human governance, explainability, and safe override controls.</p>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Moment-to-moment clarity</p>
        <p className="mt-1">{stage}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {templates.map((tpl) => (
          <button
            key={tpl}
            type="button"
            onClick={() => setPrompt(tpl)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
          >
            Template
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />

        <div className="flex flex-wrap gap-2">
          <button disabled={loading} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Parsing..." : "Run Intent"}
          </button>
          <button
            type="button"
            onClick={startVoice}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            Voice Input
          </button>
        </div>
      </form>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Real-time adaptation</p>
          <p className="mt-1 text-sm text-slate-700">
            Interpreted as <span className="font-semibold">{quick.action}</span> on <span className="font-semibold">{quick.target}</span>
            {quick.percentage ? ` (${quick.percentage}%)` : ""}
          </p>
          <div className="mt-2">
            <ConfidenceBar score={confidence} label="AI confidence" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Data provenance</p>
          <p className="mt-1 text-sm text-slate-700">Signals: `performance_metrics`, `network_slices`, `policy_rules`, `orchestration_jobs`.</p>
          <p className="mt-1 text-xs text-slate-500">Telemetry sharing: {allowTelemetry ? "enabled" : "disabled"} · Learning history: {allowHistoryLearning ? "enabled" : "disabled"}</p>
        </div>
      </div>

      {warnings.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Bias/Fairness checks</p>
          {warnings.map((warning) => (
            <p key={warning}>- {warning}</p>
          ))}
          <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={ackFairness} onChange={(event) => setAckFairness(event.target.checked)} />
            I reviewed fairness warnings and approve continuing.
          </label>
        </div>
      ) : null}

      <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Why this recommendation?</summary>
        <div className="mt-2 text-sm text-slate-600">
          <p>- The prompt intent maps to high-impact orchestration actions.</p>
          <p>- Confidence is computed from prompt clarity, bounded scope, and fairness checks.</p>
          <p>- Human governor ensures every action is editable before execution.</p>
        </div>
      </details>

      <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Advanced controls (Progressive disclosure)</summary>
        <div className="mt-3 space-y-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={governorEnabled} onChange={(event) => setGovernorEnabled(event.target.checked)} />
            Human-in-the-loop governor enabled
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={allowHistoryLearning} onChange={(event) => setAllowHistoryLearning(event.target.checked)} />
            Allow AI to learn from this session history
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={allowTelemetry} onChange={(event) => setAllowTelemetry(event.target.checked)} />
            Share anonymized telemetry for model improvement
          </label>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Action draft (editable)</p>
            <textarea
              value={actionDraft}
              onChange={(event) => setActionDraft(event.target.value)}
              className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs"
            />
          </div>
        </div>
      </details>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
          <input type="checkbox" checked={confirmApply} onChange={(event) => setConfirmApply(event.target.checked)} />
          Confirm apply
        </label>
        <button
          type="button"
          disabled={!canApply}
          onClick={applyAction}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Apply Action
        </button>
        <button type="button" onClick={undoLastAction} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
          Undo Last Action
        </button>
      </div>

      {message ? <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p> : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Conversation</p>
          <div className="mt-2 space-y-2">
            {conversation.length ? (
              conversation.slice(-6).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm">
                  <p className="text-xs font-semibold text-slate-500">{item.role.toUpperCase()} · {item.at}</p>
                  <p className="text-slate-700">{item.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No conversation yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Agentic action history</p>
          <div className="mt-2 space-y-2">
            {executed.length ? (
              executed.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm">
                  <p className="text-xs font-semibold text-slate-500">{item.at}</p>
                  <p className="text-slate-700">{item.summary}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No applied actions yet.</p>
            )}
          </div>
        </div>
      </div>

      {response ? <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(response, null, 2)}</pre> : null}
    </section>
  );
}
