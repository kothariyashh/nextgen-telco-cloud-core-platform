"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type WalkthroughStep = {
  id: string;
  title: string;
  description: string;
  why: string;
  actionLabel: string;
  actionHref: string;
};

const steps: WalkthroughStep[] = [
  {
    id: "dashboard",
    title: "Read KPI Overview First",
    description:
      "Start on dashboard KPI cards to understand active sessions, network function health, and critical alarm pressure.",
    why: "This gives a quick operational pulse before taking any action.",
    actionLabel: "Open Dashboard",
    actionHref: "/app/dashboard",
  },
  {
    id: "alerts",
    title: "Check Active Alerts",
    description:
      "Review alerts to prioritize incidents. Focus on critical and degraded states before running changes.",
    why: "Prevents applying automation while unresolved faults are active.",
    actionLabel: "Open Monitoring Alerts",
    actionHref: "/app/monitoring/alerts",
  },
  {
    id: "network-functions",
    title: "Inspect Network Functions",
    description:
      "Use Network Functions to verify AMF/SMF/UPF status, version, and deployment condition before scaling.",
    why: "Ensures core services are healthy and capacity decisions are accurate.",
    actionLabel: "Open Network Functions",
    actionHref: "/app/network-functions",
  },
  {
    id: "subscribers",
    title: "Manage Subscriber Impact",
    description:
      "Use Subscribers to identify affected IMSI/MSISDN records, plan, and service state before policy or slice changes.",
    why: "Keeps user experience in control while modifying network behavior.",
    actionLabel: "Open Subscribers",
    actionHref: "/app/subscribers",
  },
  {
    id: "monitoring",
    title: "Validate Metrics and Traces",
    description:
      "Correlate metrics, logs, and traces to verify whether observed issues are local, regional, or systemic.",
    why: "Moment-to-moment clarity improves troubleshooting speed and trust.",
    actionLabel: "Open Monitoring",
    actionHref: "/app/monitoring",
  },
  {
    id: "ai",
    title: "Use AI with Human Control",
    description:
      "In AI Intent, review confidence score and 'Why this?' explanation, then confirm before applying actions.",
    why: "Human-in-the-loop keeps operations safe and transparent.",
    actionLabel: "Open AI Intent",
    actionHref: "/app/ai/intent",
  },
  {
    id: "billing",
    title: "Close the Loop with Billing",
    description:
      "Validate CDR and credit impact after operational changes to ensure service and revenue alignment.",
    why: "Connects technical operations with business outcomes.",
    actionLabel: "Open Billing",
    actionHref: "/app/billing",
  },
];

export function AppWalkthrough() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const step = useMemo(() => steps[index], [index]);
  const isDashboard = pathname === "/app/dashboard";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpen = () => {
      setIndex(0);
      setOpen(true);
    };

    window.addEventListener("ngcmcp:open-walkthrough", handleOpen);
    return () => window.removeEventListener("ngcmcp:open-walkthrough", handleOpen);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const trigger = sessionStorage.getItem("ngcmcp_walkthrough_trigger") === "1";
    const completed = localStorage.getItem("ngcmcp_walkthrough_completed") === "1";
    const seen = localStorage.getItem("ngcmcp_walkthrough_seen") === "1";

    if (isDashboard && (trigger || (!completed && !seen))) {
      window.dispatchEvent(new Event("ngcmcp:open-walkthrough"));
      localStorage.setItem("ngcmcp_walkthrough_seen", "1");
      if (trigger) {
        sessionStorage.removeItem("ngcmcp_walkthrough_trigger");
      }
    }
  }, [isDashboard]);

  function closeTour() {
    setIndex(0);
    setOpen(false);
  }

  function completeTour() {
    localStorage.setItem("ngcmcp_walkthrough_completed", "1");
    localStorage.setItem("ngcmcp_walkthrough_seen", "1");
    setIndex(0);
    setOpen(false);
  }

  function restartTour() {
    setIndex(0);
    setOpen(true);
  }

  function next() {
    if (index >= steps.length - 1) {
      completeTour();
      return;
    }
    setIndex((prev) => prev + 1);
  }

  function back() {
    setIndex((prev) => Math.max(0, prev - 1));
  }

  return (
    <>
      <button
        type="button"
        onClick={restartTour}
        className="fixed bottom-4 right-4 z-30 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md hover:bg-slate-50"
      >
        Start Walkthrough
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-slate-900/40 p-3 md:p-6">
          <div className="mx-auto mt-3 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:mt-10">
            <div className="dark-mesh px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-200">App Walkthrough</p>
              <h2 className="mt-1 text-xl font-semibold">How to use the dashboard and modules</h2>
              <p className="mt-1 text-sm text-slate-200">Step {index + 1} of {steps.length}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-white/20">
                <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[1fr_260px]">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{step.description}</p>

                <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">Why this step matters</summary>
                  <p className="mt-2 text-sm text-slate-600">{step.why}</p>
                </details>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(step.actionHref);
                      closeTour();
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    {step.actionLabel}
                  </button>

                  <Link href="/app/dashboard" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    Go to Dashboard
                  </Link>
                </div>
              </div>

              <aside className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quick Guide</p>
                <div className="mt-2 space-y-2">
                  {steps.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndex(idx)}
                      className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs font-medium ${
                        idx === index
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {idx + 1}. {item.title}
                    </button>
                  ))}
                </div>
              </aside>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={back}
                  disabled={index === 0}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  {index === steps.length - 1 ? "Finish" : "Next"}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeTour}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={completeTour}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
