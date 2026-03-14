"use client";

import { FormEvent, useState } from "react";

type Props = {
  title?: string;
};

export function PasswordReset({ title = "Reset Password" }: Props) {
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
      setMessage("Reset email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Sending..." : "Send Reset Email"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
