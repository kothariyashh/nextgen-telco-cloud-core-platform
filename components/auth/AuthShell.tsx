import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  sideTitle: string;
  sidePoints: string[];
};

export function AuthShell({ title, description, children, sideTitle, sidePoints }: Props) {
  return (
    <main className="container py-12">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_32px_64px_-52px_rgba(15,23,42,0.65)]">
        <div className="grid lg:grid-cols-[0.94fr_1.06fr]">
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <div className="mt-6">{children}</div>
          </div>

          <div className="dark-mesh relative p-6 md:p-8 text-white">
            <h2 className="text-2xl font-semibold">{sideTitle}</h2>
            <p className="mt-2 text-sm text-slate-200">Secure tenant-aware access for telecom operations and engineering teams.</p>
            <div className="mt-4 grid gap-2">
              {sidePoints.map((item) => (
                <div key={item} className="glass-panel px-3 py-2 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
            <div className="image-frame mt-5">
              <Image src="/visuals/module-console.svg" alt="Secure access visual" width={860} height={560} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
