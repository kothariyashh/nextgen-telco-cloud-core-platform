"use client";

import { useEffect, useState } from "react";

type Props = {
  placeholder?: string;
  onChange?: (value: string) => void;
};

export function SearchInput({ placeholder = "Search...", onChange }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => onChange?.(value), 250);
    return () => window.clearTimeout(timer);
  }, [value, onChange]);

  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
    />
  );
}
