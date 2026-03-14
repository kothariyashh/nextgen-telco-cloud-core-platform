"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { AppRouteView } from "@/components/shared/AppRouteView";
import { asText, countBy, extractItems, statusOf } from "@/components/modules/module-utils";

export function NetworkFunctionsScreen() {
  const { data } = useApi<unknown>("/api/network-functions?limit=100");
  const rows = extractItems(data);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      [asText(row.name), asText(row.nf_type), asText(row.generation), asText(row.status)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  const byStatus = countBy(rows, "status");

  return (
    <div className="space-y-4">
      <AppRouteView
        title="Network Functions"
        description="Deploy, monitor, and scale AMF/SMF/UPF and other mobile core network functions."
        endpoint="/api/network-functions"
        createHref="/app/network-functions"
        routePath="/app/network-functions"
      />

      <section className="surface-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="kpi-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total NFs</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{rows.length}</p>
          </div>
          <div className="kpi-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{byStatus.active ?? 0}</p>
          </div>
          <div className="kpi-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Deploying</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{byStatus.deploying ?? 0}</p>
          </div>
          <div className="kpi-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Degraded / Failed</p>
            <p className="mt-1 text-2xl font-semibold text-rose-700">{(byStatus.degraded ?? 0) + (byStatus.failed ?? 0)}</p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Function Inventory</h3>
          <div className="w-full max-w-xs">
            <SearchInput placeholder="Search by name/type/status" onChange={setQuery} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length ? (
            filtered.map((row) => (
              <article key={asText(row.id)} className="rounded-xl border border-slate-200 bg-white p-4 lift-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="truncate text-sm font-semibold text-slate-900">{asText(row.name)}</p>
                    <p className="text-xs text-slate-500">{asText(row.nf_type)} · {asText(row.generation)}</p>
                  </div>
                  <StatusBadge status={statusOf(row)} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Version: {asText(row.version)}</div>
                  <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Region: {asText(row.region_id, "n/a")}</div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/app/network-functions/${asText(row.id)}`} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
                    Details
                  </Link>
                  <Link href={`/api/network-functions/${asText(row.id)}/health`} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
                    Health API
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">No network functions match your filter.</p>
          )}
        </div>
      </section>
    </div>
  );
}
