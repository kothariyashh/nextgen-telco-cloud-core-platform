import type { ReactNode } from "react";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { PublicHeader } from "@/components/shared/PublicHeader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div id="main-content">{children}</div>
      <PublicFooter />
    </div>
  );
}
