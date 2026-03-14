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
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Developer Docs</h1>
        <p className="mt-2 text-slate-600">Public reference for core endpoints and integration patterns.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {endpoints.map((endpoint) => (
            <Link key={endpoint} href={endpoint} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {endpoint}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
