-- ============================================================================
-- RanchLink v1.0 Production Schema Sync Migration (FINAL FIX)
-- ============================================================================
-- 
-- This migration ensures Supabase PROD schema matches v1.0 code expectations.
-- It is idempotent and non-destructive - safe to run multiple times.
--
-- FIXED: Ensures animals.id has PRIMARY KEY constraint before creating foreign keys
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ensure public.animals has id column (uuid primary key)
-- ----------------------------------------------------------------------------
-- CRITICAL: animals.id MUST be PRIMARY KEY before we can create foreign keys

DO $$
BEGIN
  -- Step 1: Add id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'animals' 
      AND column_name = 'id'
  ) THEN
    -- Add id column
    ALTER TABLE public.animals
      ADD COLUMN id uuid DEFAULT gen_random_uuid();
    
    -- Update existing rows to have unique ids
    UPDATE public.animals
    SET id = gen_random_uuid()
    WHERE id IS NULL;
    
    -- Make id NOT NULL
    ALTER TABLE public.animals
      ALTER COLUMN id SET NOT NULL;
  END IF;
  
  -- Step 2: Drop existing primary key if it's on public_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND constraint_type = 'PRIMARY KEY'
      AND constraint_name != 'animals_pkey'
  ) THEN
    -- Try common constraint names
    BEGIN
      ALTER TABLE public.animals DROP CONSTRAINT animals_pkey;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ALTER TABLE public.animals DROP CONSTRAINT animals_public_id_pkey;
      EXCEPTION WHEN OTHERS THEN
        -- Try to find and drop whatever PK exists
        DECLARE
          pk_name text;
        BEGIN
          SELECT constraint_name INTO pk_name
          FROM information_schema.table_constraints
          WHERE table_schema = 'public'
            AND table_name = 'animals'
            AND constraint_type = 'PRIMARY KEY'
          LIMIT 1;
          
          IF pk_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.animals DROP CONSTRAINT %I', pk_name);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END;
    END;
  END IF;
  
  -- Step 3: Ensure id is PRIMARY KEY
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.animals
      ADD PRIMARY KEY (id);
  END IF;
  
  -- Step 4: Ensure public_id is unique (but not primary key)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%public_id%'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_public_id_unique 
        ON public.animals(public_id) 
        WHERE public_id IS NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Add all v1.0 columns to animals table
-- ----------------------------------------------------------------------------

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

-- Create indexes for animals
CREATE INDEX IF NOT EXISTS idx_animals_public_id_lookup ON public.animals(public_id);
CREATE INDEX IF NOT EXISTS idx_animals_ranch_id ON public.animals(ranch_id);
CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(status);

-- ----------------------------------------------------------------------------
-- 3. Ensure public.ranches table exists
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ranches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Create public.tags table (if it doesn't exist)
-- ----------------------------------------------------------------------------

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

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_tag_code ON public.tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_tags_batch_id ON public.tags(batch_id);
CREATE INDEX IF NOT EXISTS idx_tags_animal_id ON public.tags(animal_id);
CREATE INDEX IF NOT EXISTS idx_tags_ranch_id ON public.tags(ranch_id);
CREATE INDEX IF NOT EXISTS idx_tags_status ON public.tags(status);

-- ----------------------------------------------------------------------------
-- 5. Ensure public.batches has all v1.0 columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS batch_name text;

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

CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_target_ranch_id ON public.batches(target_ranch_id);

-- ----------------------------------------------------------------------------
-- 6. Create foreign key relationships
-- ----------------------------------------------------------------------------
-- CRITICAL: Only create foreign keys AFTER ensuring PRIMARY KEY constraints exist

-- Foreign key: tags.batch_id → batches.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_batch_id_fkey'
  ) THEN
    -- Verify batches.id has PRIMARY KEY
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'batches'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_batch_id_fkey
        FOREIGN KEY (batch_id) REFERENCES public.batches(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Foreign key: tags.ranch_id → ranches.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_ranch_id_fkey'
  ) THEN
    -- Verify ranches.id has PRIMARY KEY
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'ranches'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_ranch_id_fkey
        FOREIGN KEY (ranch_id) REFERENCES public.ranches(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Foreign key: tags.animal_id → animals.id
-- CRITICAL: Verify animals.id has PRIMARY KEY constraint before creating FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    -- Verify animals.id exists AND has PRIMARY KEY constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'animals'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'id'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_animal_id_fkey
        FOREIGN KEY (animal_id) REFERENCES public.animals(id)
        ON DELETE SET NULL;
    ELSE
      RAISE NOTICE 'Skipping tags_animal_id_fkey: animals.id does not have PRIMARY KEY constraint';
    END IF;
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
-- 7. Enable Row Level Security (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranches ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. Create helper tables for kits (optional)
-- ----------------------------------------------------------------------------

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

