"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-20 block border-b border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {appNav.slice(0, 10).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700",
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
