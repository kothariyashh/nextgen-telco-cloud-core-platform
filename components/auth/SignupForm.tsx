"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  title?: string;
};

export function SignupForm({ title = "Create Account" }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [tenantName, setTenantName] = useState("Demo Operator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          tenantName,
          email,
          password,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? "Signup failed");
      }
      router.push("/app/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <input
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Full Name"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <input
        value={tenantName}
        onChange={(event) => setTenantName(event.target.value)}
        placeholder="Tenant Name"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Work Email"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password (min 8 chars)"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Creating account..." : "Create Account"}
      </button>
      {message ? <p className="text-sm text-rose-700">{message}</p> : null}
    </form>
  );
}
