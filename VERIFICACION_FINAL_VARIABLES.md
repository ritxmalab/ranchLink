# ✅ Verificación Final - Variables en Vercel

## ✅ Variables Críticas Configuradas

Veo que tienes todas las variables necesarias:

1. ✅ `NEXT_PUBLIC_ALCHEMY_BASE_RPC` - **Added just now** (recién agregada)
2. ✅ `SERVER_WALLET_PRIVATE_KEY` - **Added 5m ago** (agregada hace 5 minutos)
3. ✅ `SERVER_WALLET_ADDRESS` - **Added 2d ago** (ya estaba)
4. ✅ `NEXT_PUBLIC_CONTRACT_TAG` - **Added 2d ago** (ya estaba)
5. ✅ `RANCHLINKTAG_ADDRESS` - **Added 2d ago** (ya estaba)

---

## 🔍 Verificación Rápida

### 1. Verificar que `NEXT_PUBLIC_ALCHEMY_BASE_RPC` tiene el valor correcto

Haz clic en el ícono del ojo 👁️ junto a `NEXT_PUBLIC_ALCHEMY_BASE_RPC` y verifica que el valor sea:

```
https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqIW4JtlK5
```

**⚠️ IMPORTANTE:** Debe ser `base-mainnet`, NO `eth-mainnet`.

### 2. Verificar que `SERVER_WALLET_PRIVATE_KEY` es correcta

Haz clic en el ícono del ojo 👁️ junto a `SERVER_WALLET_PRIVATE_KEY` y verifica que:
- Empiece con `0x`
- Tenga 66 caracteres en total
- Sea la misma que está en tu `.env.local` local

**Valor esperado:** `0xe1ec3ccd3262937d9530d016279f9c9915c4b89dd98ab6b2954eda6296c6fc72`

### 3. Verificar que `SERVER_WALLET_ADDRESS` es correcta

**Valor esperado:** `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`

### 4. Verificar que las direcciones del contrato son correctas

**`NEXT_PUBLIC_CONTRACT_TAG` y `RANCHLINKTAG_ADDRESS` deben ser:**
```
0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
```

---

## 📋 Próximos Pasos

### PASO 1: Esperar Redeploy (1-2 minutos)

Después de agregar las variables, Vercel debería hacer un redeploy automático. Espera 1-2 minutos.

### PASO 2: Ejecutar SQL en Supabase

Ve a: https://supabase.com/dashboard → Tu proyecto → **SQL Editor**

Copia y pega este SQL:

```sql
-- ============================================================================
-- Create contracts table for v1.0 contract registry
-- ============================================================================

DROP TABLE IF EXISTS public.contracts CASCADE;

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

CREATE INDEX idx_contracts_address ON public.contracts(contract_address);
CREATE INDEX idx_contracts_default_for ON public.contracts USING GIN(default_for);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

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

NOTIFY pgrst, 'reload schema';
```

Haz clic en **"Run"** y espera 30 segundos.

### PASO 3: Verificar que Todo Funciona

1. **Endpoint de diagnóstico:**
   - Ve a: `https://ranch-link.vercel.app/api/diagnose-mint`
   - Debe mostrar `can_mint: true` y `errors: 0`

2. **Probar mint real:**
   - Ve a: `https://ranch-link.vercel.app/superadmin`
   - Tab **Factory**
   - Genera 1 tag de prueba
   - Debe mostrar `Token ID: #1` (o el número que corresponda)
   - Status debe ser `ON-CHAIN` (verde)

---

## 🎯 Checklist Final

- [x] Variables agregadas en Vercel
- [ ] Verificar valores de variables (usar ícono del ojo 👁️)
- [ ] Ejecutar SQL en Supabase
- [ ] Verificar `/api/diagnose-mint` muestra `can_mint: true`
- [ ] Probar mint real (generar 1 tag)

---

## 🚀 Una Vez Completado

El sistema debería estar 100% funcional:
- ✅ Generar tags
- ✅ Mint automático en Base Mainnet
- ✅ Token IDs asignados
- ✅ Tags listos para imprimir

