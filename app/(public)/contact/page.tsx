"use client";

import Image from "next/image";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="container py-12">
      <section className="mesh-bg overflow-hidden rounded-[24px] border border-sky-100 p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Book a Demo</h1>
            <p className="mt-2 text-slate-700">Share your telecom modernization goals and we will prepare a product walkthrough tailored to your architecture.</p>

            <form
              className="mt-6 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <input required placeholder="Full Name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2" />
              <input required type="email" placeholder="Work Email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2" />
              <input required placeholder="Company" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2" />
              <textarea placeholder="What are you looking to modernize?" className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-2" />
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Submit</button>
            </form>
            {submitted ? <p className="mt-3 text-sm text-emerald-700">Thanks. Demo request received.</p> : null}
          </div>

          <div className="image-frame float-y-slow">
            <Image src="/visuals/telecom-hero.svg" alt="Product demo visual" width={1200} height={760} className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
    </main>
  );
}
