"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/70 p-4 backdrop-blur lg:flex">
      <Link href="/app/dashboard" className="mb-6 rounded-xl bg-slate-900 px-4 py-3 text-lg font-semibold text-white">
        NGCMCP Control Plane
      </Link>
      <nav className="space-y-1 overflow-y-auto">
        {appNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
