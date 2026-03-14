"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-20 block border-b border-slate-200 bg-white/95 p-2 lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {appNav.slice(0, 8).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
