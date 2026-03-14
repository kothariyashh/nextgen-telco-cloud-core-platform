import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { AppWalkthrough } from "@/components/onboarding/AppWalkthrough";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen lg:flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col bg-[radial-gradient(circle_at_30%_10%,#ffffff_0%,#eff7fb_40%,#eaf3f9_100%)]">
          <MobileNav />
          <Header />
          <main id="main-content" className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
        <aside className="hidden w-80 border-l border-slate-200 bg-white/85 p-4 xl:block">
          <NotificationPanel />
        </aside>
      </div>
      <AppWalkthrough />
    </ToastProvider>
  );
}
