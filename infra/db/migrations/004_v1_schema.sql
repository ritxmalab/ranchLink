-- RanchLink v1.0 Schema Migration
-- Adds new tables for v1.0 while keeping existing tables for backward compatibility

-- ============================================
-- RANCHES (replaces "owners" concept)
-- ============================================
CREATE TABLE IF NOT EXISTS ranches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  phone text,
  billing_info jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranches_email ON ranches(contact_email);

-- ============================================
-- TAGS (replaces "devices" concept)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text UNIQUE NOT NULL,              -- e.g. "RL-001" (printed on physical tag)
  chain text DEFAULT 'BASE',
  contract_address text,
  token_id bigint,                            -- ERC-721 tokenId
  mint_tx_hash text,
  nfc_uid text,
  ranch_id uuid REFERENCES ranches(id),
  animal_id uuid,                             -- Will reference animals.id after migration
  batch_id uuid REFERENCES batches(id),
  status text DEFAULT 'in_inventory',         -- 'in_inventory' | 'assigned' | 'attached' | 'retired'
  activation_state text DEFAULT 'active',      -- 'active' | 'inactive' (RanchLink-level switch)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tags_tag_code ON tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_tags_ranch ON tags(ranch_id);
CREATE INDEX IF NOT EXISTS idx_tags_animal ON tags(animal_id);
CREATE INDEX IF NOT EXISTS idx_tags_batch ON tags(batch_id);
CREATE INDEX IF NOT EXISTS idx_tags_token_id ON tags(token_id);
CREATE INDEX IF NOT EXISTS idx_tags_status ON tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_activation_state ON tags(activation_state);

-- ============================================
-- KITS (for retail distribution)
-- ============================================
CREATE TABLE IF NOT EXISTS kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_code text UNIQUE NOT NULL,              -- e.g. "RLKIT-8F3K72"
  status text DEFAULT 'unclaimed',            -- 'unclaimed' | 'claimed'
  claimed_ranch_id uuid REFERENCES ranches(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kits_kit_code ON kits(kit_code);
CREATE INDEX IF NOT EXISTS idx_kits_status ON kits(status);

-- ============================================
-- KIT_TAGS (junction table)
-- ============================================
CREATE TABLE IF NOT EXISTS kit_tags (
  kit_id uuid REFERENCES kits(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (kit_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_kit_tags_kit ON kit_tags(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_tags_tag ON kit_tags(tag_id);

-- ============================================
-- UPDATE EXISTING TABLES FOR V1.0
-- ============================================

-- Add ranch_id to animals (for v1.0 compatibility)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS ranch_id uuid REFERENCES ranches(id);
CREATE INDEX IF NOT EXISTS idx_animals_ranch ON animals(ranch_id);

-- Update batches table for v1.0
ALTER TABLE batches ADD COLUMN IF NOT EXISTS batch_name text;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS chain text DEFAULT 'BASE';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS target_ranch_id uuid REFERENCES ranches(id);

-- ============================================
-- CONTRACTS (for future multi-chain/RWA support)
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                          -- e.g. "RanchLinkTag Base Mainnet"
  symbol text,                                 -- e.g. "RLTAG"
  contract_address text NOT NULL,
  chain text NOT NULL,                         -- e.g. "BASE_MAINNET", "BASE_SEPOLIA", "POLYGON"
  standard text,                               -- e.g. "ERC721", "ERC1155", "RWA_7518"
  default_for text,                            -- e.g. "cattle", "land", "equipment"
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_address ON contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_contracts_chain ON contracts(chain);
CREATE INDEX IF NOT EXISTS idx_contracts_default_for ON contracts(default_for);

-- ============================================
-- MIGRATION HELPERS
-- ============================================

-- Function to migrate existing owners to ranches
CREATE OR REPLACE FUNCTION migrate_owners_to_ranches()
RETURNS void AS $$
BEGIN
  INSERT INTO ranches (id, name, contact_email, phone, created_at)
  SELECT id, COALESCE(basename, 'Ranch ' || id::text), email, phone, created_at
  FROM owners
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate existing devices to tags
CREATE OR REPLACE FUNCTION migrate_devices_to_tags()
RETURNS void AS $$
BEGIN
  INSERT INTO tags (
    id,
    tag_code,
    chain,
    contract_address,
    token_id,
    ranch_id,
    batch_id,
    status,
    created_at
  )
  SELECT 
    id,
    COALESCE(tag_id, 'RL-' || id::text),
    'BASE',
    NULL, -- Will be set when contract is deployed
    CASE 
      WHEN token_id ~ '^[0-9]+$' THEN token_id::bigint 
      ELSE NULL 
    END,
    owner_id, -- Map owner_id to ranch_id
    batch_id,
    CASE 
      WHEN status = 'claimed' THEN 'attached'
      WHEN status = 'printed' THEN 'in_inventory'
      ELSE 'in_inventory'
    END,
    'active', -- activation_state default
    created_at
  FROM devices
  ON CONFLICT (tag_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTES
-- ============================================
-- 
-- To run migration:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Then run: SELECT migrate_owners_to_ranches();
-- 3. Then run: SELECT migrate_devices_to_tags();
-- 
-- Old tables (owners, devices) are kept for backward compatibility
-- New code should use ranches and tags
-- 

