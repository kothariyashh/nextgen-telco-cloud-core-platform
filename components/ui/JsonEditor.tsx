"use client";

import { useState } from "react";

type Props = {
  value?: unknown;
  onChange?: (value: unknown) => void;
};

export function JsonEditor({ value, onChange }: Props) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));

  return (
    <textarea
      value={text}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        try {
          const parsed = JSON.parse(next);
          onChange?.(parsed);
        } catch {
          // ignore parse errors while typing
        }
      }}
      className="min-h-52 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs"
    />
  );
}
