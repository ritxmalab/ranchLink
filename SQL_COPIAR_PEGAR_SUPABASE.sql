-- ============================================================================
-- Create contracts table for v1.0 contract registry
-- ============================================================================
-- Copia TODO este código y pégalo en Supabase SQL Editor

-- Eliminar tabla antigua si existe
DROP TABLE IF EXISTS public.contracts CASCADE;

-- Crear nueva tabla con schema correcto
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  symbol text NOT NULL,
  contract_address text NOT NULL UNIQUE,
  chain text NOT NULL DEFAULT 'BASE',
  standard text NOT NULL DEFAULT 'ERC721',
  default_for text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_contracts_address ON public.contracts(contract_address);
CREATE INDEX idx_contracts_default_for ON public.contracts USING GIN(default_for);

-- Habilitar Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Insertar el contrato RanchLinkTag desplegado
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

-- Refrescar cache de PostgREST
NOTIFY pgrst, 'reload schema';

