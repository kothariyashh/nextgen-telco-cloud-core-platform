type Props = {
  score: number;
  label?: string;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tone(score: number) {
  if (score >= 80) {
    return {
      track: "bg-emerald-100",
      fill: "bg-emerald-500",
      text: "text-emerald-700",
    };
  }
  if (score >= 55) {
    return {
      track: "bg-amber-100",
      fill: "bg-amber-500",
      text: "text-amber-700",
    };
  }
  return {
    track: "bg-rose-100",
    fill: "bg-rose-500",
    text: "text-rose-700",
  };
}

export function ConfidenceBar({ score, label = "Confidence" }: Props) {
  const safe = clamp(score);
  const colors = tone(safe);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={colors.text}>{safe}%</span>
      </div>
      <div className={`h-2 w-full rounded-full ${colors.track}`}>
        <div className={`h-2 rounded-full ${colors.fill}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}
