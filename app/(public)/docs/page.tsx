import Link from "next/link";

const endpoints = [
  "/api/auth/session",
  "/api/network-functions",
  "/api/subscribers",
  "/api/slices",
  "/api/sessions/stats",
  "/api/billing/summary",
  "/api/monitoring/health",
  "/api/admin/users",
];

export default function DocsPage() {
  return (
    <main className="container py-12">
      <section className="mesh-bg overflow-hidden rounded-[24px] border border-sky-100 p-6 md:p-8">
        <p className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
          API Reference
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">Developer Documentation</h1>
        <p className="mt-2 max-w-3xl text-slate-700">Use these endpoints to integrate OSS/BSS systems, billing pipelines, and automation engines with NGCMCP.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {endpoints.map((endpoint, index) => (
            <Link key={endpoint} href={endpoint} className={`surface-card fade-in-up delay-${(index % 4) + 1} px-4 py-3 text-sm text-slate-700 lift-card`}>
              {endpoint}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
