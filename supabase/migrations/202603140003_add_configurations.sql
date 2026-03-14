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
