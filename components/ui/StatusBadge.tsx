import { cn } from "@/lib/utils";

type Props = {
  status: string;
};

const colorMap: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  deploying: "bg-amber-100 text-amber-800",
  degraded: "bg-orange-100 text-orange-800",
  failed: "bg-rose-100 text-rose-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-rose-100 text-rose-800",
  resolved: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: Props) {
  const safe = status?.toLowerCase() || "unknown";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", colorMap[safe] ?? "bg-slate-100 text-slate-700")}>
      {safe}
    </span>
  );
}
