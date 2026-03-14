"use client";

import Link from "next/link";
import { useState } from "react";
import { AppRouteView } from "@/components/shared/AppRouteView";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { useApi } from "@/hooks/useApi";
import { asNumber, extractItems } from "@/components/modules/module-utils";

export function AIScreen() {
  const predictions = useApi<unknown>("/api/ai/predictions?limit=10");
  const anomalies = useApi<unknown>("/api/ai/anomalies?limit=10");
  const optimizations = useApi<unknown>("/api/ai/optimizations?limit=10");
  const [modePrompt, setModePrompt] = useState("Create a compact operator view with anomaly-first cards");

  const predictionRows = extractItems(predictions.data);
  const anomalyRows = extractItems(anomalies.data);
  const optimizationRows = extractItems(optimizations.data);

  const avgConfidence = predictionRows.length
    ? Math.round(
        predictionRows.reduce((sum, row) => sum + asNumber(row.confidence, 0.7), 0) / predictionRows.length * 100,
      )
    : 74;

  return (
    <div className="space-y-4">
      <AppRouteView
        title="AI Center"
        description="Agentic AI workspace with explainability, confidence cues, and human governance controls."
        endpoint="/api/ai/predictions"
        routePath="/app/ai"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Predictions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{predictionRows.length}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Anomalies</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{anomalyRows.length}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Optimizations</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{optimizationRows.length}</p>
        </div>
        <div className="kpi-tile">
          <ConfidenceBar score={avgConfidence} label="Model confidence" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Agentic Task Flow</h3>
            <Link href="/app/ai/intent" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              Open Intent Studio
            </Link>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            {[
              ["Plan", "completed"],
              ["Validate", "completed"],
              ["Preview", "in_progress"],
              ["Human Confirm", "pending"],
              ["Execute", "pending"],
            ].map(([step, status]) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{step}</p>
                  <p className="text-xs uppercase text-slate-500">{status}</p>
                </div>
              </div>
            ))}
          </div>

          <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Why this agent plan?</summary>
            <div className="mt-2 text-sm text-slate-600">
              <p>- Uses prediction + anomaly signals to rank actions.</p>
              <p>- Requires human confirmation before deployment.</p>
              <p>- Records execution provenance for audit and rollback.</p>
            </div>
          </details>
        </div>

        <div className="surface-card p-4">
          <h3 className="text-base font-semibold text-slate-900">Generative UI Prompt</h3>
          <p className="mt-1 text-sm text-slate-600">Prototype custom interface emphasis based on operator intent.</p>
          <textarea
            value={modePrompt}
            onChange={(event) => setModePrompt(event.target.value)}
            className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Layout Mode: Anomaly-first</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Density: Operator Compact</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Primary CTA: Human Review</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Transparency Layer: Enabled</div>
          </div>

          <p className="mt-3 text-xs text-slate-500">Prompt length: {modePrompt.length} chars · UI can adapt in real-time.</p>
        </div>
      </section>
    </div>
  );
}
