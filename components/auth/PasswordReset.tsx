"use client";

import { FormEvent, useState } from "react";

type Props = {
  title?: string;
};

export function PasswordReset({ title = "Reset Access" }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? "Unable to send reset email");
      }
      setMessage("Reset email sent. Please check your inbox.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
        />
      </label>
      <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Sending..." : "Send Reset Email"}
      </button>
      {message ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p> : null}
    </form>
  );
}
