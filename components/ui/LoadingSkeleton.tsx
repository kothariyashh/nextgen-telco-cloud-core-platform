export function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
    </div>
  );
}
