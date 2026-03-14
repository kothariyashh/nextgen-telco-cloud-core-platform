"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { AppRouteView } from "@/components/shared/AppRouteView";
import { asText, extractItems } from "@/components/modules/module-utils";

export function AdminScreen() {
  const tenants = useApi<unknown>("/api/admin/tenants");
  const users = useApi<unknown>("/api/admin/users?limit=30");
  const regions = useApi<unknown>("/api/admin/regions");

  const tenantRows = extractItems(tenants.data);
  const userRows = extractItems(users.data);
  const regionRows = extractItems(regions.data);

  return (
    <div className="space-y-4">
      <AppRouteView
        title="Admin Panel"
        description="Manage tenant governance, access roles, and regional infrastructure setup."
        endpoint="/api/admin/tenants"
        routePath="/app/admin"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tenants</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{tenantRows.length}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Users</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{userRows.length}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Regions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{regionRows.length}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Quick Actions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/app/admin/users" className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
              Users
            </Link>
            <Link href="/app/admin/tenants" className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
              Tenants
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="surface-card p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Tenant Overview</h3>
          <div className="space-y-2">
            {tenantRows.length ? (
              tenantRows.slice(0, 8).map((tenant) => (
                <div key={asText(tenant.id)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-900">{asText(tenant.name)}</p>
                  <p className="text-xs text-slate-500">Plan: {asText(tenant.plan)} · Slug: {asText(tenant.slug)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No tenants available.</p>
            )}
          </div>
        </div>

        <div className="surface-card p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Region Catalog</h3>
          <div className="space-y-2">
            {regionRows.length ? (
              regionRows.slice(0, 8).map((region) => (
                <div key={asText(region.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-900">{asText(region.name)}</p>
                  <p className="text-xs text-slate-500">{asText(region.cloud_provider)} · {asText(region.country)} · {asText(region.code)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No regions configured.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
