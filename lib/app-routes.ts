export type AppRouteMeta = {
  title: string;
  description: string;
  endpoint?: string;
  createHref?: string;
};

export const appRouteRegistry: Record<string, AppRouteMeta> = {
  "/app/dashboard": {
    title: "Dashboard",
    description: "Real-time platform KPIs, health overview, and active alert context.",
    endpoint: "/api/monitoring/health",
  },
  "/app/network-functions": {
    title: "Network Functions",
    description: "Deploy and manage 4G/5G core network functions.",
    endpoint: "/api/network-functions",
  },
  "/app/network-functions/[id]": {
    title: "Network Function Detail",
    description: "Inspect metrics, logs, config, and health for a network function.",
    endpoint: "/api/network-functions/[id]",
  },
  "/app/slices": {
    title: "Network Slices",
    description: "Provision and monitor tenant network slices for service classes.",
    endpoint: "/api/slices",
    createHref: "/app/slices/new",
  },
  "/app/slices/new": {
    title: "Create Slice",
    description: "Define QoS profile, capacity, and assignment limits for a slice.",
    endpoint: "/api/slices/templates",
  },
  "/app/slices/[id]": {
    title: "Slice Detail",
    description: "Review assigned subscribers, metrics, and lifecycle controls.",
    endpoint: "/api/slices/[id]",
  },
  "/app/subscribers": {
    title: "Subscribers",
    description: "Manage subscriber lifecycle, plan profiles, and SIM states.",
    endpoint: "/api/subscribers",
    createHref: "/app/subscribers/new",
  },
  "/app/subscribers/new": {
    title: "Add Subscriber",
    description: "Create a subscriber profile with plan and roaming configuration.",
    endpoint: "/api/subscribers",
  },
  "/app/subscribers/[id]": {
    title: "Subscriber Profile",
    description: "Subscriber profile including SIM, devices, sessions, and billing.",
    endpoint: "/api/subscribers/[id]",
  },
  "/app/sessions": {
    title: "Sessions",
    description: "View active and historical PDU/IMS sessions.",
    endpoint: "/api/sessions",
  },
  "/app/sessions/[id]": {
    title: "Session Detail",
    description: "Inspect traffic counters, events, and controls for a single session.",
    endpoint: "/api/sessions/[id]",
  },
  "/app/policies": {
    title: "Policies",
    description: "Create and govern QoS, access, and charging policies.",
    endpoint: "/api/policies",
    createHref: "/app/policies/new",
  },
  "/app/policies/new": {
    title: "Create Policy",
    description: "Build a policy rule with conditions, actions, and priorities.",
    endpoint: "/api/policies",
  },
  "/app/policies/[id]": {
    title: "Edit Policy",
    description: "Edit policy logic, activation state, and effective order.",
    endpoint: "/api/policies/[id]",
  },
  "/app/billing": {
    title: "Billing Overview",
    description: "Monitor OCS sessions, CDR totals, and subscriber balances.",
    endpoint: "/api/billing/summary",
  },
  "/app/billing/records": {
    title: "CDR Records",
    description: "Browse rated records for usage and charging audit trails.",
    endpoint: "/api/billing/cdr",
  },
  "/app/billing/exports": {
    title: "Billing Exports",
    description: "Export CDR data in CSV or JSON formats.",
    endpoint: "/api/billing/cdr",
  },
  "/app/monitoring": {
    title: "Monitoring",
    description: "Unified metrics, logs, traces, and health surfaces.",
    endpoint: "/api/monitoring/health",
  },
  "/app/monitoring/alerts": {
    title: "Alert Management",
    description: "Define and operate threshold and anomaly alerts.",
    endpoint: "/api/monitoring/alerts",
  },
  "/app/monitoring/logs": {
    title: "Log Explorer",
    description: "Filter and inspect distributed platform logs.",
    endpoint: "/api/monitoring/logs",
  },
  "/app/monitoring/traces": {
    title: "Trace Explorer",
    description: "Trace request paths and span timing across services.",
    endpoint: "/api/monitoring/traces",
  },
  "/app/security": {
    title: "Security",
    description: "Control policies, review threats, and validate posture.",
    endpoint: "/api/security/policies",
  },
  "/app/security/audit": {
    title: "Audit Logs",
    description: "Immutable action history for users and service accounts.",
    endpoint: "/api/security/audit-logs",
  },
  "/app/compliance": {
    title: "Compliance",
    description: "GDPR workflows and regulatory reporting operations.",
    endpoint: "/api/compliance/reports",
  },
  "/app/orchestration": {
    title: "Orchestration",
    description: "Deploy, scale, heal, migrate, and update workloads.",
    endpoint: "/api/orchestration/jobs",
  },
  "/app/edge": {
    title: "Edge Clusters",
    description: "Manage edge clusters, nodes, and workload status.",
    endpoint: "/api/admin/regions",
  },
  "/app/ai": {
    title: "AI Center",
    description: "Predictions, anomaly flags, and optimization actions.",
    endpoint: "/api/ai/predictions",
  },
  "/app/ai/intent": {
    title: "Intent-Based Networking",
    description: "Translate natural-language intents into validated actions.",
    endpoint: "/api/ai/intent",
  },
  "/app/ai/models": {
    title: "Model Registry",
    description: "Track model versions, artifacts, and deployment state.",
    endpoint: "/api/ai/models",
  },
  "/app/marketplace": {
    title: "Marketplace",
    description: "Browse and install verified VNF/CNF packages.",
    endpoint: "/api/marketplace",
  },
  "/app/marketplace/[id]": {
    title: "Package Detail",
    description: "Review package metadata, pricing, and install controls.",
    endpoint: "/api/marketplace/[id]",
  },
  "/app/topology": {
    title: "Topology",
    description: "Visualize region, data-center, and network link topology.",
    endpoint: "/api/admin/regions",
  },
  "/app/configurations": {
    title: "Configurations",
    description: "Manage system-wide platform and deployment settings.",
    endpoint: "/api/security/policies",
  },
  "/app/admin": {
    title: "Admin Panel",
    description: "Tenant-level administrative control center.",
    endpoint: "/api/admin/tenants",
  },
  "/app/admin/tenants": {
    title: "Tenant Management",
    description: "Manage tenant plan, limits, and activation state.",
    endpoint: "/api/admin/tenants",
  },
  "/app/admin/users": {
    title: "User Management",
    description: "Invite users, deactivate access, and audit role ownership.",
    endpoint: "/api/admin/users",
  },
  "/app/admin/roles": {
    title: "Role Management",
    description: "Role matrix and permission administration.",
    endpoint: "/api/admin/users",
  },
  "/app/settings": {
    title: "Settings",
    description: "Account preferences and platform defaults.",
    endpoint: "/api/auth/session",
  },
  "/app/settings/profile": {
    title: "Profile Settings",
    description: "User profile, avatar, and display preferences.",
    endpoint: "/api/auth/session",
  },
  "/app/settings/api-keys": {
    title: "API Key Management",
    description: "Issue and revoke service integration keys.",
    endpoint: "/api/auth/api-keys",
  },
  "/app/settings/mfa": {
    title: "MFA Configuration",
    description: "Configure TOTP MFA and backup methods.",
    endpoint: "/api/auth/session",
  },
  "/app/settings/sso": {
    title: "SSO Configuration",
    description: "Manage enterprise SSO provider integration settings.",
    endpoint: "/api/auth/session",
  },
};

export const fallbackRouteMeta: AppRouteMeta = {
  title: "Module View",
  description: "This route is scaffolded and ready for module-specific expansion.",
};
