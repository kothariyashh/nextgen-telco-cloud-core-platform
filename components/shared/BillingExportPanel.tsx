import Link from "next/link";

export function BillingExportPanel() {
  return (
    <section className="surface-card p-4">
      <h3 className="text-base font-semibold text-slate-900">CDR Export Center</h3>
      <p className="mt-1 text-sm text-slate-600">Download rated records for finance, reconciliation, and audit trails.</p>
      <Link href="/api/billing/cdr/export" className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
        Export CSV
      </Link>
    </section>
  );
}
