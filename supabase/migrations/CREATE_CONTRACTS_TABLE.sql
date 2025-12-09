-- ============================================================================
-- Create contracts table for v1.0 contract registry
-- ============================================================================
-- This table stores smart contract configurations for different asset types
-- Allows dynamic contract management without code changes

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  symbol text NOT NULL,
  contract_address text NOT NULL UNIQUE,
  chain text NOT NULL DEFAULT 'BASE',
  standard text NOT NULL DEFAULT 'ERC721', -- ERC721, ERC3643, ERC7518, etc.
  default_for text[] DEFAULT ARRAY[]::text[], -- Array of asset types: ['cattle', 'licensed_products', etc.]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on contract_address for fast lookups
CREATE INDEX IF NOT EXISTS idx_contracts_address ON public.contracts(contract_address);

-- Create index on default_for for array contains queries
CREATE INDEX IF NOT EXISTS idx_contracts_default_for ON public.contracts USING GIN(default_for);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Insert the deployed RanchLinkTag contract (if it doesn't exist)
INSERT INTO public.contracts (
  name,
  symbol,
  contract_address,
  chain,
  standard,
  default_for
) VALUES (
  'RanchLinkTag',
  'RLTAG',
  '0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242',
  'BASE_MAINNET',
  'ERC721',
  ARRAY['cattle']::text[]
) ON CONFLICT (contract_address) DO NOTHING;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

