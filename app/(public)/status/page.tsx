export default function StatusPage() {
  return (
    <main className="container py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Platform Status</h1>
        <p className="mt-2 text-slate-600">Current uptime and service health snapshots.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["API Gateway", "Operational"],
            ["Realtime Stream", "Operational"],
            ["Billing Pipeline", "Operational"],
          ].map(([service, status]) => (
            <div key={service} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">{service}</p>
              <p className="mt-1 text-sm text-emerald-700">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
