/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/hooks/useApi";

export function NotificationPanel() {
  const { data } = useApi<unknown>("/api/faults/alarms?limit=5");
  const alerts = Array.isArray((data as any)?.items)
    ? ((data as any).items as Array<Record<string, unknown>>)
    : Array.isArray(data)
      ? (data as Array<Record<string, unknown>>)
      : [];

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Live Alerts</p>
      {alerts.length ? (
        alerts.slice(0, 4).map((alert) => (
          <div key={String(alert.id)} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
            <p className="font-medium text-slate-800">{String(alert.alarm_type ?? "Alarm")}</p>
            <p className="text-xs uppercase text-slate-500">{String(alert.severity ?? "info")}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">No active alerts.</p>
      )}
    </div>
  );
}
