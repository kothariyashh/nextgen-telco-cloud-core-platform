"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  title?: string;
};

export function SignupForm({ title = "Create your workspace" }: Props) {
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
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ngcmcp_walkthrough_trigger", "1");
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
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Full name</span>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Alex M" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tenant</span>
          <input value={tenantName} onChange={(event) => setTenantName(event.target.value)} placeholder="Operator Name" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Work email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@operator.com"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
        />
      </label>

      <p className="text-xs text-slate-600">
        By creating an account you agree to platform terms and tenant security policies. Already have access?{" "}
        <Link href="/login" className="font-semibold text-slate-700 hover:text-slate-900">
          Log in
        </Link>
      </p>

      <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Creating account..." : "Create Account"}
      </button>

      {message ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p> : null}
    </form>
  );
}
