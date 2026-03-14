"use client";

import { useState } from "react";

type Props = {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDialog({ title, description, confirmLabel = "Confirm", onConfirm }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700">
        {confirmLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onConfirm();
                  setOpen(false);
                }}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
