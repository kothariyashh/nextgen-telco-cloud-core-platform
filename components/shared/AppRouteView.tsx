/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/hooks/useApi";

type Props = {
  title: string;
  description: string;
  endpoint?: string;
  createHref?: string;
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

export function AppRouteView({ title, description, endpoint, createHref }: Props) {
  const { data, loading } = useApi<unknown>(endpoint ?? "/api");
  const rows = endpoint ? normalizeRows(data) : [];

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          createHref ? (
            <Link href={createHref} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              Create New
            </Link>
          ) : undefined
        }
      />

      {!endpoint ? (
        <EmptyState title="Module route ready" description="This page is scaffolded and waiting for endpoint mapping." />
      ) : loading ? (
        <LoadingSkeleton />
      ) : rows.length ? (
        <DataTable
          rows={rows}
          columns={Object.keys(rows[0]).slice(0, 6).map((key) => ({
            key,
            label: key.replace(/_/g, " "),
            render: (row: Record<string, unknown>) => {
              if (key === "status" || key === "severity") {
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
  );
}
