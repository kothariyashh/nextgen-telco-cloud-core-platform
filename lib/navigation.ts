import type { NavItem, PlatformFeature } from "@/types";

export const publicNav: NavItem[] = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "Docs", href: "/docs" },
  { title: "Status", href: "/status" },
  { title: "Contact", href: "/contact" },
];

export const platformSections: PlatformFeature[] = [
  {
    title: "Dashboard",
    description: "Real-time KPI and platform health visibility.",
    href: "/app/dashboard",
    api: ["/api/monitoring/health", "/api/monitoring/metrics/summary"],
  },
  {
    title: "Network Functions",
    description: "Deploy and monitor AMF, SMF, UPF and full 4G/5G core NFs.",
    href: "/app/network-functions",
    api: ["/api/network-functions", "/api/network-functions/[id]/health"],
  },
  {
    title: "Network Slices",
    description: "Create and assign IoT, eMBB, URLLC slices.",
    href: "/app/slices",
    api: ["/api/slices", "/api/slices/templates"],
  },
  {
    title: "Subscribers",
    description: "Subscriber lifecycle, SIM provisioning, roaming, sessions.",
    href: "/app/subscribers",
    api: ["/api/subscribers", "/api/subscribers/[id]/sim"],
  },
  {
    title: "Billing",
    description: "OCS charging, CDR records, and credit balances.",
    href: "/app/billing",
    api: ["/api/billing/summary", "/api/billing/cdr"],
  },
  {
    title: "Monitoring",
    description: "Metrics, logs, traces, alerts and fault response.",
    href: "/app/monitoring",
    api: ["/api/monitoring/metrics", "/api/faults/alarms"],
  },
  {
    title: "AI & Automation",
    description: "Intent-based controls, anomalies, predictive recommendations.",
    href: "/app/ai",
    api: ["/api/ai/intent", "/api/ai/optimizations"],
  },
  {
    title: "Marketplace",
    description: "Browse and install third-party CNF/VNF packages.",
    href: "/app/marketplace",
    api: ["/api/marketplace", "/api/marketplace/installs"],
  },
  {
    title: "Admin",
    description: "Tenant/user management, RBAC, regions and governance.",
    href: "/app/admin",
    api: ["/api/admin/users", "/api/admin/tenants"],
  },
];

export const appNav: NavItem[] = [
  { title: "Dashboard", href: "/app/dashboard" },
  { title: "Network Functions", href: "/app/network-functions" },
  { title: "Slices", href: "/app/slices" },
  { title: "Subscribers", href: "/app/subscribers" },
  { title: "Sessions", href: "/app/sessions" },
  { title: "Policies", href: "/app/policies" },
  { title: "Billing", href: "/app/billing" },
  { title: "Monitoring", href: "/app/monitoring" },
  { title: "Security", href: "/app/security" },
  { title: "Compliance", href: "/app/compliance" },
  { title: "Orchestration", href: "/app/orchestration" },
  { title: "Edge", href: "/app/edge" },
  { title: "AI", href: "/app/ai" },
  { title: "Marketplace", href: "/app/marketplace" },
  { title: "Topology", href: "/app/topology" },
  { title: "Configurations", href: "/app/configurations" },
  { title: "Admin", href: "/app/admin" },
  { title: "Settings", href: "/app/settings" },
];
