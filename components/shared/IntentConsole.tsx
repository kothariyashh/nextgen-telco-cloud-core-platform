"use client";

import { FormEvent, useState } from "react";

export function IntentConsole() {
  const [prompt, setPrompt] = useState("Increase capacity for the IoT slice in Mumbai by 30%");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const body = await res.json();
      setResponse(body?.data ?? body);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Intent-Based Networking</h3>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button disabled={loading} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Parsing..." : "Run Intent"}
        </button>
      </form>
      {response ? <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(response, null, 2)}</pre> : null}
    </section>
  );
}
