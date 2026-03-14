import Link from "next/link";
import { platformSections } from "@/lib/navigation";

const highlights = [
  "5G Standalone Core",
  "Network Slicing",
  "AI-Powered Optimization",
  "Multi-Cloud Deployment",
  "Real-Time Analytics",
  "Zero-Touch Provisioning",
];

const useCases = [
  "Enterprise Private 5G",
  "IoT Connectivity",
  "URLLC for Industrial Automation",
  "eMBB for Broadband",
];

export function HeroLanding() {
  return (
    <main>
      <section className="container pt-12 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-[var(--gradient-brand)] p-8 shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Cloud-Native Telecom Core</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Cloud-Native 5G Core. Built for Modern CSPs.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            Deploy, manage, and scale your mobile core across cloud and edge with live observability, automation, and monetization in one control plane.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Start Free Trial
            </Link>
            <Link href="/contact" className="rounded-xl border border-slate-400 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <p className="text-center text-sm font-medium text-slate-500">Trusted by operators in 20+ countries</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm text-slate-600 md:grid-cols-5">
          {[
            "Orion Telecom",
            "NovaCore",
            "BlueWave CSP",
            "EdgeCarrier",
            "Metro5G",
          ].map((logo) => (
            <div key={logo} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              {logo}
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-semibold text-slate-900">Feature Highlights</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-semibold text-slate-900">Platform Modules</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {platformSections.map((feature) => (
            <Link key={feature.href} href={feature.href} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5">
              <p className="font-semibold text-slate-900">{feature.title}</p>
              <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-semibold text-slate-900">Use Cases</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {useCases.map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white">
          <h2 className="text-2xl font-semibold">Ready to modernize your core?</h2>
          <p className="mt-2 max-w-xl text-slate-200">Launch in days with tenant-isolated architecture, API-first operations, and AI-assisted control loops.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">
              Get Started
            </Link>
            <Link href="/contact" className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
