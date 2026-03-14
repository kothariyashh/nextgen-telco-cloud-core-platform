export default function StatusPage() {
  const services = [
    { service: "API Gateway", state: "Operational", uptime: "99.99%" },
    { service: "Realtime Stream", state: "Operational", uptime: "99.97%" },
    { service: "Billing Pipeline", state: "Operational", uptime: "99.95%" },
    { service: "Orchestration Worker", state: "Operational", uptime: "99.98%" },
  ];

  return (
    <main className="container py-12">
      <section className="mesh-bg overflow-hidden rounded-[24px] border border-sky-100 p-6 md:p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Platform Status</h1>
        <p className="mt-2 text-slate-700">Live service health and uptime indicators for control plane subsystems.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {services.map((item, index) => (
            <div key={item.service} className={`surface-card fade-in-up delay-${(index % 4) + 1} p-4`}>
              <p className="text-sm font-semibold text-slate-900">{item.service}</p>
              <p className="mt-1 text-sm text-emerald-700">{item.state}</p>
              <p className="text-xs text-slate-500">Uptime: {item.uptime}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
