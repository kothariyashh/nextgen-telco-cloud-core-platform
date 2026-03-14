"use client";

type Props = {
  from?: string;
  to?: string;
  onChange?: (range: { from: string; to: string }) => void;
};

export function DateRangePicker({ from = "", to = "", onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(event) => onChange?.({ from: event.target.value, to })}
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
      />
      <span className="text-sm text-slate-500">to</span>
      <input
        type="date"
        value={to}
        onChange={(event) => onChange?.({ from, to: event.target.value })}
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
      />
    </div>
  );
}
