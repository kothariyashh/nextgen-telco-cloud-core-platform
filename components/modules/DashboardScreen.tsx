"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { AppRouteView } from "@/components/shared/AppRouteView";
import { asNumber, asText, extractItems, statusOf } from "@/components/modules/module-utils";

export function DashboardScreen() {
  const health = useApi<Record<string, unknown>>("/api/monitoring/health");
  const sessions = useApi<Record<string, unknown>>("/api/sessions/stats");
  const nf = useApi<unknown>("/api/network-functions?limit=8");
  const alarms = useApi<unknown>("/api/faults/alarms?limit=8");

  const nfRows = extractItems(nf.data);
  const alarmRows = extractItems(alarms.data);

  const activeSessions = asNumber((sessions.data as Record<string, unknown> | null)?.active);
  const totalSessions = asNumber((sessions.data as Record<string, unknown> | null)?.total);
  const totalNf = asNumber(((health.data as Record<string, unknown> | null)?.network_functions as Record<string, unknown> | undefined)?.total);
  const criticalAlarms = asNumber(((health.data as Record<string, unknown> | null)?.alarms as Record<string, unknown> | undefined)?.critical);

  return (
    <div className="space-y-4">
      <AppRouteView
        title="Dashboard"
        description="Realtime KPI and health overview for the mobile core platform."
        endpoint="/api/monitoring/health"
        routePath="/app/dashboard"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Active Sessions</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{activeSessions.toLocaleString()}</p>
          <p className="text-xs text-slate-500">of {totalSessions.toLocaleString()} total sessions</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Network Functions</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{totalNf.toLocaleString()}</p>
          <p className="text-xs text-slate-500">across 4G EPC and 5G Core</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Critical Alarms</p>
          <p className="mt-1 text-3xl font-semibold text-rose-700">{criticalAlarms.toLocaleString()}</p>
          <p className="text-xs text-slate-500">requires immediate attention</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Automation</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-700">Ready</p>
          <div className="mt-2 flex gap-2 text-xs">
            <Link href="/app/ai/intent" className="rounded border border-slate-200 px-2 py-1 text-slate-700">
              Intent
            </Link>
            <Link href="/app/orchestration" className="rounded border border-slate-200 px-2 py-1 text-slate-700">
              Orchestration
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Network Function Snapshot</h3>
            <Link href="/app/network-functions" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              Open module
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {nfRows.length ? (
              nfRows.slice(0, 6).map((row) => (
                <div key={asText(row.id)} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{asText(row.name)}</p>
                  <p className="text-xs text-slate-500">{asText(row.nf_type)} · {asText(row.generation)}</p>
                  <div className="mt-2">
                    <StatusBadge status={statusOf(row)} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No network functions available.</p>
            )}
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recent Alarm Feed</h3>
            <Link href="/app/monitoring/alerts" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              Manage alerts
            </Link>
          </div>
          <div className="space-y-2">
            {alarmRows.length ? (
              alarmRows.slice(0, 6).map((row) => (
                <div key={asText(row.id)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">{asText(row.alarm_type, "Alarm")}</p>
                    <StatusBadge status={statusOf(row)} />
                  </div>
                  <p className="text-xs text-slate-500">{asText(row.raised_at, asText(row.created_at))}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No active alarms.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
