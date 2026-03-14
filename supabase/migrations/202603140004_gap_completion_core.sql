-- Gap completion migration: missing schema tables/columns for pending functionality

-- Missing columns on existing tables
ALTER TABLE public.network_functions
  ADD COLUMN IF NOT EXISTS helm_chart_url TEXT,
  ADD COLUMN IF NOT EXISTS container_image TEXT,
  ADD COLUMN IF NOT EXISTS service_mesh_config JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.network_slices
  ADD COLUMN IF NOT EXISTS sni_tag TEXT,
  ADD COLUMN IF NOT EXISTS s_nssai TEXT,
  ADD COLUMN IF NOT EXISTS plmn_id TEXT;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS handover_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qos_class TEXT,
  ADD COLUMN IF NOT EXISTS slice_id UUID REFERENCES public.network_slices(id) ON DELETE SET NULL;

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

ALTER TABLE public.alarms
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS probable_cause TEXT,
  ADD COLUMN IF NOT EXISTS specific_problem TEXT;

ALTER TABLE public.cdr_records
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS roaming_indicator BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rating_group TEXT;

ALTER TABLE public.edge_clusters
  ADD COLUMN IF NOT EXISTS kubeconfig_secret_ref TEXT,
  ADD COLUMN IF NOT EXISTS ingress_ip INET;

ALTER TABLE public.performance_metrics
  ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '{}'::jsonb;

-- Missing tables
CREATE TABLE IF NOT EXISTS public.imsi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  imsi TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  is_primary BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, imsi)
);

CREATE TABLE IF NOT EXISTS public.imei_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  imei TEXT NOT NULL,
  tac TEXT,
  manufacturer TEXT,
  model_name TEXT,
  is_blocked BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, imei)
);

CREATE TABLE IF NOT EXISTS public.nf_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  network_function_id UUID NOT NULL REFERENCES public.network_functions(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  cpu_usage NUMERIC,
  memory_usage NUMERIC,
  restart_count INT DEFAULT 0,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_qos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  qci INT,
  arp INT,
  gbr_ul_kbps INT,
  gbr_dl_kbps INT,
  mbr_ul_kbps INT,
  mbr_dl_kbps INT,
  packet_loss_pct NUMERIC,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.traffic_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  policy_rule_id UUID REFERENCES public.policy_rules(id) ON DELETE SET NULL,
  direction TEXT DEFAULT 'both',
  match_criteria JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '{}'::jsonb,
  priority INT DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  file_url TEXT,
  status TEXT DEFAULT 'queued',
  row_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.metrics_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  topic TEXT,
  entity_type TEXT,
  entity_id UUID,
  metric_name TEXT,
  metric_value NUMERIC,
  labels JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dataset_type TEXT,
  version TEXT,
  storage_url TEXT,
  row_count BIGINT,
  schema_json JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.model_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.model_registry(id) ON DELETE CASCADE,
  target_environment TEXT DEFAULT 'production',
  status TEXT DEFAULT 'deploying',
  deployed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.model_registry(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  labels JSONB DEFAULT '{}'::jsonb,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.package_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.marketplace_packages(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  artifact_url TEXT,
  is_latest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (package_id, version)
);

CREATE TABLE IF NOT EXISTS public.package_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.marketplace_packages(id) ON DELETE CASCADE,
  package_version_id UUID REFERENCES public.package_versions(id) ON DELETE SET NULL,
  installed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'installed',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_type TEXT,
  subject_id UUID,
  action TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.data_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.availability_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data_center_id UUID REFERENCES public.data_centers(id) ON DELETE CASCADE,
  zone_code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.network_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source_data_center_id UUID REFERENCES public.data_centers(id) ON DELETE CASCADE,
  target_data_center_id UUID REFERENCES public.data_centers(id) ON DELETE CASCADE,
  bandwidth_mbps INT,
  latency_ms NUMERIC,
  packet_loss_pct NUMERIC,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.edge_workloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.edge_clusters(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.edge_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  workload_type TEXT,
  image TEXT,
  replicas INT DEFAULT 1,
  status TEXT DEFAULT 'deploying',
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mfa_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  method TEXT DEFAULT 'totp',
  secret_hash TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  email TEXT,
  ip_address TEXT,
  succeeded BOOLEAN DEFAULT FALSE,
  reason TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT,
  user_agent TEXT,
  ip_address TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  key_hash TEXT,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sla_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slice_id UUID REFERENCES public.network_slices(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  latency_ms_target NUMERIC,
  availability_pct_target NUMERIC,
  throughput_mbps_target NUMERIC,
  penalty_model JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_type TEXT,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  max_subscribers INT,
  max_network_functions INT,
  monthly_price_usd NUMERIC,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ztp_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  status TEXT DEFAULT 'idle',
  steps JSONB DEFAULT '[]'::jsonb,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- useful indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_stream_time ON public.metrics_stream(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_nf_health_time ON public.nf_health(network_function_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_period ON public.billing_invoices(tenant_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_network_links_src_dst ON public.network_links(source_data_center_id, target_data_center_id);

-- update triggers for new tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'imsi_records',
    'imei_devices',
    'nf_health',
    'session_qos',
    'traffic_policies',
    'billing_exports',
    'metrics_stream',
    'training_datasets',
    'model_deployments',
    'model_metrics',
    'package_versions',
    'package_installs',
    'data_access_logs',
    'data_centers',
    'availability_zones',
    'network_links',
    'edge_workloads',
    'mfa_devices',
    'login_attempts',
    'device_sessions',
    'service_accounts',
    'sla_agreements',
    'billing_invoices',
    'billing_invoice_items',
    'tenant_plans',
    'ztp_workflows'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END
$$;

-- RLS for tenant-scoped new tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'imsi_records',
    'imei_devices',
    'nf_health',
    'session_qos',
    'traffic_policies',
    'billing_exports',
    'metrics_stream',
    'training_datasets',
    'model_deployments',
    'model_metrics',
    'package_installs',
    'data_access_logs',
    'data_centers',
    'availability_zones',
    'network_links',
    'edge_workloads',
    'mfa_devices',
    'login_attempts',
    'device_sessions',
    'service_accounts',
    'sla_agreements',
    'billing_invoices',
    'billing_invoice_items',
    'ztp_workflows'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%I ON public.%I FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id())',
      t,
      t
    );
  END LOOP;
END
$$;

-- Global read tables
ALTER TABLE public.package_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS package_versions_read_all ON public.package_versions;
CREATE POLICY package_versions_read_all ON public.package_versions FOR SELECT USING (TRUE);

ALTER TABLE public.tenant_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_plans_read_all ON public.tenant_plans;
CREATE POLICY tenant_plans_read_all ON public.tenant_plans FOR SELECT USING (TRUE);

INSERT INTO public.tenant_plans (plan_code, name, max_subscribers, max_network_functions, monthly_price_usd, features)
VALUES
  ('starter', 'Starter', 1000, 10, 199, '{"support":"business_hours","realtime":true}'::jsonb),
  ('growth', 'Growth', 10000, 100, 999, '{"support":"priority","realtime":true,"sso":true}'::jsonb),
  ('enterprise', 'Enterprise', 1000000, 10000, 4999, '{"support":"24x7","realtime":true,"sso":true,"dedicated":true}'::jsonb)
ON CONFLICT (plan_code) DO NOTHING;
