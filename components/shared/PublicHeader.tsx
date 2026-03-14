import Link from "next/link";
import { publicNav } from "@/lib/navigation";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/86 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold tracking-wide text-white">
          <span className="pulse-dot inline-flex h-2 w-2 rounded-full bg-cyan-300" />
          NGCMCP
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
          {publicNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
            Log In
          </Link>
          <Link href="/signup" className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">
            Start Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
