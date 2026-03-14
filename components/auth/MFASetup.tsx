"use client";

import { FormEvent, useState } from "react";

type Props = {
  title?: string;
};

export function MFASetup({ title = "MFA Setup" }: Props) {
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function enroll() {
    const response = await fetch("/api/auth/mfa/enroll", { method: "POST" });
    const body = await response.json();
    setSecret(body?.data?.secret ?? null);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const body = await response.json();
    setMessage(response.ok ? "MFA verified." : body?.message ?? "Verification failed.");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <button onClick={enroll} className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
        Enroll TOTP
      </button>
      {secret ? <p className="mt-2 text-xs text-slate-600">Secret: {secret}</p> : null}
      <form onSubmit={verify} className="mt-3 space-y-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter 6-digit code"
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
        />
        <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Verify</button>
      </form>
      {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
