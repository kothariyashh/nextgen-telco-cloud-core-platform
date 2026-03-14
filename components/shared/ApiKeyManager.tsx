"use client";

import { FormEvent, useState } from "react";

export function ApiKeyManager() {
  const [name, setName] = useState("Automation Key");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function createKey(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/auth/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes: ["network:write", "monitoring:read"] }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body?.message ?? "Failed to create key");
      return;
    }
    setCreatedKey(body?.data?.api_key ?? null);
    setMessage("Key created.");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Create API Key</h3>
      <form onSubmit={createKey} className="mt-3 flex flex-wrap gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
        <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">Generate</button>
      </form>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
      {createdKey ? <p className="mt-1 rounded-lg bg-emerald-50 p-2 font-mono text-xs text-emerald-700">{createdKey}</p> : null}
    </section>
  );
}
