-- ============================================================================
-- 009 — Session token hashing + integrity constraints
--
-- ranch_sessions.session_token now stores a SHA-256 digest of the cookie value
-- instead of the cookie itself (see apps/web/lib/ranch-auth.ts). Existing rows
-- hold plaintext tokens that can never match a digest, so they are removed;
-- affected users simply sign in again with a one-time code.
-- ============================================================================

DELETE FROM public.ranch_sessions;

CREATE UNIQUE INDEX IF NOT EXISTS ranch_sessions_token_key
  ON public.ranch_sessions (session_token);

CREATE INDEX IF NOT EXISTS ranch_sessions_expires_at_idx
  ON public.ranch_sessions (expires_at);

-- A tag code and an animal public id must be unique: attach and public-card
-- lookups both assume a single row.
CREATE UNIQUE INDEX IF NOT EXISTS tags_tag_code_key ON public.tags (tag_code);
CREATE UNIQUE INDEX IF NOT EXISTS animals_public_id_key ON public.animals (public_id);

-- A tag can only ever point at one animal, and vice versa.
CREATE UNIQUE INDEX IF NOT EXISTS tags_animal_id_key
  ON public.tags (animal_id) WHERE animal_id IS NOT NULL;

-- Verification codes: fast lookup of the newest unused code, and cleanup.
CREATE INDEX IF NOT EXISTS verification_codes_lookup_idx
  ON public.verification_codes (email, purpose, created_at DESC);

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS stripe_orders_session_key
    ON public.stripe_orders (stripe_checkout_session_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
