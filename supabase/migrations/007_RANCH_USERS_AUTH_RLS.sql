-- ============================================================================
-- RanchLink 007: Ranch Users, Auth, Wallets, Events & Comprehensive RLS
-- ============================================================================
-- Fully idempotent — safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- 1. claim_secret on tags (QR proof-of-possession)
-- ============================================================================
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS claim_secret uuid;
CREATE INDEX IF NOT EXISTS idx_tags_claim_secret
  ON public.tags(claim_secret) WHERE claim_secret IS NOT NULL;

-- ============================================================================
-- 2. ranch_users (rancher accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ranch_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  name text,
  ranch_id uuid REFERENCES public.ranches(id) ON DELETE SET NULL,
  email_verified boolean NOT NULL DEFAULT false,
  phone_verified boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);
CREATE INDEX IF NOT EXISTS idx_ranch_users_email ON public.ranch_users(email);
CREATE INDEX IF NOT EXISTS idx_ranch_users_ranch_id ON public.ranch_users(ranch_id);
CREATE INDEX IF NOT EXISTS idx_ranch_users_phone ON public.ranch_users(phone) WHERE phone IS NOT NULL;

-- ============================================================================
-- 3. verification_codes (email OTP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  code text NOT NULL,
  purpose text NOT NULL DEFAULT 'claim',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verification_codes_lookup
  ON public.verification_codes(email, purpose, expires_at);

-- ============================================================================
-- 4. ranch_sessions (auth tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ranch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.ranch_users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ranch_sessions_token ON public.ranch_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_ranch_sessions_user ON public.ranch_sessions(user_id);

-- ============================================================================
-- 5. ranch_wallets (EOA custodial wallets, one per ranch)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ranch_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranch_id uuid NOT NULL REFERENCES public.ranches(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  encrypted_private_key text NOT NULL,
  chain text NOT NULL DEFAULT 'BASE',
  is_custodial boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ranch_id, chain)
);
CREATE INDEX IF NOT EXISTS idx_ranch_wallets_ranch ON public.ranch_wallets(ranch_id);
CREATE INDEX IF NOT EXISTS idx_ranch_wallets_address ON public.ranch_wallets(wallet_address);

-- ============================================================================
-- 6. animal_events (health, vaccination, weight, movement, breeding, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.animal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  ranch_id uuid REFERENCES public.ranches(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  evidence_urls text[] DEFAULT '{}',
  created_by uuid REFERENCES public.ranch_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_animal_events_animal ON public.animal_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_events_ranch ON public.animal_events(ranch_id);
CREATE INDEX IF NOT EXISTS idx_animal_events_type ON public.animal_events(event_type);
CREATE INDEX IF NOT EXISTS idx_animal_events_date ON public.animal_events(event_date DESC);

-- ============================================================================
-- 7. transfer_requests (wallet transfers, cold wallet conversion — fee-based)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transfer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranch_id uuid NOT NULL REFERENCES public.ranches(id) ON DELETE CASCADE,
  request_type text NOT NULL, -- 'transfer_rwa', 'convert_cold', 'export_wallet'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  target_address text,
  token_ids text[],
  fee_amount_cents integer,
  fee_currency text DEFAULT 'USD',
  notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. Add owner_user_id to tags (links claimed tag to the ranch_user who claimed it)
-- ============================================================================
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS owner_user_id uuid;

-- Add wallet_address to ranches for quick access
ALTER TABLE public.ranches ADD COLUMN IF NOT EXISTS wallet_address text;
ALTER TABLE public.ranches ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================================
-- 9. Comprehensive RLS — drop old permissive policies, create tight ones
-- ============================================================================

-- Helper: idempotent policy drop
CREATE OR REPLACE FUNCTION _tmp_drop_policy(tbl text, pol text) RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
EXCEPTION WHEN OTHERS THEN NULL;
END $$ LANGUAGE plpgsql;

-- ── animals (public readable — demo cards) ──
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
SELECT _tmp_drop_policy('animals', 'Public can view animals');
SELECT _tmp_drop_policy('animals', 'Authenticated users can insert animals');
SELECT _tmp_drop_policy('animals', 'Owners can update own animals');
SELECT _tmp_drop_policy('animals', 'animals_public_select');
CREATE POLICY "animals_public_select" ON public.animals FOR SELECT USING (true);

-- ── tags (public readable) ──
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
SELECT _tmp_drop_policy('tags', 'tags_public_select');
CREATE POLICY "tags_public_select" ON public.tags FOR SELECT USING (true);

-- ── ranches (public readable) ──
ALTER TABLE public.ranches ENABLE ROW LEVEL SECURITY;
SELECT _tmp_drop_policy('ranches', 'Public can view owners');
SELECT _tmp_drop_policy('ranches', 'Users can insert own owner');
SELECT _tmp_drop_policy('ranches', 'Users can update own owner');
SELECT _tmp_drop_policy('ranches', 'ranches_public_select');
CREATE POLICY "ranches_public_select" ON public.ranches FOR SELECT USING (true);

-- ── batches (public readable) ──
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
SELECT _tmp_drop_policy('batches', 'Public can view batches');
SELECT _tmp_drop_policy('batches', 'batches_public_select');
CREATE POLICY "batches_public_select" ON public.batches FOR SELECT USING (true);

-- ── animal_events (public readable — shown on animal cards) ──
ALTER TABLE public.animal_events ENABLE ROW LEVEL SECURITY;
SELECT _tmp_drop_policy('animal_events', 'animal_events_public_select');
CREATE POLICY "animal_events_public_select" ON public.animal_events FOR SELECT USING (true);

-- ── kits (public readable) ──
DO $$ BEGIN ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT _tmp_drop_policy('kits', 'kits_public_select');
DO $$ BEGIN CREATE POLICY "kits_public_select" ON public.kits FOR SELECT USING (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── kit_tags (public readable) ──
DO $$ BEGIN ALTER TABLE public.kit_tags ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT _tmp_drop_policy('kit_tags', 'kit_tags_public_select');
DO $$ BEGIN CREATE POLICY "kit_tags_public_select" ON public.kit_tags FOR SELECT USING (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── LOCKED DOWN: stripe_orders (service role only) ──
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;
-- No policies = deny all for anon/authenticated. Service role bypasses RLS.

-- ── LOCKED DOWN: ranch_users ──
ALTER TABLE public.ranch_users ENABLE ROW LEVEL SECURITY;

-- ── LOCKED DOWN: verification_codes ──
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- ── LOCKED DOWN: ranch_sessions ──
ALTER TABLE public.ranch_sessions ENABLE ROW LEVEL SECURITY;

-- ── LOCKED DOWN: ranch_wallets (contains encrypted keys!) ──
ALTER TABLE public.ranch_wallets ENABLE ROW LEVEL SECURITY;

-- ── LOCKED DOWN: transfer_requests ──
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

-- Cleanup
DROP FUNCTION IF EXISTS _tmp_drop_policy(text, text);

-- ============================================================================
-- 10. Reload PostgREST schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
