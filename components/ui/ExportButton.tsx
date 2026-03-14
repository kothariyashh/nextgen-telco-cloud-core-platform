"use client";

type Props = {
  href: string;
  label?: string;
};

export function ExportButton({ href, label = "Export CSV" }: Props) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      {label}
    </a>
  );
}
