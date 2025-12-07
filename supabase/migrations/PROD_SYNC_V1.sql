-- ============================================================================
-- RanchLink v1.0 Production Schema Sync Migration
-- ============================================================================
-- 
-- This migration ensures Supabase PROD schema matches v1.0 code expectations.
-- It is idempotent and non-destructive - safe to run multiple times.
--
-- Based on analysis of:
-- - apps/web/app/api/factory/batches/route.ts
-- - apps/web/app/api/superadmin/devices/route.ts
-- - apps/web/app/api/dashboard/animals/route.ts
-- - apps/web/app/api/dashboard/tags/route.ts
-- - apps/web/app/api/tags/[tag_code]/route.ts
-- - apps/web/app/api/attach-tag/route.ts
-- - apps/web/app/api/animals/[id]/route.ts
-- - apps/web/app/api/claim-kit/route.ts
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create public.tags table (if it doesn't exist)
-- ----------------------------------------------------------------------------
-- This is the canonical v1.0 table for tags. It replaces the legacy 'devices' table.
-- Each tag represents one physical tag with blockchain metadata.

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text UNIQUE NOT NULL,
  chain text NOT NULL DEFAULT 'BASE',
  contract_address text,
  token_id text,
  mint_tx_hash text,
  batch_id uuid,
  ranch_id uuid,
  animal_id uuid,
  status text NOT NULL DEFAULT 'in_inventory',
  activation_state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on tag_code for fast lookups (used in /t/[tag_code] route)
CREATE INDEX IF NOT EXISTS idx_tags_tag_code ON public.tags(tag_code);

-- Create index on batch_id for batch queries
CREATE INDEX IF NOT EXISTS idx_tags_batch_id ON public.tags(batch_id);

-- Create index on animal_id for animal-tag joins
CREATE INDEX IF NOT EXISTS idx_tags_animal_id ON public.tags(animal_id);

-- Create index on ranch_id for ranch filtering
CREATE INDEX IF NOT EXISTS idx_tags_ranch_id ON public.tags(ranch_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_tags_status ON public.tags(status);

-- ----------------------------------------------------------------------------
-- 2. Ensure public.batches has all v1.0 columns
-- ----------------------------------------------------------------------------
-- The error "Could not find the 'batch_name' column" indicates this column is missing.
-- We also ensure all other columns used by v1.0 exist.

-- Add batch_name column (CRITICAL - this is the missing column causing errors)
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS batch_name text;

-- Add other v1.0 columns if they don't exist
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS model text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS material text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS color text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS chain text DEFAULT 'BASE';

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS count integer;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS target_ranch_id uuid;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);

-- Create index on target_ranch_id for ranch filtering
CREATE INDEX IF NOT EXISTS idx_batches_target_ranch_id ON public.batches(target_ranch_id);

-- ----------------------------------------------------------------------------
-- 3. Ensure public.animals has all v1.0 columns
-- ----------------------------------------------------------------------------
-- Animals are linked to tags via tags.animal_id (not animals.tag_id).
-- This allows one animal to have multiple tags if needed in the future.

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS public_id text;

-- Create unique index on public_id if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_public_id ON public.animals(public_id)
  WHERE public_id IS NOT NULL;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS species text;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS breed text;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS birth_year integer;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS sex text;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS ranch_id uuid;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index on public_id for fast lookups (used in /a/[public_id] route)
CREATE INDEX IF NOT EXISTS idx_animals_public_id_lookup ON public.animals(public_id);

-- Create index on ranch_id for ranch filtering
CREATE INDEX IF NOT EXISTS idx_animals_ranch_id ON public.animals(ranch_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(status);

-- ----------------------------------------------------------------------------
-- 4. Ensure public.ranches table exists (referenced by tags and animals)
-- ----------------------------------------------------------------------------
-- Ranches are referenced by both tags and animals.

CREATE TABLE IF NOT EXISTS public.ranches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. Create foreign key relationships
-- ----------------------------------------------------------------------------
-- These relationships enable PostgREST to understand joins like:
-- - tags.animals(*) 
-- - animals.tags(*)
-- - tags.ranches(*)
-- - animals.ranches(*)

-- Foreign key: tags.batch_id → batches.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_batch_id_fkey'
  ) THEN
    ALTER TABLE public.tags
      ADD CONSTRAINT tags_batch_id_fkey
      FOREIGN KEY (batch_id) REFERENCES public.batches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Foreign key: tags.ranch_id → ranches.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_ranch_id_fkey'
  ) THEN
    ALTER TABLE public.tags
      ADD CONSTRAINT tags_ranch_id_fkey
      FOREIGN KEY (ranch_id) REFERENCES public.ranches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Foreign key: tags.animal_id → animals.id
-- This is the CRITICAL relationship that enables:
-- - tags.animals(*) queries
-- - animals.tags(*) queries (via reverse lookup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    ALTER TABLE public.tags
      ADD CONSTRAINT tags_animal_id_fkey
      FOREIGN KEY (animal_id) REFERENCES public.animals(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Foreign key: animals.ranch_id → ranches.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'animals_ranch_id_fkey'
  ) THEN
    ALTER TABLE public.animals
      ADD CONSTRAINT animals_ranch_id_fkey
      FOREIGN KEY (ranch_id) REFERENCES public.ranches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Foreign key: batches.target_ranch_id → ranches.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'batches_target_ranch_id_fkey'
  ) THEN
    ALTER TABLE public.batches
      ADD CONSTRAINT batches_target_ranch_id_fkey
      FOREIGN KEY (target_ranch_id) REFERENCES public.ranches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Enable Row Level Security (RLS) if not already enabled
-- ----------------------------------------------------------------------------
-- RLS is important for production security, but we don't want to break existing policies.

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranches ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. Create helper tables for kits (if claim-kit is used)
-- ----------------------------------------------------------------------------
-- These are optional but referenced in claim-kit route.

CREATE TABLE IF NOT EXISTS public.kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'unclaimed',
  claimed_ranch_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kit_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(kit_id, tag_id)
);

-- Foreign keys for kits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kit_tags_kit_id_fkey'
  ) THEN
    ALTER TABLE public.kit_tags
      ADD CONSTRAINT kit_tags_kit_id_fkey
      FOREIGN KEY (kit_id) REFERENCES public.kits(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kit_tags_tag_id_fkey'
  ) THEN
    ALTER TABLE public.kit_tags
      ADD CONSTRAINT kit_tags_tag_id_fkey
      FOREIGN KEY (tag_id) REFERENCES public.tags(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kits_claimed_ranch_id_fkey'
  ) THEN
    ALTER TABLE public.kits
      ADD CONSTRAINT kits_claimed_ranch_id_fkey
      FOREIGN KEY (claimed_ranch_id) REFERENCES public.ranches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Migration Complete
-- ----------------------------------------------------------------------------
-- This migration is idempotent - safe to run multiple times.
-- All tables, columns, indexes, and foreign keys are created only if they don't exist.

