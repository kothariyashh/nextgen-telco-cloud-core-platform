export type ModulePresentation = {
  tagline: string;
  focus: string[];
  quickActions: Array<{ label: string; href: string }>;
  image: string;
  imageAlt: string;
  chips: string[];
};

const preset: Record<string, ModulePresentation> = {
  dashboard: {
    tagline: "Realtime command center for core network health, sessions, and operational KPIs.",
    focus: ["KPI Snapshot", "Alarm Pressure", "Service Health", "Traffic Trends"],
    quickActions: [
      { label: "Open Monitoring", href: "/app/monitoring" },
      { label: "View Active Sessions", href: "/app/sessions" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "Dashboard control console",
    chips: ["NOC", "Realtime", "KPI"],
  },
  "network-functions": {
    tagline: "Deploy and scale CNFs/VNFs for 4G EPC and 5G SA with health and orchestration controls.",
    focus: ["Lifecycle", "Scale", "Health", "Logs"],
    quickActions: [
      { label: "Deploy NF", href: "/app/network-functions" },
      { label: "Orchestration Jobs", href: "/app/orchestration" },
    ],
    image: "/visuals/telecom-architecture.svg",
    imageAlt: "Network function architecture",
    chips: ["AMF", "SMF", "UPF"],
  },
  slices: {
    tagline: "Define, activate, and optimize slices for eMBB, URLLC, IoT, and enterprise domains.",
    focus: ["Templates", "QoS", "Subscriber Assignment", "SLA"],
    quickActions: [
      { label: "Create Slice", href: "/app/slices/new" },
      { label: "Policy Rules", href: "/app/policies" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "Slice operations panel",
    chips: ["eMBB", "URLLC", "IoT"],
  },
  subscribers: {
    tagline: "Manage subscriber lifecycle, SIM provisioning, roaming profiles, and service status.",
    focus: ["SIM", "Roaming", "Plans", "Devices"],
    quickActions: [
      { label: "Add Subscriber", href: "/app/subscribers/new" },
      { label: "Session View", href: "/app/sessions" },
    ],
    image: "/visuals/telecom-hero.svg",
    imageAlt: "Subscriber management visual",
    chips: ["IMSI", "MSISDN", "SIM"],
  },
  sessions: {
    tagline: "Track active and historical session paths, QoS state, traffic counters, and lifecycle events.",
    focus: ["PDU", "IMS", "Events", "Termination"],
    quickActions: [
      { label: "Session Stats", href: "/api/sessions/stats" },
      { label: "Monitoring", href: "/app/monitoring" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "Session analytics visual",
    chips: ["QoS", "IP", "UPF"],
  },
  policies: {
    tagline: "Govern QoS, access, charging, and traffic shaping policies with versioned controls.",
    focus: ["Rules", "Priority", "Activation", "Audit"],
    quickActions: [
      { label: "Create Policy", href: "/app/policies/new" },
      { label: "QoS Profiles", href: "/api/policies/qos-profiles" },
    ],
    image: "/visuals/telecom-architecture.svg",
    imageAlt: "Policy control visual",
    chips: ["QoS", "Charging", "Access"],
  },
  billing: {
    tagline: "Run online charging and offline billing with credit tracking and CDR export workflows.",
    focus: ["OCS", "CDR", "Credits", "Exports"],
    quickActions: [
      { label: "CDR Records", href: "/app/billing/records" },
      { label: "Export Billing", href: "/app/billing/exports" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "Billing visual",
    chips: ["OCS", "CDR", "Revenue"],
  },
  monitoring: {
    tagline: "Observe metrics, logs, traces, and alarms with streaming updates and root-cause context.",
    focus: ["Metrics", "Logs", "Traces", "Alerts"],
    quickActions: [
      { label: "Alert Rules", href: "/app/monitoring/alerts" },
      { label: "Trace Explorer", href: "/app/monitoring/traces" },
    ],
    image: "/visuals/telecom-hero.svg",
    imageAlt: "Monitoring visual",
    chips: ["P95", "Anomaly", "Alert"],
  },
  security: {
    tagline: "Enforce security policies, review threats, and inspect tenant audit trails.",
    focus: ["Policy", "Threats", "Audit", "Zero Trust"],
    quickActions: [
      { label: "Audit Logs", href: "/app/security/audit" },
      { label: "Run Security Scan", href: "/api/security/scan" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "Security visual",
    chips: ["MFA", "RBAC", "mTLS"],
  },
  compliance: {
    tagline: "Operate GDPR requests and regulatory controls with structured reporting pipelines.",
    focus: ["GDPR", "Regulatory", "Reports", "Checks"],
    quickActions: [
      { label: "Run Compliance Check", href: "/api/compliance/check" },
      { label: "View Reports", href: "/api/compliance/reports" },
    ],
    image: "/visuals/telecom-architecture.svg",
    imageAlt: "Compliance visual",
    chips: ["GDPR", "Audit", "Governance"],
  },
  orchestration: {
    tagline: "Execute deploy, scale, heal, migrate, and update workflows for core workloads.",
    focus: ["Deploy", "Scale", "Self-heal", "Rollout"],
    quickActions: [
      { label: "Jobs Queue", href: "/api/orchestration/jobs" },
      { label: "Network Functions", href: "/app/network-functions" },
    ],
    image: "/visuals/telecom-architecture.svg",
    imageAlt: "Orchestration visual",
    chips: ["Kubernetes", "Helm", "Automation"],
  },
  edge: {
    tagline: "Manage edge clusters and nodes for low-latency service delivery.",
    focus: ["Clusters", "Nodes", "Heartbeat", "Workloads"],
    quickActions: [
      { label: "Regions", href: "/api/admin/regions" },
      { label: "Topology", href: "/app/topology" },
    ],
    image: "/visuals/telecom-hero.svg",
    imageAlt: "Edge management visual",
    chips: ["Edge", "Latency", "Zone"],
  },
  ai: {
    tagline: "Drive intent-based automation with anomaly, prediction, and optimization insights.",
    focus: ["Intent", "Anomalies", "Predictions", "Optimization"],
    quickActions: [
      { label: "Intent Studio", href: "/app/ai/intent" },
      { label: "Model Registry", href: "/app/ai/models" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "AI center visual",
    chips: ["Intent", "ML", "Automation"],
  },
  marketplace: {
    tagline: "Browse and install validated CNF/VNF packages from ecosystem partners.",
    focus: ["Packages", "Install", "Verification", "Lifecycle"],
    quickActions: [
      { label: "Installed Packages", href: "/api/marketplace/installs" },
      { label: "Browse Marketplace", href: "/app/marketplace" },
    ],
    image: "/visuals/telecom-hero.svg",
    imageAlt: "Marketplace visual",
    chips: ["CNF", "VNF", "Partners"],
  },
  topology: {
    tagline: "Visualize region and data-center connectivity with service link health context.",
    focus: ["Regions", "DC Links", "Capacity", "Path Health"],
    quickActions: [
      { label: "Regions API", href: "/api/admin/regions" },
      { label: "Edge Module", href: "/app/edge" },
    ],
    image: "/visuals/telecom-architecture.svg",
    imageAlt: "Topology visual",
    chips: ["Region", "AZ", "Link"],
  },
  configurations: {
    tagline: "Centralize platform settings and operational defaults across modules.",
    focus: ["Configuration", "Templates", "Guardrails", "Versioning"],
    quickActions: [
      { label: "Security Policies", href: "/api/security/policies" },
      { label: "Admin Panel", href: "/app/admin" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "Configuration visual",
    chips: ["Config", "Audit", "Control"],
  },
  admin: {
    tagline: "Administer tenants, users, roles, and regional expansion from one panel.",
    focus: ["Tenants", "Users", "Roles", "Regions"],
    quickActions: [
      { label: "Tenant Management", href: "/app/admin/tenants" },
      { label: "User Management", href: "/app/admin/users" },
    ],
    image: "/visuals/telecom-hero.svg",
    imageAlt: "Admin operations visual",
    chips: ["RBAC", "Invite", "Governance"],
  },
  settings: {
    tagline: "Manage account profile, API keys, MFA, and enterprise SSO integrations.",
    focus: ["Profile", "API Keys", "MFA", "SSO"],
    quickActions: [
      { label: "API Keys", href: "/app/settings/api-keys" },
      { label: "MFA", href: "/app/settings/mfa" },
    ],
    image: "/visuals/module-console.svg",
    imageAlt: "Settings visual",
    chips: ["Identity", "Security", "Access"],
  },
};

const fallback: ModulePresentation = {
  tagline: "Unified module workspace for telecom operations and platform governance.",
  focus: ["Insights", "Controls", "Events", "Compliance"],
  quickActions: [{ label: "Open Dashboard", href: "/app/dashboard" }],
  image: "/visuals/module-console.svg",
  imageAlt: "Module visual",
  chips: ["Cloud Native", "Realtime", "Tenant"],
};

export function getModulePresentation(routePath: string): ModulePresentation {
  const section = routePath.split("/")[2] ?? "dashboard";
  return preset[section] ?? fallback;
}
