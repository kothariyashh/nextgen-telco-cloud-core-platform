"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="container py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Book a Demo</h1>
        <p className="mt-2 text-slate-600">Share your details and we will contact you with a tailored walkthrough.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <input required placeholder="Full Name" className="w-full rounded-xl border border-slate-200 px-4 py-2" />
          <input required type="email" placeholder="Work Email" className="w-full rounded-xl border border-slate-200 px-4 py-2" />
          <input required placeholder="Company" className="w-full rounded-xl border border-slate-200 px-4 py-2" />
          <textarea placeholder="What are you looking to modernize?" className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-2" />
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Submit</button>
        </form>
        {submitted ? <p className="mt-3 text-sm text-emerald-700">Thanks. Demo request received.</p> : null}
      </div>
    </main>
  );
}
