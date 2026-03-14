"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useApi } from "@/hooks/useApi";

const SLICE_TYPES = ["eMBB", "URLLC", "IoT", "mMTC", "V2X"] as const;

function normalizeTemplates(data: unknown): Array<{ id: string; name: string; slice_type: string }> {
  if (Array.isArray(data)) return data as Array<{ id: string; name: string; slice_type: string }>;
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)) {
    return ((data as { items: unknown[] }).items ?? []) as Array<{ id: string; name: string; slice_type: string }>;
  }
  return [];
}

export function SliceCreateWizard({ title = "Create Network Slice" }: { title?: string }) {
  const router = useRouter();
  const { data: templatesData, loading: templatesLoading } = useApi<unknown>("/api/slices/templates");
  const templates = normalizeTemplates(templatesData ?? null);

  const [name, setName] = useState("");
  const [sliceType, setSliceType] = useState<typeof SLICE_TYPES[number]>("eMBB");
  const [templateId, setTemplateId] = useState<string>("");
  const [bandwidthMbps, setBandwidthMbps] = useState(100);
  const [latencyMs, setLatencyMs] = useState(20);
  const [maxSubscribers, setMaxSubscribers] = useState(1000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);

      try {
        const payload = {
          name: name.trim() || `slice-${sliceType}-${Date.now()}`,
          slice_type: sliceType,
          template_id: templateId || undefined,
          bandwidth_mbps: bandwidthMbps,
          latency_target_ms: latencyMs,
          max_subscribers: maxSubscribers,
          qos_profile: {},
        };

        const res = await fetch("/api/slices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        const body = await res.json();
        if (!res.ok || !body?.ok) {
          throw new Error(body?.message ?? "Failed to create slice");
        }

        router.push("/app/slices");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create slice");
      } finally {
        setSubmitting(false);
      }
    },
    [name, sliceType, templateId, bandwidthMbps, latencyMs, maxSubscribers, router]
  );

  return (
    <section className="surface-card rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Link href="/app/slices" className="text-sm font-medium text-sky-600 hover:text-sky-700">
          ← Back to Slices
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        <div>
          <label htmlFor="slice-name" className="block text-sm font-medium text-slate-700">
            Slice Name
          </label>
          <input
            id="slice-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. iot-slice-01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label htmlFor="slice-type" className="block text-sm font-medium text-slate-700">
            Slice Type
          </label>
          <select
            id="slice-type"
            value={sliceType}
            onChange={(e) => setSliceType(e.target.value as typeof SLICE_TYPES[number])}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {SLICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {templates.length > 0 && (
          <div>
            <label htmlFor="slice-template" className="block text-sm font-medium text-slate-700">
              Template (optional)
            </label>
            <select
              id="slice-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={templatesLoading}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">None – define from scratch</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slice_type})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="bandwidth" className="block text-sm font-medium text-slate-700">
              Bandwidth (Mbps)
            </label>
            <input
              id="bandwidth"
              type="number"
              min={1}
              value={bandwidthMbps}
              onChange={(e) => setBandwidthMbps(Number(e.target.value) || 100)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label htmlFor="latency" className="block text-sm font-medium text-slate-700">
              Latency Target (ms)
            </label>
            <input
              id="latency"
              type="number"
              min={1}
              value={latencyMs}
              onChange={(e) => setLatencyMs(Number(e.target.value) || 20)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label htmlFor="max-subscribers" className="block text-sm font-medium text-slate-700">
              Max Subscribers
            </label>
            <input
              id="max-subscribers"
              type="number"
              min={1}
              value={maxSubscribers}
              onChange={(e) => setMaxSubscribers(Number(e.target.value) || 1000)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create Slice"}
          </button>
          <Link
            href="/app/slices"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
