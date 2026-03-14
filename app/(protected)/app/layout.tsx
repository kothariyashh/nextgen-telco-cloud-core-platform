import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen lg:flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <MobileNav />
          <Header />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
        <aside className="hidden w-80 border-l border-slate-200 bg-slate-50/60 p-4 xl:block">
          <NotificationPanel />
        </aside>
      </div>
    </ToastProvider>
  );
}
