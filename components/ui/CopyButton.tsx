"use client";

import { useState } from "react";

type Props = {
  value: string;
};

export function CopyButton({ value }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
