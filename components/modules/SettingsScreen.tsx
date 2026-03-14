"use client";

import { useState } from "react";
import { AppRouteView } from "@/components/shared/AppRouteView";

type Toggle = {
  key: string;
  label: string;
  description: string;
  value: boolean;
};

const initial: Toggle[] = [
  {
    key: "privacy_learning",
    label: "Allow AI to learn from my usage",
    description: "Improves personalization and anticipatory suggestions.",
    value: false,
  },
  {
    key: "privacy_telemetry",
    label: "Share anonymized telemetry",
    description: "Used for model quality and bias mitigation checks.",
    value: true,
  },
  {
    key: "privacy_conversation_history",
    label: "Store AI conversation history",
    description: "Enables contextual continuity and progressive prompts.",
    value: false,
  },
  {
    key: "safety_high_impact_confirmation",
    label: "Require confirmation for high-impact actions",
    description: "Enforces human-in-the-loop governance on risky operations.",
    value: true,
  },
];

export function SettingsScreen() {
  const [toggles, setToggles] = useState<Toggle[]>(() => {
    if (typeof window === "undefined") {
      return initial;
    }

    try {
      const raw = localStorage.getItem("ngcmcp_privacy_controls");
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      return initial.map((item) => ({ ...item, value: parsed[item.key] ?? item.value }));
    } catch {
      return initial;
    }
  });
  const [saved, setSaved] = useState(false);

  function updateToggle(key: string, value: boolean) {
    setSaved(false);
    setToggles((prev) => prev.map((item) => (item.key === key ? { ...item, value } : item)));
  }

  function save() {
    const payload = toggles.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    localStorage.setItem("ngcmcp_privacy_controls", JSON.stringify(payload));
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <AppRouteView
        title="Settings"
        description="Privacy, safety, and personalization controls for AI-driven experiences."
        endpoint="/api/auth/session"
        routePath="/app/settings"
      />

      <section className="surface-card p-4">
        <h3 className="text-base font-semibold text-slate-900">Privacy Controls</h3>
        <p className="mt-1 text-sm text-slate-600">Control data usage, AI history, and governance behavior.</p>

        <div className="mt-3 space-y-2">
          {toggles.map((item) => (
            <label key={item.key} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={item.value}
                onChange={(event) => updateToggle(item.key, event.target.checked)}
                className="mt-1"
              />
              <span>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-600">{item.description}</p>
              </span>
            </label>
          ))}
        </div>

        <button onClick={save} className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
          Save Preferences
        </button>
        {saved ? <p className="mt-2 text-sm text-emerald-700">Preferences saved successfully.</p> : null}
      </section>

      <section className="surface-card p-4">
        <h3 className="text-base font-semibold text-slate-900">Trust & Transparency</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Data provenance labels are shown for all AI recommendations.
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Confidence indicators are displayed before any agent action.
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Human override and undo controls are available for applied actions.
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Fairness checks are surfaced when broad-impact prompts are detected.
          </div>
        </div>
      </section>
    </div>
  );
}
