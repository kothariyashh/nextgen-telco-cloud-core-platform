-- ============================================================
-- NGCMCP: Run this entire file in Supabase Dashboard → SQL Editor
-- (Use when npm run db:migrate fails due to connection issues)
-- ============================================================

-- NGCMCP initial schema
-- Stack: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  max_subscribers INT DEFAULT 1000,
  max_network_functions INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'readonly_viewer',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  cloud_provider TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  support_email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.network_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nf_type TEXT NOT NULL,
  generation TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  version TEXT,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  cluster_id UUID,
  config JSONB DEFAULT '{}'::jsonb,
  resource_limits JSONB DEFAULT '{}'::jsonb,
  endpoints JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nf_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_function_id UUID NOT NULL REFERENCES public.network_functions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  instance_name TEXT,
  pod_name TEXT,
  node_name TEXT,
  status TEXT,
  cpu_usage NUMERIC,
  memory_usage NUMERIC,
  started_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  imsi TEXT UNIQUE NOT NULL,
  msisdn TEXT,
  status TEXT DEFAULT 'active',
  plan TEXT,
  data_limit_gb NUMERIC,
  roaming_enabled BOOLEAN DEFAULT FALSE,
  imsi_encrypted BYTEA,
  msisdn_encrypted BYTEA,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sim_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  iccid TEXT UNIQUE NOT NULL,
  imsi TEXT NOT NULL,
  sim_type TEXT,
  status TEXT DEFAULT 'inactive',
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriber_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  imei TEXT,
  device_model TEXT,
  os TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roaming_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  allowed_countries TEXT[] DEFAULT '{}',
  data_limit_mb INT,
  voice_limit_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.slice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slice_type TEXT NOT NULL,
  default_config JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.network_slices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slice_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  template_id UUID REFERENCES public.slice_templates(id) ON DELETE SET NULL,
  qos_profile JSONB DEFAULT '{}'::jsonb,
  bandwidth_mbps INT,
  latency_target_ms INT,
  max_subscribers INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.slice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slice_id UUID NOT NULL REFERENCES public.network_slices(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (slice_id, subscriber_id)
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  slice_id UUID REFERENCES public.network_slices(id) ON DELETE SET NULL,
  session_type TEXT,
  status TEXT DEFAULT 'active',
  upf_id UUID REFERENCES public.network_functions(id) ON DELETE SET NULL,
  ip_address INET,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  bytes_uplink BIGINT DEFAULT 0,
  bytes_downlink BIGINT DEFAULT 0,
  qos_class TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT,
  conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '{}'::jsonb,
  priority INT DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.qos_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qci INT,
  max_bandwidth_mbps INT,
  latency_target_ms INT,
  packet_loss_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.charging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  quota_allocated_mb NUMERIC,
  quota_used_mb NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  balance_currency TEXT DEFAULT 'USD',
  balance_amount NUMERIC DEFAULT 0,
  last_recharged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, subscriber_id)
);

CREATE TABLE IF NOT EXISTS public.cdr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INT,
  bytes_uplink BIGINT,
  bytes_downlink BIGINT,
  charge_amount NUMERIC,
  charge_currency TEXT DEFAULT 'USD',
  rating_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  metric_name TEXT,
  metric_value NUMERIC,
  unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_entity ON public.performance_metrics(entity_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_tenant_time ON public.performance_metrics(tenant_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  alert_name TEXT NOT NULL,
  severity TEXT,
  entity_type TEXT,
  entity_id UUID,
  condition JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  alarm_type TEXT,
  severity TEXT,
  source_entity_type TEXT,
  source_entity_id UUID,
  description TEXT,
  status TEXT DEFAULT 'active',
  raised_at TIMESTAMPTZ DEFAULT NOW(),
  cleared_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT,
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alarm_ids UUID[] DEFAULT '{}',
  root_cause TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.edge_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'offline',
  node_count INT DEFAULT 0,
  kubernetes_version TEXT,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.edge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES public.edge_clusters(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostname TEXT,
  ip_address INET,
  status TEXT DEFAULT 'offline',
  cpu_cores INT,
  memory_gb INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  policy_type TEXT,
  rules JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.threat_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  threat_type TEXT,
  severity TEXT DEFAULT 'warning',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  severity TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trace_name TEXT,
  root_service TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_ms NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trace_spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trace_id UUID NOT NULL REFERENCES public.traces(id) ON DELETE CASCADE,
  span_name TEXT,
  service_name TEXT,
  parent_span_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_ms NUMERIC,
  status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orchestration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'queued',
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  package_type TEXT,
  category TEXT,
  version TEXT,
  helm_chart_url TEXT,
  container_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  price_model TEXT,
  price_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.marketplace_packages(id) ON DELETE CASCADE,
  installed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'installed',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requester_email TEXT,
  request_type TEXT,
  status TEXT DEFAULT 'pending',
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  report_name TEXT,
  status TEXT,
  summary JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.regulatory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_type TEXT,
  version TEXT,
  artifact_url TEXT,
  metrics JSONB,
  status TEXT DEFAULT 'staging',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  anomaly_type TEXT,
  severity TEXT,
  score NUMERIC,
  details JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  prediction_type TEXT,
  entity_type TEXT,
  entity_id UUID,
  predicted_value NUMERIC,
  confidence NUMERIC,
  predicted_for TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  recommendation_type TEXT,
  target_type TEXT,
  target_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'readonly_viewer',
  invite_token TEXT NOT NULL UNIQUE,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.topology_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.topology_data_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.topology_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source_datacenter_id UUID REFERENCES public.topology_data_centers(id) ON DELETE CASCADE,
  target_datacenter_id UUID REFERENCES public.topology_data_centers(id) ON DELETE CASCADE,
  bandwidth_mbps INT,
  latency_ms NUMERIC,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;

-- Update timestamp triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END
$$;

-- RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenants_read_own ON public.tenants;
CREATE POLICY tenants_read_own ON public.tenants FOR SELECT USING (id = public.current_tenant_id());

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'user_profiles',
    'api_keys',
    'network_functions',
    'nf_instances',
    'subscribers',
    'sim_cards',
    'subscriber_devices',
    'roaming_profiles',
    'slice_templates',
    'network_slices',
    'slice_assignments',
    'sessions',
    'policy_rules',
    'qos_profiles',
    'charging_sessions',
    'credit_balances',
    'cdr_records',
    'performance_metrics',
    'alerts',
    'alarms',
    'incidents',
    'edge_clusters',
    'edge_nodes',
    'audit_logs',
    'security_policies',
    'threat_alerts',
    'logs',
    'traces',
    'trace_spans',
    'orchestration_jobs',
    'marketplace_installs',
    'gdpr_requests',
    'compliance_reports',
    'regulatory_logs',
    'model_registry',
    'anomaly_alerts',
    'ai_predictions',
    'optimization_recommendations',
    'user_invites',
    'topology_regions',
    'topology_data_centers',
    'topology_links'
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

-- Read-only global tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regions_read_all ON public.regions;
CREATE POLICY regions_read_all ON public.regions FOR SELECT USING (TRUE);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vendors_read_all ON public.vendors;
CREATE POLICY vendors_read_all ON public.vendors FOR SELECT USING (TRUE);

ALTER TABLE public.marketplace_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketplace_packages_read_all ON public.marketplace_packages;
CREATE POLICY marketplace_packages_read_all ON public.marketplace_packages FOR SELECT USING (TRUE);
-- Add tenant_id to session_events for multi-tenant isolation
ALTER TABLE public.session_events
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

UPDATE public.session_events se
SET tenant_id = s.tenant_id
FROM public.sessions s
WHERE se.session_id = s.id AND se.tenant_id IS NULL;

ALTER TABLE public.session_events
  ALTER COLUMN tenant_id SET NOT NULL;

-- Enable RLS and tenant isolation policy
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_session_events ON public.session_events;
CREATE POLICY tenant_isolation_session_events ON public.session_events
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
-- Add configurations table for centralized config management with version control (Blueprint #15)
CREATE TABLE IF NOT EXISTS public.configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope TEXT DEFAULT 'platform',
  scope_id UUID,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT DEFAULT 1,
  previous_version_id UUID REFERENCES public.configurations(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_configurations_tenant_scope ON public.configurations(tenant_id, scope, name);

DROP TRIGGER IF EXISTS trg_configurations_updated_at ON public.configurations;
CREATE TRIGGER trg_configurations_updated_at
  BEFORE UPDATE ON public.configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.configurations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_configurations ON public.configurations;
CREATE POLICY tenant_isolation_configurations ON public.configurations
  FOR ALL USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
-- NGCMCP demo seed data

INSERT INTO public.tenants (id, name, slug, plan)
VALUES ('11111111-0000-0000-0000-000000000001', 'Demo Operator', 'demo-operator', 'growth')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.regions (id, name, code, cloud_provider, country)
VALUES
  ('22222222-0000-0000-0000-000000000001', 'Mumbai', 'AP-SOUTH-1', 'aws', 'India'),
  ('22222222-0000-0000-0000-000000000002', 'Frankfurt', 'EU-CENTRAL-1', 'azure', 'Germany'),
  ('22222222-0000-0000-0000-000000000003', 'Singapore', 'AP-SE-1', 'gcp', 'Singapore')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vendors (id, name, website_url, support_email, is_verified)
VALUES
  ('33333333-0000-0000-0000-000000000001', 'EdgeWave Systems', 'https://edgewave.example.com', 'support@edgewave.example.com', TRUE),
  ('33333333-0000-0000-0000-000000000002', 'SignalPath Labs', 'https://signalpath.example.com', 'support@signalpath.example.com', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.network_functions (id, tenant_id, name, nf_type, generation, status, region_id, resource_limits)
VALUES
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'AMF-Mumbai-01', 'AMF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":2,"cpu":"1","memory":"2Gi"}'),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'SMF-Mumbai-01', 'SMF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":2,"cpu":"1","memory":"2Gi"}'),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'UPF-Mumbai-01', 'UPF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":3,"cpu":"2","memory":"4Gi"}'),
  ('44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'PCF-Mumbai-01', 'PCF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":1,"cpu":"500m","memory":"1Gi"}'),
  ('44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'UDM-Mumbai-01', 'UDM', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":1,"cpu":"500m","memory":"1Gi"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.nf_instances (tenant_id, network_function_id, instance_name, pod_name, node_name, status, cpu_usage, memory_usage, started_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'amf-0', 'amf-0', 'node-a', 'running', 41.2, 57.8, NOW() - INTERVAL '3 days'),
  ('11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'smf-0', 'smf-0', 'node-b', 'running', 36.4, 49.1, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.network_slices (id, tenant_id, name, slice_type, status, bandwidth_mbps, latency_target_ms, max_subscribers)
VALUES
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Enterprise-IoT-Mumbai', 'IoT', 'active', 100, 50, 20000),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Broadband-eMBB-Mumbai', 'eMBB', 'active', 1000, 20, 100000),
  ('55555555-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Industrial-URLLC-Mumbai', 'URLLC', 'active', 500, 1, 15000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscribers (id, tenant_id, imsi, msisdn, status, plan, data_limit_gb, roaming_enabled)
VALUES
  ('66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '404451234567890', '919876540001', 'active', 'enterprise', 250, TRUE),
  ('66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '404451234567891', '919876540002', 'active', 'growth', 120, FALSE),
  ('66666666-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '404451234567892', '919876540003', 'suspended', 'starter', 60, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sim_cards (tenant_id, subscriber_id, iccid, imsi, sim_type, status, activated_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '8991101200003204511', '404451234567890', 'eSIM', 'active', NOW() - INTERVAL '60 days'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '8991101200003204512', '404451234567891', 'physical', 'active', NOW() - INTERVAL '42 days')
ON CONFLICT (iccid) DO NOTHING;

INSERT INTO public.subscriber_devices (tenant_id, subscriber_id, imei, device_model, os, last_seen_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '352099001761481', 'Industrial Gateway X', 'Linux', NOW() - INTERVAL '5 minutes'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '352099001761482', 'Smart Router CPE', 'Android', NOW() - INTERVAL '11 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.slice_assignments (tenant_id, slice_id, subscriber_id, assigned_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days'),
  ('11111111-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000002', NOW() - INTERVAL '40 days')
ON CONFLICT (slice_id, subscriber_id) DO NOTHING;

INSERT INTO public.sessions (id, tenant_id, subscriber_id, slice_id, session_type, status, upf_id, ip_address, start_time, bytes_uplink, bytes_downlink, qos_class)
VALUES
  ('77777777-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'PDU', 'active', '44444444-0000-0000-0000-000000000003', '10.90.2.10', NOW() - INTERVAL '2 hours', 8589934592, 17179869184, 'QCI-7'),
  ('77777777-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'PDU', 'idle', '44444444-0000-0000-0000-000000000003', '10.90.2.11', NOW() - INTERVAL '5 hours', 2147483648, 4294967296, 'QCI-9')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.session_events (tenant_id, session_id, event_type, event_data, occurred_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'created', '{"source":"smf"}', NOW() - INTERVAL '2 hours'),
  ('11111111-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'qos_change', '{"from":"QCI-9","to":"QCI-7"}', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_rules (tenant_id, name, rule_type, conditions, actions, priority, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'IoT-Low-Latency', 'QoS', '{"slice_type":"IoT"}', '{"qci":"QCI-7","max_jitter_ms":20}', 50, TRUE),
  ('11111111-0000-0000-0000-000000000001', 'Roaming-Guardrail', 'access_control', '{"roaming":true}', '{"allow_countries":["IN","SG","DE"]}', 60, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.qos_profiles (tenant_id, name, qci, max_bandwidth_mbps, latency_target_ms, packet_loss_pct)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'URLLC-Critical', 7, 300, 2, 0.1),
  ('11111111-0000-0000-0000-000000000001', 'eMBB-Standard', 9, 1000, 20, 1.5)
ON CONFLICT DO NOTHING;

INSERT INTO public.credit_balances (tenant_id, subscriber_id, balance_currency, balance_amount, last_recharged_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', 'USD', 625.50, NOW() - INTERVAL '3 days'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', 'USD', 210.00, NOW() - INTERVAL '8 days')
ON CONFLICT (tenant_id, subscriber_id) DO NOTHING;

INSERT INTO public.charging_sessions (tenant_id, subscriber_id, session_id, quota_allocated_mb, quota_used_mb, status, started_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 20480, 12450, 'active', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.cdr_records (tenant_id, subscriber_id, session_id, start_time, end_time, duration_seconds, bytes_uplink, bytes_downlink, charge_amount, charge_currency, rating_group)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 3600, 800000000, 1600000000, 12.75, 'USD', 'RG-IOT'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000002', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', 3600, 700000000, 900000000, 7.30, 'USD', 'RG-EMBB')
ON CONFLICT DO NOTHING;

INSERT INTO public.performance_metrics (tenant_id, entity_type, entity_id, metric_name, metric_value, unit, recorded_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000001', 'latency_ms', 14.2, 'ms', NOW() - INTERVAL '2 minutes'),
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000003', 'throughput_mbps', 925.4, 'mbps', NOW() - INTERVAL '2 minutes'),
  ('11111111-0000-0000-0000-000000000001', 'slice', '55555555-0000-0000-0000-000000000001', 'session_count', 412, 'count', NOW() - INTERVAL '2 minutes'),
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000002', 'cpu_pct', 48.1, 'percent', NOW() - INTERVAL '2 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.alerts (tenant_id, alert_name, severity, entity_type, entity_id, condition, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'AMF latency > 50ms', 'warning', 'network_function', '44444444-0000-0000-0000-000000000001', '{"metric":"latency_ms","op":">","value":50}', TRUE),
  ('11111111-0000-0000-0000-000000000001', 'UPF packet loss > 1%', 'critical', 'network_function', '44444444-0000-0000-0000-000000000003', '{"metric":"packet_loss_pct","op":">","value":1}', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.alarms (tenant_id, alarm_type, severity, source_entity_type, source_entity_id, description, status, raised_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'throughput_drop', 'warning', 'network_function', '44444444-0000-0000-0000-000000000003', 'UPF throughput dropped 18% in 5 min', 'active', NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.incidents (tenant_id, title, description, severity, status, alarm_ids)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Mumbai UPF congestion', 'Observed short-term packet loss increase in Mumbai zone.', 'major', 'investigating', '{}')
ON CONFLICT DO NOTHING;

INSERT INTO public.edge_clusters (id, tenant_id, name, region_id, status, node_count, kubernetes_version, last_heartbeat)
VALUES
  ('88888888-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Mumbai-Edge-Cluster-A', '22222222-0000-0000-0000-000000000001', 'online', 4, '1.30', NOW() - INTERVAL '30 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.edge_nodes (tenant_id, cluster_id, hostname, ip_address, status, cpu_cores, memory_gb)
VALUES
  ('11111111-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'edge-node-a1', '10.10.1.11', 'online', 16, 64),
  ('11111111-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'edge-node-a2', '10.10.1.12', 'online', 16, 64)
ON CONFLICT DO NOTHING;

INSERT INTO public.security_policies (tenant_id, name, policy_type, rules, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'API Rate Limit', 'api_security', '{"rpm":1200,"burst":200}', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.threat_alerts (tenant_id, threat_type, severity, description, metadata)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'auth_failure_spike', 'warning', 'Auth failures rose above baseline.', '{"window_min":5,"count":42}')
ON CONFLICT DO NOTHING;

INSERT INTO public.logs (tenant_id, entity_type, entity_id, severity, message, metadata, occurred_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000001', 'info', 'AMF registration success rate stable', '{"rate":99.93}', NOW() - INTERVAL '1 minute'),
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000003', 'warning', 'UPF packet queue depth elevated', '{"depth":1342}', NOW() - INTERVAL '2 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.traces (id, tenant_id, trace_name, root_service, status, started_at, ended_at, duration_ms)
VALUES
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Attach Session Flow', 'AMF', 'ok', NOW() - INTERVAL '30 seconds', NOW() - INTERVAL '29.5 seconds', 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.trace_spans (tenant_id, trace_id, span_name, service_name, started_at, ended_at, duration_ms, status)
VALUES
  ('11111111-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 'AMF.Auth', 'AMF', NOW() - INTERVAL '30 seconds', NOW() - INTERVAL '29.8 seconds', 200, 'ok'),
  ('11111111-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 'SMF.SessionCreate', 'SMF', NOW() - INTERVAL '29.8 seconds', NOW() - INTERVAL '29.5 seconds', 300, 'ok')
ON CONFLICT DO NOTHING;

INSERT INTO public.orchestration_jobs (tenant_id, job_type, target_type, target_id, payload, status, created_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'deploy', 'network_function', '44444444-0000-0000-0000-000000000005', '{"helm_release":"udm-core"}', 'completed', NOW() - INTERVAL '2 days'),
  ('11111111-0000-0000-0000-000000000001', 'scale', 'network_function', '44444444-0000-0000-0000-000000000003', '{"replicas":3}', 'queued', NOW() - INTERVAL '8 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.marketplace_packages (id, vendor_id, name, description, package_type, category, version, helm_chart_url, container_image, is_verified, price_model, price_amount)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Edge Firewall CNF', 'Carrier-grade edge firewall package', 'CNF', 'security', '1.4.2', 'https://charts.example.com/edge-firewall', 'registry.example.com/edge/firewall:1.4.2', TRUE, 'subscription', 399),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'DNS Accelerator VNF', 'DNS performance accelerator for edge zones', 'VNF', 'performance', '2.1.0', 'https://charts.example.com/dns-accel', 'registry.example.com/dns/accel:2.1.0', TRUE, 'one-time', 999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.marketplace_installs (tenant_id, package_id, status, installed_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'installed', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.gdpr_requests (tenant_id, requester_email, request_type, status, subscriber_id, created_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'privacy@example.com', 'access', 'pending', '66666666-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO public.compliance_reports (tenant_id, report_name, status, summary, generated_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Monthly Regulatory Report', 'passed', '{"controls_checked":32,"exceptions":0}', NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.regulatory_logs (tenant_id, event_type, description, metadata, occurred_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'lawful_intercept_audit', 'Quarterly LI audit completed.', '{"result":"pass"}', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.model_registry (id, tenant_id, model_name, model_type, version, artifact_url, metrics, status)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'LatencySpikeDetector', 'anomaly_detection', '1.0.3', 's3://models/latency-spike-1.0.3', '{"f1":0.91}', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'UPFFailurePredictor', 'predictive_maintenance', '0.9.4', 's3://models/upf-failure-0.9.4', '{"auc":0.88}', 'staging')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.anomaly_alerts (tenant_id, entity_type, entity_id, anomaly_type, severity, score, details, detected_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000003', 'latency_spike', 'warning', 0.82, '{"baseline_ms":15,"observed_ms":38}', NOW() - INTERVAL '9 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_predictions (tenant_id, prediction_type, entity_type, entity_id, predicted_value, confidence, predicted_for, metadata)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'throughput_forecast_mbps', 'network_function', '44444444-0000-0000-0000-000000000003', 1100, 0.89, NOW() + INTERVAL '2 hours', '{"window":"2h"}')
ON CONFLICT DO NOTHING;

INSERT INTO public.optimization_recommendations (tenant_id, title, description, recommendation_type, target_type, target_id, payload, status)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Scale UPF by +1 replica', 'Predicted throughput increase at evening peak.', 'capacity_scale', 'network_function', '44444444-0000-0000-0000-000000000003', '{"replicas":4}', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_invites (tenant_id, email, role, invite_token, expires_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'engineer@example.com', 'network_engineer', 'demo-invite-token-001', NOW() + INTERVAL '6 days')
ON CONFLICT (invite_token) DO NOTHING;

-- ========== 100 fake records per component (for visualization) ==========
-- NGCMCP: 100 fake records per component for better visualization
-- Run AFTER initial schema + base seed (supabase/seed.sql). Use in Supabase SQL Editor.
-- Demo tenant: 11111111-0000-0000-0000-000000000001

-- 1. 100 Network Functions
INSERT INTO public.network_functions (tenant_id, name, nf_type, generation, status, region_id, resource_limits)
SELECT
  '11111111-0000-0000-0000-000000000001',
  (ARRAY['AMF','SMF','UPF','PCF','UDM','AUSF','NRF'])[1 + (i % 7)] || '-' || (ARRAY['Mumbai','Frankfurt','Singapore'])[1 + (i % 3)] || '-' || lpad(i::text, 3, '0'),
  (ARRAY['AMF','SMF','UPF','PCF','UDM','AUSF','NRF'])[1 + (i % 7)],
  (ARRAY['5G','5G','4G'])[1 + (i % 3)],
  (ARRAY['active','active','pending','degraded'])[1 + (i % 4)],
  (ARRAY['22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000003'])[1 + (i % 3)]::uuid,
  ('{"replicas":' || (1 + (i % 4)) || ',"cpu":"' || (1 + (i % 2)) || '","memory":"' || (2 + (i % 4)) || 'Gi"}')::jsonb
FROM generate_series(1, 100) i;

-- 2. 100 NF Instances
INSERT INTO public.nf_instances (tenant_id, network_function_id, instance_name, pod_name, node_name, status, cpu_usage, memory_usage, started_at)
SELECT nf.tenant_id, nf.id, 'inst-' || rn, 'pod-' || (rn % 50), 'node-' || (rn % 12),
  (ARRAY['running','running','pending','degraded'])[1 + (rn % 4)],
  (15 + (random() * 65))::numeric(5,2), (25 + (random() * 55))::numeric(5,2),
  NOW() - (random() * interval '14 days')
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 3. 100 Subscribers
INSERT INTO public.subscribers (tenant_id, imsi, msisdn, status, plan, data_limit_gb, roaming_enabled)
SELECT '11111111-0000-0000-0000-000000000001',
  '40445' || lpad((910000000 + i)::text, 10, '0'),
  '91988' || lpad((6543000 + i)::text, 7, '0'),
  (ARRAY['active','active','suspended','inactive'])[1 + (i % 4)],
  (ARRAY['enterprise','growth','starter','prepaid'])[1 + (i % 4)],
  (50 + (i % 200))::numeric, (i % 3) = 0
FROM generate_series(1, 100) i;

-- 4. 100 Sim Cards (1:1 with new subscribers)
INSERT INTO public.sim_cards (tenant_id, subscriber_id, iccid, imsi, sim_type, status, activated_at)
SELECT s.tenant_id, s.id, '89911012' || lpad((8000000 + rn)::text, 8, '0'), s.imsi,
  (ARRAY['eSIM','physical'])[1 + (rn % 2)], 'active', NOW() - (random() * interval '90 days')
FROM (SELECT id, tenant_id, imsi, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.subscribers WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) s;

-- 5. 100 Network Slices
INSERT INTO public.network_slices (tenant_id, name, slice_type, status, bandwidth_mbps, latency_target_ms, max_subscribers)
SELECT '11111111-0000-0000-0000-000000000001',
  (ARRAY['IoT','eMBB','URLLC'])[1 + (i % 3)] || '-Slice-' || lpad(i::text, 3, '0'),
  (ARRAY['IoT','eMBB','URLLC'])[1 + (i % 3)],
  (ARRAY['active','active','pending'])[1 + (i % 3)],
  (100 + (i % 900)), (5 + (i % 45)), (1000 + (i % 19000))
FROM generate_series(1, 100) i;

-- 6. 100 Subscriber Devices
INSERT INTO public.subscriber_devices (tenant_id, subscriber_id, imei, device_model, os, last_seen_at)
SELECT s.tenant_id, s.id, '35' || lpad((200990000000000 + rn)::text, 13, '0'),
  (ARRAY['iPhone 15','Samsung S24','Industrial Gateway','CPE Router','Android Device'])[1 + (rn % 5)],
  (ARRAY['iOS','Android','Linux','Linux','Android'])[1 + (rn % 5)],
  NOW() - (random() * interval '24 hours')
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.subscribers WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) s;

-- 7. 100 Slice Assignments (pair slices with subscribers 1:1)
INSERT INTO public.slice_assignments (tenant_id, slice_id, subscriber_id, assigned_at)
SELECT '11111111-0000-0000-0000-000000000001', sl.id, su.id, NOW() - (sl.rn * interval '1 day')
FROM (SELECT id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_slices WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) sl
JOIN (SELECT id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.subscribers WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) su ON sl.rn = su.rn
ON CONFLICT (slice_id, subscriber_id) DO NOTHING;

-- 8. 100 Sessions
INSERT INTO public.sessions (tenant_id, subscriber_id, slice_id, session_type, status, upf_id, ip_address, start_time, bytes_uplink, bytes_downlink, qos_class)
SELECT s.tenant_id, s.id, sl.id, 'PDU', (ARRAY['active','active','idle','released'])[1 + (s.rn % 4)], '44444444-0000-0000-0000-000000000003',
  ('10.90.' || (s.rn / 256) || '.' || (s.rn % 256))::inet, NOW() - (random() * interval '48 hours'),
  (random() * 20000000000)::bigint, (random() * 40000000000)::bigint,
  (ARRAY['QCI-7','QCI-9','QCI-5'])[1 + (s.rn % 3)]
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.subscribers WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) s
JOIN (SELECT id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_slices WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) sl ON s.rn = sl.rn;

-- 9. 100 Session Events
INSERT INTO public.session_events (tenant_id, session_id, event_type, event_data, occurred_at)
SELECT s.tenant_id, s.id, (ARRAY['created','qos_change','handover','released'])[1 + (rn % 4)], ('{"source":"smf","seq":' || rn || '}')::jsonb, NOW() - (random() * interval '24 hours')
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.sessions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) s;

-- 10. 100 Performance Metrics
INSERT INTO public.performance_metrics (tenant_id, entity_type, entity_id, metric_name, metric_value, unit, recorded_at)
SELECT nf.tenant_id, 'network_function', nf.id, (ARRAY['latency_ms','throughput_mbps','cpu_pct','memory_pct','session_count'])[1 + (rn % 5)],
  (random() * 500 + 10)::numeric(10,2), (ARRAY['ms','mbps','percent','percent','count'])[1 + (rn % 5)], NOW() - (random() * interval '1 hour')
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 11. 100 Alarms
INSERT INTO public.alarms (tenant_id, alarm_type, severity, source_entity_type, source_entity_id, description, status, raised_at)
SELECT nf.tenant_id, (ARRAY['throughput_drop','latency_spike','packet_loss','cpu_high','memory_high'])[1 + (rn % 5)],
  (ARRAY['critical','warning','warning','minor','minor'])[1 + (rn % 5)], 'network_function', nf.id,
  'Auto-generated alarm #' || rn, (ARRAY['active','active','cleared','active','cleared'])[1 + (rn % 5)], NOW() - (random() * interval '7 days')
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 12. 100 Alerts
INSERT INTO public.alerts (tenant_id, alert_name, severity, entity_type, entity_id, condition, is_active)
SELECT nf.tenant_id, 'Alert-NF-' || rn || '-' || (ARRAY['latency','throughput','loss'])[1 + (rn % 3)],
  (ARRAY['critical','warning','info'])[1 + (rn % 3)], 'network_function', nf.id, '{"metric":"latency_ms","op":">","value":50}', TRUE
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 13. 100 CDR Records (linked to sessions)
INSERT INTO public.cdr_records (tenant_id, subscriber_id, session_id, start_time, end_time, duration_seconds, bytes_uplink, bytes_downlink, charge_amount, charge_currency, rating_group)
SELECT sess.tenant_id, sess.subscriber_id, sess.id, sess.start_time, sess.start_time + (3600 || ' seconds')::interval,
  3600, COALESCE(sess.bytes_uplink, 0)::bigint, COALESCE(sess.bytes_downlink, 0)::bigint,
  (random() * 25 + 1)::numeric(10,2), 'USD', (ARRAY['RG-IOT','RG-EMBB','RG-URLLC'])[1 + (rn % 3)]
FROM (SELECT id, tenant_id, subscriber_id, start_time, bytes_uplink, bytes_downlink, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.sessions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) sess;

-- 14. 100 Logs
INSERT INTO public.logs (tenant_id, entity_type, entity_id, severity, message, metadata, occurred_at)
SELECT nf.tenant_id, 'network_function', nf.id, (ARRAY['info','warning','error','debug'])[1 + (rn % 4)],
  'Log entry #' || rn || ': ' || (ARRAY['NF stable','Throughput normal','Queue depth elevated','Session created'])[1 + (rn % 4)],
  ('{"seq":' || rn || '}')::jsonb, NOW() - (random() * interval '6 hours')
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 15. 100 Policy Rules
INSERT INTO public.policy_rules (tenant_id, name, rule_type, conditions, actions, priority, is_active)
SELECT '11111111-0000-0000-0000-000000000001', 'Policy-Rule-' || lpad(i::text, 3, '0'),
  (ARRAY['QoS','access_control','throttle','routing'])[1 + (i % 4)], jsonb_build_object('slice_type', 'IoT', 'priority', i), jsonb_build_object('qci', 'QCI-7'), (50 + i), TRUE
FROM generate_series(1, 100) i;

-- 16. 100 QoS Profiles
INSERT INTO public.qos_profiles (tenant_id, name, qci, max_bandwidth_mbps, latency_target_ms, packet_loss_pct)
SELECT '11111111-0000-0000-0000-000000000001', 'QoS-Profile-' || lpad(i::text, 3, '0'),
  (5 + (i % 5)), (200 + (i % 800)), (5 + (i % 45)), (0.1 + (random() * 2))::numeric(5,2)
FROM generate_series(1, 100) i;

-- 17. 100 Credit Balances
INSERT INTO public.credit_balances (tenant_id, subscriber_id, balance_currency, balance_amount, last_recharged_at)
SELECT s.tenant_id, s.id, 'USD', (random() * 500 + 50)::numeric(10,2), NOW() - (random() * interval '14 days')
FROM (SELECT id, tenant_id FROM public.subscribers WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) s
ON CONFLICT (tenant_id, subscriber_id) DO UPDATE SET balance_amount = EXCLUDED.balance_amount;

-- 18. 100 Orchestration Jobs
INSERT INTO public.orchestration_jobs (tenant_id, job_type, target_type, target_id, payload, status)
SELECT nf.tenant_id, (ARRAY['deploy','scale','restart','config_update'])[1 + (rn % 4)], 'network_function', nf.id,
  ('{"replicas":' || (1 + (rn % 3)) || '}')::jsonb, (ARRAY['completed','queued','running','failed'])[1 + (rn % 4)]
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 19. 100 Traces
INSERT INTO public.traces (tenant_id, trace_name, root_service, status, started_at, ended_at, duration_ms)
SELECT '11111111-0000-0000-0000-000000000001', 'Trace-' || lpad(i::text, 3, '0'), (ARRAY['AMF','SMF','UPF'])[1 + (i % 3)], (ARRAY['ok','ok','error'])[1 + (i % 3)], NOW() - (random() * interval '1 hour'), NOW() - (random() * interval '59 minutes'), (50 + (random() * 450))::numeric(10,2)
FROM generate_series(1, 100) i;

-- 20. 100 Threat Alerts
INSERT INTO public.threat_alerts (tenant_id, threat_type, severity, description, metadata)
SELECT '11111111-0000-0000-0000-000000000001', (ARRAY['auth_failure_spike','anomaly_detected','rate_limit','suspicious_activity'])[1 + (i % 4)],
  (ARRAY['critical','warning','info'])[1 + (i % 3)], 'Threat alert #' || i, ('{"seq":' || i || ',"count":' || (i * 3) || '}')::jsonb
FROM generate_series(1, 100) i;

-- 21. 100 Anomaly Alerts
INSERT INTO public.anomaly_alerts (tenant_id, entity_type, entity_id, anomaly_type, severity, score, details, detected_at)
SELECT nf.tenant_id, 'network_function', nf.id, (ARRAY['latency_spike','throughput_drop','memory_leak'])[1 + (rn % 3)],
  (ARRAY['critical','warning','info'])[1 + (rn % 3)], (0.7 + (random() * 0.25))::numeric(5,2), ('{"baseline":15,"observed":' || (35 + rn) || '}')::jsonb, NOW() - (random() * interval '3 days')
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 22. 100 AI Predictions
INSERT INTO public.ai_predictions (tenant_id, prediction_type, entity_type, entity_id, predicted_value, confidence, predicted_for, metadata)
SELECT nf.tenant_id, 'throughput_forecast_mbps', 'network_function', nf.id, (800 + (random() * 400))::numeric(10,2), (0.8 + (random() * 0.15))::numeric(5,2), NOW() + (random() * interval '6 hours'), ('{"window":"2h"}')::jsonb
FROM (SELECT id, tenant_id FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 23. 100 Optimization Recommendations
INSERT INTO public.optimization_recommendations (tenant_id, title, description, recommendation_type, target_type, target_id, payload, status)
SELECT nf.tenant_id, 'Scale NF-' || rn, 'Optimization recommendation for better performance', 'capacity_scale', 'network_function', nf.id, ('{"replicas":' || (2 + (rn % 2)) || '}')::jsonb, (ARRAY['pending','applied','rejected'])[1 + (rn % 3)]
FROM (SELECT id, tenant_id, row_number() OVER (ORDER BY created_at DESC) as rn FROM public.network_functions WHERE tenant_id = '11111111-0000-0000-0000-000000000001' ORDER BY created_at DESC LIMIT 100) nf;

-- 24. 100 Configurations
INSERT INTO public.configurations (tenant_id, name, scope, config, version, description)
SELECT '11111111-0000-0000-0000-000000000001', 'config-' || lpad(i::text, 3, '0'), 'platform', ('{"param_' || i || '":"value_' || i || '","enabled":true}')::jsonb, 1, 'Config entry #' || i
FROM generate_series(1, 100) i;
