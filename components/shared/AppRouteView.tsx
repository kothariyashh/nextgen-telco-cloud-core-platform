/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { useApi } from "@/hooks/useApi";
import { getModulePresentation } from "@/lib/module-presentation";

type Props = {
  title: string;
  description: string;
  endpoint?: string;
  createHref?: string;
  routePath: string;
};

function normalizeRows(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) {
    return data as Array<Record<string, unknown>>;
  }
  if (data && typeof data === "object" && Array.isArray((data as any).items)) {
    return (data as any).items as Array<Record<string, unknown>>;
  }
  if (data && typeof data === "object") {
    return [data as Record<string, unknown>];
  }
  return [];
}

function getStatus(row: Record<string, unknown>) {
  const candidates = [row.status, row.severity, row.state];
  const found = candidates.find((value) => typeof value === "string");
  return String(found ?? "info");
}

function metricsFromRows(rows: Array<Record<string, unknown>>) {
  const total = rows.length;
  const active = rows.filter((row) => {
    const status = getStatus(row).toLowerCase();
    return status.includes("active") || status.includes("operational") || status.includes("running");
  }).length;

  const flagged = rows.filter((row) => {
    const status = getStatus(row).toLowerCase();
    return status.includes("critical") || status.includes("warning") || status.includes("degraded") || status.includes("failed");
  }).length;

  const withTime = rows.filter((row) => row.updated_at || row.created_at || row.recorded_at).length;
  const freshness = total ? Math.max(65, Math.min(99, Math.round((withTime / total) * 100))) : 100;

  return { total, active, flagged, freshness };
}

function activityTime(row: Record<string, unknown>) {
  return (
    row.updated_at ??
    row.created_at ??
    row.recorded_at ??
    row.occurred_at ??
    row.start_time ??
    row.generated_at ??
    "-"
  );
}

function adaptiveGuidance(
  routePath: string,
  stats: { total: number; active: number; flagged: number; freshness: number },
  createHref: string | undefined,
) {
  if (stats.flagged > 0) {
    return {
      title: "High-priority state detected",
      summary: `${stats.flagged} flagged records need review before applying automation.`,
      action: { label: "Open Monitoring Alerts", href: "/app/monitoring/alerts" },
      confidence: 90,
      rationale: [
        "Flagged entities indicate potential service impact.",
        "Real-time alarm review reduces false-positive automation.",
        "Human confirmation should precede high-impact actions.",
      ],
    };
  }

  if (stats.total === 0 && createHref) {
    return {
      title: "No records yet",
      summary: "Start with the first guided setup action to unlock personalized recommendations.",
      action: { label: "Create First Record", href: createHref },
      confidence: 78,
      rationale: [
        "This module has no data records yet.",
        "Creating baseline entities enables adaptive analytics.",
        "Subsequent recommendations become behavior-driven after initial setup.",
      ],
    };
  }

  return {
    title: "System stable and ready",
    summary: `Data freshness is ${stats.freshness}% and ${stats.active} records are currently healthy.`,
    action: { label: "Review AI Recommendations", href: "/app/ai" },
    confidence: 84,
    rationale: [
      "Healthy state allows proactive optimization.",
      "AI recommendations are ranked by operational impact.",
      "You can override any recommendation before execution.",
    ],
  };
}

export function AppRouteView({ title, description, endpoint, createHref, routePath }: Props) {
  const { data, loading, error } = useApi<unknown>(endpoint ?? "/api");
  const rows = endpoint ? normalizeRows(data) : [];
  const moduleUi = getModulePresentation(routePath);
  const stats = metricsFromRows(rows);

  const guidance = adaptiveGuidance(routePath, stats, createHref);

  return (
    <div className="space-y-4">
      <section className="dark-mesh relative overflow-hidden rounded-[24px] border border-sky-900/40 p-5 text-white md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div>
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
              {routePath}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-200">{description}</p>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">{moduleUi.tagline}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {moduleUi.chips.map((chip) => (
                <span key={chip} className="badge border border-white/25 bg-white/10 text-sky-100">
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {createHref ? (
                <Link href={createHref} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-900">
                  Create New
                </Link>
              ) : null}
              {moduleUi.quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="rounded-lg border border-white/30 px-3 py-1.5 text-sm font-semibold text-white">
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="image-frame glow-ring max-w-xl lg:justify-self-end">
            <Image src={moduleUi.image} alt={moduleUi.imageAlt} width={1200} height={780} className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kpi-tile fade-in-up">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Records</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
        </div>
        <div className="kpi-tile fade-in-up delay-1">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{stats.active}</p>
        </div>
        <div className="kpi-tile fade-in-up delay-2">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Flagged</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.flagged}</p>
        </div>
        <div className="kpi-tile fade-in-up delay-3">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Data Freshness</p>
          <p className="mt-1 text-2xl font-semibold text-sky-700">{stats.freshness}%</p>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Adaptive Guidance</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{guidance.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{guidance.summary}</p>
          </div>
          <Link href={guidance.action.href} className="btn-dark-visible px-3 py-1.5 text-sm">
            {guidance.action.label}
          </Link>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[280px_1fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <ConfidenceBar score={guidance.confidence} label="Recommendation confidence" />
          </div>
          <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Why this recommendation?</summary>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {guidance.rationale.map((line) => (
                <p key={line}>- {line}</p>
              ))}
              <p className="pt-1 text-xs text-slate-500">Data provenance: {endpoint ?? "module context"} · records observed: {stats.total}</p>
            </div>
          </details>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="surface-card p-4 md:p-5">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : !endpoint ? (
            <EmptyState title="Module route ready" description="This module is scaffolded and waiting for endpoint mapping." />
          ) : loading ? (
            <LoadingSkeleton />
          ) : rows.length ? (
            <DataTable
              rows={rows}
              columns={Object.keys(rows[0]).slice(0, 6).map((key) => ({
                key,
                label: key.replace(/_/g, " "),
                render: (row: Record<string, unknown>) => {
                  if (key === "status" || key === "severity" || key === "state") {
                    return <StatusBadge status={String(row[key] ?? "unknown")} />;
                  }
                  return String(row[key] ?? "-");
                },
              }))}
            />
          ) : (
            <EmptyState title="No data yet" description={`Connect and seed ${endpoint} to populate this module.`} />
          )}
        </div>

        <aside className="space-y-4">
          <div className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Module Focus</p>
            <div className="mt-3 grid gap-2">
              {moduleUi.focus.map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Recent Signals</p>
            <div className="mt-3 space-y-2">
              {(rows.length ? rows : [{ id: "-", status: "no-data", updated_at: "-" }]).slice(0, 4).map((row, index) => (
                <div key={String(row.id ?? index)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-slate-800">{String(row.id ?? `event-${index + 1}`)}</p>
                    <StatusBadge status={getStatus(row)} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{String(activityTime(row))}</p>
                </div>
              ))}
            </div>
          </div>

          {endpoint ? (
            <div className="surface-card p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Connected Endpoint</p>
              <p className="mt-2 rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{endpoint}</p>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
