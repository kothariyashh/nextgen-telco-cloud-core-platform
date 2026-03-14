"use client";

type Props = {
  title?: string;
};

export function SSOButton({ title = "Continue with SSO" }: Props) {
  return <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">{title}</button>;
}
