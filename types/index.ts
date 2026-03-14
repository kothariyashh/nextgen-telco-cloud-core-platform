export type Role =
  | "super_admin"
  | "tenant_admin"
  | "network_engineer"
  | "billing_manager"
  | "readonly_viewer"
  | "api_service";

export type TenantScopedRecord = {
  id: string;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
};

export type ApiEnvelope<T> = {
  ok: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
};

export type SessionContext = {
  userId: string | null;
  tenantId: string | null;
  role: Role;
  email: string | null;
};

export type DashboardSnapshot = {
  subscribers: number;
  networkFunctions: number;
  sessions: number;
  activeAlarms: number;
  averageLatencyMs: number;
  throughputMbps: number;
};

export type NavItem = {
  title: string;
  href: string;
  description?: string;
};

export type PlatformFeature = {
  title: string;
  description: string;
  href: string;
  api?: string[];
};
