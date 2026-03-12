-- ============================================================================
-- TAMACORE: pipeline contacts, comptroller snapshots, agent activity log
-- Supports CRM-like autonomous activities and demo mail pipeline.
-- ============================================================================
-- Idempotent - safe to run multiple times.

-- ----------------------------------------------------------------------------
-- 1. pipeline_contacts — early target pipeline (who gets demos via USPS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pipeline_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_order int NOT NULL DEFAULT 0,
  legal_name text NOT NULL,
  contact text,
  location text,
  category text,
  herd_type text,
  estimated_herd text,
  status text NOT NULL DEFAULT 'target',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_status ON public.pipeline_contacts(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_category ON public.pipeline_contacts(category);
CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_legal_name ON public.pipeline_contacts(legal_name);

COMMENT ON TABLE public.pipeline_contacts IS 'TAMACORE early target pipeline: ranches/entities to receive demos via USPS. status: target, prototype_sent, contacted, demo_sent, converted, closed.';

-- ----------------------------------------------------------------------------
-- 2. comptroller_snapshots — captured Texas Comptroller franchise tax data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comptroller_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_contact_id uuid REFERENCES public.pipeline_contacts(id) ON DELETE CASCADE,
  entity_name text,
  taxpayer_number text,
  mailing_address text,
  mailing_city text,
  mailing_state text,
  mailing_zip text,
  right_to_transact text,
  state_of_formation text,
  sos_registration_status text,
  effective_sos_date text,
  sos_file_number text,
  registered_agent_name text,
  registered_office_address text,
  registered_office_city text,
  registered_office_state text,
  registered_office_zip text,
  pir_year text,
  pir_title text,
  pir_name_and_address text,
  zip_within_50_mi_atx boolean,
  address_validated boolean,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comptroller_snapshots_contact ON public.comptroller_snapshots(pipeline_contact_id);

COMMENT ON TABLE public.comptroller_snapshots IS 'Texas Comptroller franchise tax data per pipeline contact. Used for invoice, mail card, address validation.';

-- ----------------------------------------------------------------------------
-- 3. agent_activity_log — live actionables for dashboard
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_contact_id uuid REFERENCES public.pipeline_contacts(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  step text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_contact ON public.agent_activity_log(pipeline_contact_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON public.agent_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_type ON public.agent_activity_log(action_type);

COMMENT ON TABLE public.agent_activity_log IS 'TAMACORE agent actionables: comptroller_search, verify_zip, capture_data, enrich_web, enrich_whitepages, message_generated, demo_sent, etc.';

-- ----------------------------------------------------------------------------
-- RLS: service role only (API uses service key)
-- ----------------------------------------------------------------------------
ALTER TABLE public.pipeline_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptroller_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only pipeline_contacts" ON public.pipeline_contacts FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Service role only comptroller_snapshots" ON public.comptroller_snapshots FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Service role only agent_activity_log" ON public.agent_activity_log FOR ALL USING (false) WITH CHECK (false);

-- Allow read for dashboard (optional: restrict by auth later)
CREATE POLICY "Allow read pipeline_contacts" ON public.pipeline_contacts FOR SELECT USING (true);
CREATE POLICY "Allow read comptroller_snapshots" ON public.comptroller_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow read agent_activity_log" ON public.agent_activity_log FOR SELECT USING (true);
