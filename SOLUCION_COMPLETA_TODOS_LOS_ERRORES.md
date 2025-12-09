# 🔧 Solución Completa - Todos los Errores Simultáneos

## ❌ Errores Identificados (todos pasando a la vez)

1. **Missing `SERVER_WALLET_PRIVATE_KEY`** - Variable de entorno faltante en Vercel
2. **Missing `NEXT_PUBLIC_ALCHEMY_BASE_RPC`** - Variable de entorno faltante en Vercel
3. **`column contracts.default_for does not exist`** - Tabla `contracts` con schema incorrecto en Supabase

---

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Agregar Variables de Entorno en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona proyecto: **ranch-link**
3. Ve a: **Settings** → **Environment Variables**
4. Agrega estas 2 variables:

#### Variable 1: `SERVER_WALLET_PRIVATE_KEY`
- **Name:** `SERVER_WALLET_PRIVATE_KEY`
- **Value:** (la clave privada del wallet del servidor - está en tu `.env.local` local)
  - Si no la tienes, necesitas la clave privada que corresponde a: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
- **Name:** `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
- **Value:** Tu URL de Alchemy para Base Mainnet
  - Formato: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
  - Si no tienes Alchemy, usa: `https://mainnet.base.org` (menos confiable)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 3 (opcional pero recomendado): `ALCHEMY_BASE_RPC`
- **Name:** `ALCHEMY_BASE_RPC`
- **Value:** (mismo valor que `NEXT_PUBLIC_ALCHEMY_BASE_RPC`)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

**⚠️ IMPORTANTE:** Después de agregar las variables, Vercel necesita hacer un nuevo deployment. Puede tardar 1-2 minutos.

---

### PASO 2: Crear/Corregir Tabla `contracts` en Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **SQL Editor**
4. **Borra todo** lo que esté en el editor
5. Copia y pega este SQL completo:

```sql
-- ============================================================================
-- Create contracts table for v1.0 contract registry
-- ============================================================================
-- This fixes the error: "column contracts.default_for does not exist"

-- Drop the old contracts table if it exists (backup first if needed)
DROP TABLE IF EXISTS public.contracts CASCADE;

-- Create new contracts table with correct schema
CREATE TABLE public.contracts (
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

-- Create indexes for fast lookups
CREATE INDEX idx_contracts_address ON public.contracts(contract_address);
CREATE INDEX idx_contracts_default_for ON public.contracts USING GIN(default_for);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Insert the deployed RanchLinkTag contract
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
```

6. Haz clic en **"Run"** (botón verde)
7. Deberías ver: **"Success. No rows returned"** o similar
8. Espera 10-30 segundos para que PostgREST recargue el schema

---

### PASO 3: Verificar que Todo Funcione

#### 3.1 Verificar Variables de Entorno
1. Espera 1-2 minutos después de agregar las variables en Vercel
2. Ve a: `https://ranch-link.vercel.app/api/diagnose-mint`
3. Deberías ver en la respuesta JSON:
   ```json
   {
     "checks": {
       "env": {
         "SERVER_WALLET_PRIVATE_KEY": { "exists": true },
         "NEXT_PUBLIC_ALCHEMY_BASE_RPC": { "exists": true }
       },
       "can_mint": true
     }
   }
   ```

#### 3.2 Verificar Tabla Contracts
1. En Supabase Dashboard → **Table Editor**
2. Busca la tabla `contracts`
3. Deberías ver 1 fila con:
   - name: `RanchLinkTag`
   - contract_address: `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
   - default_for: `["cattle"]`

#### 3.3 Probar el Mint
1. Ve a: `https://ranch-link.vercel.app/superadmin`
2. Ve a la tab **Factory**
3. Configura un batch pequeño (1-3 tags)
4. Haz clic en **"Generate & Mint Tags"**
5. **Deberías ver:**
   - ✅ No más errores de "Missing SERVER_WALLET_PRIVATE_KEY"
   - ✅ No más errores de "column contracts.default_for does not exist"
   - ✅ Tags con `Token ID: #1` (o el número que corresponda) en lugar de "Pending"
   - ✅ Status: `ON-CHAIN` en lugar de `OFF-CHAIN`

---

## 🔍 Si Aún Hay Problemas

### Problema: Variables de entorno no se aplican
- **Solución:** Haz un **Redeploy manual** en Vercel:
  1. Ve a **Deployments**
  2. Haz clic en los 3 puntos del último deployment
  3. Selecciona **Redeploy**

### Problema: Tabla contracts sigue dando error
- **Solución:** Verifica que ejecutaste el SQL completo y que PostgREST recargó:
  ```sql
  NOTIFY pgrst, 'reload schema';
  ```
  Espera 30 segundos y prueba de nuevo.

### Problema: Mint sigue fallando
- **Verifica:**
  1. Wallet tiene balance: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
     - Debe tener ≥ 0.001 ETH
  2. Wallet tiene MINTER_ROLE:
     - Ve a: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
     - Función `hasRole`
     - Role: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
     - Account: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
     - Debe retornar `true`

---

## 📋 Checklist Final

Antes de probar el mint, verifica:

- [ ] `SERVER_WALLET_PRIVATE_KEY` agregada en Vercel
- [ ] `NEXT_PUBLIC_ALCHEMY_BASE_RPC` agregada en Vercel
- [ ] SQL de `contracts` ejecutado en Supabase
- [ ] Tabla `contracts` tiene 1 fila con RanchLinkTag
- [ ] Deployment de Vercel completado (espera 1-2 min)
- [ ] `/api/diagnose-mint` muestra `can_mint: true`
- [ ] Wallet tiene balance suficiente (≥ 0.001 ETH)
- [ ] Wallet tiene `MINTER_ROLE` en el contrato

---

## 🚀 Una Vez Completado

Después de hacer estos 3 pasos, el mint debería funcionar completamente. Los tags generados deberían tener:
- ✅ `Token ID: #1` (o el número que corresponda)
- ✅ Status: `ON-CHAIN`
- ✅ Basescan link funcionando
- ✅ Listos para imprimir

