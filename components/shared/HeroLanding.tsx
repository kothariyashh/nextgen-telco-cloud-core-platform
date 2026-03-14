import Image from "next/image";
import Link from "next/link";
import { platformSections } from "@/lib/navigation";

const highlights = [
  {
    title: "5G Standalone Core",
    detail: "AMF, SMF, UPF, PCF, UDM, AUSF, NRF, NSSF with cloud-native lifecycle controls.",
  },
  {
    title: "Network Slicing",
    detail: "Design eMBB, URLLC, and IoT slices with policy and subscriber assignment controls.",
  },
  {
    title: "AI-Powered Optimization",
    detail: "Intent-based automation, anomaly surfacing, and predictive maintenance recommendations.",
  },
  {
    title: "Multi-Cloud Deployment",
    detail: "Operate across AWS, Azure, GCP, on-prem, and edge clusters from one control plane.",
  },
  {
    title: "Real-Time Analytics",
    detail: "Live metrics, alarms, traces, and audit context for NOC and network engineering teams.",
  },
  {
    title: "Zero-Touch Provisioning",
    detail: "Automated deployment pipelines for CNF/VNF rollout and self-heal orchestration.",
  },
];

const useCases = [
  "Enterprise Private 5G",
  "IoT Connectivity and Massive Sensor Fleets",
  "URLLC for Industrial Automation",
  "eMBB for Broadband Expansion",
];

const differentiators = [
  "Born cloud-native architecture",
  "AI-first control loops",
  "Open package marketplace",
  "Intent-Based Networking workflows",
];

const tiers = [
  {
    name: "Starter",
    value: "$999/mo",
    caps: "Up to 10K subscribers",
    extras: "10 NFs, 5 slices",
  },
  {
    name: "Growth",
    value: "$4,999/mo",
    caps: "Up to 100K subscribers",
    extras: "50 NFs, 25 slices",
  },
  {
    name: "Enterprise",
    value: "Custom",
    caps: "Unlimited scale",
    extras: "Dedicated support + custom roadmap",
  },
];

const testimonials = [
  {
    quote: "We reduced service rollout time from weeks to days while improving fault response visibility.",
    by: "VP Network Engineering, Regional CSP",
  },
  {
    quote: "The platform gives our NOC team one pane of glass for 4G EPC and 5G Core operations.",
    by: "Director of Operations, Multi-country Operator",
  },
];

export function HeroLanding() {
  const logos = ["Orion Telecom", "NovaCore", "BlueWave CSP", "EdgeCarrier", "Metro5G", "SkySpan Mobile"];

  return (
    <main className="pb-12">
      <section className="container pt-10 pb-12">
        <div className="mesh-bg relative overflow-hidden rounded-[26px] border border-sky-100 p-7 shadow-[0_32px_74px_-58px_rgba(8,47,73,0.85)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="fade-in-up space-y-6">
              <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
                Cloud-Native Telecom Core
              </p>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Cloud-Native 5G Core.
                <br />
                Built for Modern CSPs.
              </h1>
              <p className="max-w-2xl text-lg text-slate-700">
                Deploy, manage, monitor, and monetize your 4G/5G mobile core with real-time observability, policy automation, and multi-cloud orchestration.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Start Free Trial
                </Link>
                <Link href="/contact" className="rounded-xl border border-slate-300 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800">
                  Book a Demo
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="kpi-tile fade-in-up delay-1">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Availability</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">99.99%</p>
                </div>
                <div className="kpi-tile fade-in-up delay-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Live Sessions</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">1.24M</p>
                </div>
                <div className="kpi-tile fade-in-up delay-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Alerts MTTR</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">8m</p>
                </div>
              </div>
            </div>

            <div className="fade-in-up delay-2">
              <div className="image-frame float-y">
                <Image
                  src="/visuals/telecom-hero.svg"
                  alt="NGCMCP dashboard and network intelligence visual"
                  width={1200}
                  height={760}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <p className="mb-3 text-center text-sm font-medium text-slate-500">Trusted by operators in 20+ countries</p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white py-3">
          <div className="marquee-track">
            {[...logos, ...logos].map((logo, index) => (
              <div key={`${logo}-${index}`} className="mx-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm text-slate-700">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-semibold text-slate-900">Feature Highlights</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item, idx) => (
            <article key={item.title} className={`surface-card lift-card p-4 fade-in-up delay-${(idx % 4) + 1}`}>
              <p className="text-base font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-card p-5">
            <h2 className="text-2xl font-semibold text-slate-900">Architecture Overview</h2>
            <p className="mt-2 text-sm text-slate-600">
              Service-based telecom core architecture built on Kubernetes microservices with observability, policy, and billing layers integrated.
            </p>
            <div className="image-frame mt-4">
              <Image
                src="/visuals/telecom-architecture.svg"
                alt="Microservices architecture for AMF, SMF, UPF, PCF and orchestration"
                width={1200}
                height={780}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="surface-card p-5">
              <h3 className="text-lg font-semibold text-slate-900">Use Cases</h3>
              <div className="mt-3 grid gap-2">
                {useCases.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="surface-card p-5">
              <h3 className="text-lg font-semibold text-slate-900">Differentiators</h3>
              <div className="mt-3 grid gap-2">
                {differentiators.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-semibold text-slate-900">Platform Modules</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {platformSections.map((feature) => (
            <Link key={feature.href} href={feature.href} className="surface-card lift-card p-4">
              <p className="text-base font-semibold text-slate-900">{feature.title}</p>
              <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-semibold text-slate-900">Pricing</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.name} className="surface-card p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{tier.name}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{tier.value}</p>
              <p className="mt-2 text-sm text-slate-700">{tier.caps}</p>
              <p className="text-sm text-slate-500">{tier.extras}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-semibold text-slate-900">What Operators Say</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <blockquote key={item.by} className="surface-card p-5">
              <p className="text-base text-slate-700">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-3 text-sm font-semibold text-slate-900">{item.by}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="container pb-8">
        <div className="dark-mesh relative overflow-hidden rounded-[24px] border border-sky-900/50 p-8 text-white">
          <h2 className="text-3xl font-semibold">Ready to modernize your core?</h2>
          <p className="mt-2 max-w-2xl text-slate-200">Get production-ready cloud-native core operations with secure multi-tenant architecture and API-first workflows.</p>
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
