"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { AppRouteView } from "@/components/shared/AppRouteView";
import { asText, countBy, extractItems, statusOf } from "@/components/modules/module-utils";

export function SubscribersScreen() {
  const { data } = useApi<unknown>("/api/subscribers?limit=100");
  const rows = extractItems(data);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      [asText(row.imsi), asText(row.msisdn), asText(row.plan), asText(row.status)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  const byStatus = countBy(rows, "status");
  const byPlan = countBy(rows, "plan");

  return (
    <div className="space-y-4">
      <AppRouteView
        title="Subscribers"
        description="Manage subscriber lifecycle, SIM allocation, roaming, and service state."
        endpoint="/api/subscribers"
        createHref="/app/subscribers/new"
        routePath="/app/subscribers"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total Subscribers</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{rows.length}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{byStatus.active ?? 0}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Suspended</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{byStatus.suspended ?? 0}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Plans</p>
          <p className="mt-1 text-2xl font-semibold text-sky-700">{Object.keys(byPlan).length}</p>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Subscriber Directory</h3>
          <div className="w-full max-w-xs">
            <SearchInput placeholder="Search IMSI / MSISDN / plan" onChange={setQuery} />
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-3 py-2">IMSI</th>
                  <th className="px-3 py-2">MSISDN</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((row) => (
                    <tr key={asText(row.id)} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">{asText(row.imsi)}</td>
                      <td className="px-3 py-2 text-slate-700">{asText(row.msisdn)}</td>
                      <td className="px-3 py-2 text-slate-700">{asText(row.plan)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={statusOf(row)} />
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/app/subscribers/${asText(row.id)}`} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-sm text-slate-500" colSpan={5}>
                      No subscribers match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <aside className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Plan Mix</p>
              <div className="mt-2 space-y-2">
                {Object.entries(byPlan).slice(0, 5).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between rounded bg-white px-2 py-1 text-sm">
                    <span className="text-slate-700">{plan}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Quick Actions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/app/subscribers/new" className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
                  Add Subscriber
                </Link>
                <Link href="/app/slices" className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
                  Assign Slice
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
