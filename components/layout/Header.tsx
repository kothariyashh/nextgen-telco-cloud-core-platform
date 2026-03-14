import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">NextGen Mobile Core</p>
          <p className="text-sm text-slate-700">Tenant-aware operations center</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/app/settings/profile" className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-100">
            Profile
          </Link>
          <Link href="/api/auth/logout" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white">
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
