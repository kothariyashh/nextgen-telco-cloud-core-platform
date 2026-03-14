import Link from "next/link";
import { publicNav } from "@/lib/navigation";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold tracking-wide text-white">
          NGCMCP
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
          {publicNav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-slate-900">
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700">
            Log In
          </Link>
          <Link href="/signup" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white">
            Start Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
