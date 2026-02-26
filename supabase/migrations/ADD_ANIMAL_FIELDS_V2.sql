-- ============================================================================
-- RanchLink v2.0 Animal Fields Migration
-- Adds all field sections from the architecture diagram:
-- BASIC (size), IDENTIFICATION, ADDITIONAL, CALLFHOOD, PURCHASE
-- ============================================================================
-- Idempotent - safe to run multiple times.

-- BASIC additions
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS size text;

-- IDENTIFICATION
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS eid text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS secondary_id text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS tattoo text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS brand text;

-- ADDITIONAL
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS head_count integer;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS labels text[];

-- CALLFHOOD / GENETICS
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS dam_id text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS sire_id text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS birth_weight numeric(8,2);
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS weaning_weight numeric(8,2);
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS weaning_date date;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS yearling_weight numeric(8,2);
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS yearling_date date;

-- PURCHASE
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS seller text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2);
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS purchase_date date;

-- Also add metadata_cid and metadata_tx_hash to tags if missing
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS metadata_cid text;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS metadata_tx_hash text;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS public_id text;

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_animals_eid ON public.animals(eid) WHERE eid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_animals_owner ON public.animals(owner) WHERE owner IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tags_public_id ON public.tags(public_id) WHERE public_id IS NOT NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
