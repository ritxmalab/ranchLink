-- Migration 006: Add activation_state to tags and create contracts table
-- This migration adds the activation_state field and contracts table for v1.0 extensibility

-- Add activation_state to tags if it doesn't exist
ALTER TABLE tags ADD COLUMN IF NOT EXISTS activation_state text DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_tags_activation_state ON tags(activation_state);

-- Update existing tags to have 'active' activation_state
UPDATE tags SET activation_state = 'active' WHERE activation_state IS NULL;

-- Create contracts table for future multi-chain/RWA support
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

-- Add comment
COMMENT ON TABLE contracts IS 'Smart contract registry for multi-chain and multi-asset support (v1.5+)';
COMMENT ON COLUMN tags.activation_state IS 'RanchLink-level activation: active = live in system, inactive = soft-disabled';

