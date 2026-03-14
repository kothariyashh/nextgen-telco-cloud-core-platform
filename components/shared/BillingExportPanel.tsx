import Link from "next/link";

export function BillingExportPanel() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">CDR Export</h3>
      <p className="mt-1 text-sm text-slate-600">Download the latest CDR records in CSV format.</p>
      <Link href="/api/billing/cdr/export" className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
        Export CSV
      </Link>
    </section>
  );
}
