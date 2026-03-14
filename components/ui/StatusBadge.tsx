import { cn } from "@/lib/utils";

type Props = {
  status: string;
};

const colorMap: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  operational: "bg-emerald-100 text-emerald-800 border-emerald-200",
  deploying: "bg-amber-100 text-amber-800 border-amber-200",
  queued: "bg-amber-100 text-amber-800 border-amber-200",
  degraded: "bg-orange-100 text-orange-800 border-orange-200",
  failed: "bg-rose-100 text-rose-800 border-rose-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  critical: "bg-rose-100 text-rose-800 border-rose-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  info: "bg-sky-100 text-sky-800 border-sky-200",
};

export function StatusBadge({ status }: Props) {
  const safe = status?.toLowerCase() || "unknown";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        colorMap[safe] ?? "bg-slate-100 text-slate-700 border-slate-200",
      )}
    >
      {safe}
    </span>
  );
}
