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
