"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const iconByTitle: Record<string, string> = {
  Dashboard: "DS",
  "Network Functions": "NF",
  Slices: "SL",
  Subscribers: "SU",
  Sessions: "SE",
  Policies: "PO",
  Billing: "BL",
  Monitoring: "MO",
  Security: "SC",
  Compliance: "CP",
  Orchestration: "OR",
  Edge: "ED",
  AI: "AI",
  Marketplace: "MP",
  Topology: "TP",
  Configurations: "CF",
  Admin: "AD",
  Settings: "ST",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[18.5rem] flex-col border-r border-slate-200 bg-white/90 px-4 py-4 backdrop-blur lg:flex">
      <Link href="/app/dashboard" className="dark-mesh mb-5 rounded-2xl border border-sky-900/40 px-4 py-4 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-200">NGCMCP</p>
        <p className="mt-1 text-lg font-semibold">Control Plane</p>
        <p className="mt-2 text-xs text-sky-100">5G/4G Core Operations</p>
      </Link>

      <nav className="space-y-1 overflow-y-auto pr-1">
        {appNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-medium transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "inline-grid h-6 w-8 place-items-center rounded-md text-[10px] font-semibold",
                  active ? "bg-white/15 text-sky-100" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                )}
              >
                {iconByTitle[item.title] ?? ".."}
              </span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Realtime status</p>
        <p className="mt-1">All primary modules operational.</p>
      </div>
    </aside>
  );
}
