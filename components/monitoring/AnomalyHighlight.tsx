import type { ReactNode } from "react";

type Props = {
  title?: string;
  children?: ReactNode;
};

export function AnomalyHighlight({ title = "AnomalyHighlight", children }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-2 text-sm text-slate-600">{children ?? "Component scaffold ready."}</div>
    </section>
  );
}
