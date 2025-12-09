# ✅ Checklist Final - Todo Listo para Producción

## 🔑 Wallet del Servidor (Actual)

**Dirección:** `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`

**Estado:**
- ✅ Balance verificado en Basescan
- ✅ MINTER_ROLE concedido al contrato
- ⚠️ **PRIVATE_KEY debe estar en Vercel como `SERVER_WALLET_PRIVATE_KEY`**

---

## 📋 PASO 1: Verificar Variables en Vercel

Ve a: https://vercel.com/dashboard → **ranch-link** → **Settings** → **Environment Variables**

### Variables que DEBEN existir:

1. ✅ `SERVER_WALLET_ADDRESS` = `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
2. ⚠️ `SERVER_WALLET_PRIVATE_KEY` = `0x...` (la clave privada del wallet)
3. ⚠️ `NEXT_PUBLIC_ALCHEMY_BASE_RPC` = `https://base-mainnet.g.alchemy.com/v2/...` o `https://mainnet.base.org`
4. ✅ `RANCHLINKTAG_ADDRESS` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
5. ✅ `NEXT_PUBLIC_CONTRACT_TAG` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
6. ✅ `NEXT_PUBLIC_CHAIN_ID` = `8453`

**Si falta `SERVER_WALLET_PRIVATE_KEY`:**
- Está en tu `.env.local` local
- O necesitamos generarla de nuevo (si se perdió)

**Si falta `NEXT_PUBLIC_ALCHEMY_BASE_RPC`:**
- Opción 1: Crear cuenta en Alchemy (gratis)
- Opción 2: Usar RPC público: `https://mainnet.base.org`

---

## 📋 PASO 2: Crear Tabla `contracts` en Supabase

### SQL Completo (copia y pega en Supabase SQL Editor):

```sql
-- ============================================================================
-- Create contracts table for v1.0 contract registry
-- ============================================================================

-- Drop old table if exists (backup first if you have data)
DROP TABLE IF EXISTS public.contracts CASCADE;

-- Create new contracts table with correct schema
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

-- Create indexes
CREATE INDEX idx_contracts_address ON public.contracts(contract_address);
CREATE INDEX idx_contracts_default_for ON public.contracts USING GIN(default_for);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Insert RanchLinkTag contract
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

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
```

**Pasos:**
1. Ve a: https://supabase.com/dashboard → Tu proyecto → **SQL Editor**
2. Borra todo en el editor
3. Pega el SQL completo de arriba
4. Haz clic en **"Run"**
5. Espera 30 segundos

---

## 📋 PASO 3: Verificar Todo Funciona

### 3.1 Endpoint de Diagnóstico
Ve a: `https://ranch-link.vercel.app/api/diagnose-mint`

**Deberías ver:**
```json
{
  "summary": {
    "can_mint": true,
    "errors": 0
  },
  "checks": {
    "env": {
      "SERVER_WALLET_PRIVATE_KEY": { "exists": true },
      "NEXT_PUBLIC_ALCHEMY_BASE_RPC": { "exists": true }
    },
    "wallet": {
      "balance_eth": "0.001...",
      "sufficient": true
    },
    "minter_role": {
      "has_role": true
    },
    "contract_registry": {
      "found": true
    }
  }
}
```

### 3.2 Probar Mint Real
1. Ve a: `https://ranch-link.vercel.app/superadmin`
2. Tab **Factory**
3. Configura:
   - Batch Size: `1` (para probar)
   - Material: `PETG`
   - Model: `BASIC_QR`
   - Blockchain: `BASE`
   - Color: `Mesquite`
   - Batch Name: `Test Mint`
   - Batch Date: Hoy
4. Haz clic en **"Generate & Mint Tags"**
5. **Deberías ver:**
   - ✅ No errores
   - ✅ Tag con `Token ID: #1` (o el número que corresponda)
   - ✅ Status: `ON-CHAIN` (verde)
   - ✅ Basescan link funcionando

---

## 🔧 Si Algo Falla

### Error: "Missing SERVER_WALLET_PRIVATE_KEY"
- **Solución:** Agregar en Vercel → Settings → Environment Variables
- **Valor:** Está en tu `.env.local` local

### Error: "column contracts.default_for does not exist"
- **Solución:** Ejecutar el SQL del PASO 2 en Supabase
- **Verificar:** Esperar 30 segundos después de ejecutar

### Error: "Insufficient balance"
- **Solución:** Enviar ETH al wallet: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- **Mínimo:** 0.001 ETH

### Error: "Server wallet does NOT have MINTER_ROLE"
- **Solución:** Ejecutar script de grant-minter
- **Comando:** `cd packages/contracts && npm run grant-minter`

---

## ✅ Checklist Final

- [ ] `SERVER_WALLET_PRIVATE_KEY` en Vercel
- [ ] `NEXT_PUBLIC_ALCHEMY_BASE_RPC` en Vercel
- [ ] Tabla `contracts` creada en Supabase
- [ ] Contrato RanchLinkTag insertado en `contracts`
- [ ] `/api/diagnose-mint` muestra `can_mint: true`
- [ ] Wallet tiene balance ≥ 0.001 ETH
- [ ] Wallet tiene MINTER_ROLE
- [ ] Test mint exitoso (1 tag generado y mintado)

---

## 🚀 Una Vez Todo Esté Listo

El sistema debería funcionar completamente:
- ✅ Generar tags
- ✅ Mint automático en Base Mainnet
- ✅ Token IDs asignados
- ✅ Tags listos para imprimir
- ✅ QR codes funcionando
- ✅ Dashboard mostrando tags on-chain

