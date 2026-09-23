-- ============================================================================
-- 008 — Lock down anon/authenticated access via PostgREST
--
-- Migration 007 left `USING (true)` SELECT policies on tags, animals, ranches,
-- batches, animal_events, kits and kit_tags. Because the anon key is public by
-- design, anyone could read every row of those tables directly from PostgREST —
-- including tags.claim_token (grants edit rights over an animal),
-- tags.owner_user_id, ranches.contact_email / phone and animals purchase data.
--
-- The web app never queries Supabase with the anon key: every read goes through
-- a Next.js route handler using the service role. Removing the permissive
-- policies therefore closes direct public access without changing app behavior.
-- ============================================================================

CREATE OR REPLACE FUNCTION _tmp_drop_policy(tbl text, pol text) RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
EXCEPTION WHEN OTHERS THEN NULL;
END $$ LANGUAGE plpgsql;

SELECT _tmp_drop_policy('animals', 'animals_public_select');
SELECT _tmp_drop_policy('tags', 'tags_public_select');
SELECT _tmp_drop_policy('ranches', 'ranches_public_select');
SELECT _tmp_drop_policy('batches', 'batches_public_select');
SELECT _tmp_drop_policy('animal_events', 'animal_events_public_select');
SELECT _tmp_drop_policy('kits', 'kits_public_select');
SELECT _tmp_drop_policy('kit_tags', 'kit_tags_public_select');
SELECT _tmp_drop_policy('devices', 'devices_public_select');

-- Keep RLS enabled everywhere; with no policies, anon/authenticated get nothing
-- and the service role continues to bypass RLS.
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.kit_tags ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Belt and braces: remove table grants from the PostgREST roles so a future
-- permissive policy cannot re-expose these tables by itself.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'animals','tags','ranches','batches','animal_events','kits','kit_tags',
    'devices','owners','stripe_orders','ranch_users','ranch_sessions',
    'verification_codes','ranch_wallets','transfer_requests'
  ] LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS _tmp_drop_policy(text, text);

NOTIFY pgrst, 'reload schema';
