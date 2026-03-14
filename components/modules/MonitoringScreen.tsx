"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { AppRouteView } from "@/components/shared/AppRouteView";
import { asNumber, asText, extractItems, statusOf } from "@/components/modules/module-utils";

function metricBar(value: number) {
  const width = Math.max(8, Math.min(100, Math.round(value)));
  return <div className="h-2 rounded-full bg-sky-500" style={{ width: `${width}%` }} />;
}

export function MonitoringScreen() {
  const health = useApi<Record<string, unknown>>("/api/monitoring/health");
  const metrics = useApi<unknown>("/api/monitoring/metrics/summary");
  const alarms = useApi<unknown>("/api/faults/alarms?limit=12");

  const metricRows = extractItems(metrics.data);
  const alarmRows = extractItems(alarms.data);

  const nfActive = asNumber(((health.data as Record<string, unknown> | null)?.network_functions as Record<string, unknown> | undefined)?.active);
  const alarmsActive = asNumber(((health.data as Record<string, unknown> | null)?.alarms as Record<string, unknown> | undefined)?.active);
  const sessionsActive = asNumber(((health.data as Record<string, unknown> | null)?.sessions as Record<string, unknown> | undefined)?.active);

  return (
    <div className="space-y-4">
      <AppRouteView
        title="Monitoring"
        description="Observe metrics, alarms, logs, and traces in one operational workspace."
        endpoint="/api/monitoring/health"
        routePath="/app/monitoring"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active NFs</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{nfActive}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active Alarms</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{alarmsActive}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Live Sessions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{sessionsActive}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Alerting</p>
          <div className="mt-2 flex gap-2">
            <Link href="/app/monitoring/alerts" className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
              Rules
            </Link>
            <Link href="/app/monitoring/traces" className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
              Traces
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Metric Snapshot</h3>
            <Link href="/app/monitoring/logs" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              Open logs
            </Link>
          </div>
          <div className="space-y-2">
            {metricRows.length ? (
              metricRows.slice(0, 8).map((row) => {
                const name = asText(row.metric_name);
                const value = asNumber(row.metric_value);
                return (
                  <div key={`${name}-${asText(row.recorded_at)}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <p className="text-slate-700">{name}</p>
                      <p className="font-semibold text-slate-900">
                        {value.toFixed(2)} {asText(row.unit, "")}
                      </p>
                    </div>
                    <div className="mt-2 rounded-full bg-slate-200 p-[2px]">{metricBar(value)}</div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No metric snapshot available.</p>
            )}
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Alarm Timeline</h3>
            <Link href="/app/monitoring/alerts" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              Manage alerts
            </Link>
          </div>
          <div className="space-y-2">
            {alarmRows.length ? (
              alarmRows.slice(0, 10).map((row) => (
                <div key={asText(row.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">{asText(row.alarm_type, "Alarm")}</p>
                    <StatusBadge status={statusOf(row)} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{asText(row.raised_at, asText(row.created_at))}</p>
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
