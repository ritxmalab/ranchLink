# 🚀 Nave Lista para Producción - Solución Completa

## 📍 Estado Actual

**Wallet del Servidor:** `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`  
**Contrato:** `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`

---

## ✅ PASO 1: Verificar Variables en Vercel

Ve a: https://vercel.com/dashboard → **ranch-link** → **Settings** → **Environment Variables**

### Variables que DEBEN estar configuradas:

| Variable | Valor Esperado | Estado |
|----------|----------------|--------|
| `SERVER_WALLET_ADDRESS` | `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83` | ✅ Debe existir |
| `SERVER_WALLET_PRIVATE_KEY` | `0x...` (tu clave privada) | ⚠️ **VERIFICAR** |
| `NEXT_PUBLIC_ALCHEMY_BASE_RPC` | `https://base-mainnet.g.alchemy.com/v2/...` o `https://mainnet.base.org` | ⚠️ **VERIFICAR** |
| `RANCHLINKTAG_ADDRESS` | `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242` | ✅ Debe existir |
| `NEXT_PUBLIC_CONTRACT_TAG` | `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242` | ✅ Debe existir |
| `NEXT_PUBLIC_CHAIN_ID` | `8453` | ✅ Debe existir |

### Si falta `SERVER_WALLET_PRIVATE_KEY`:

1. Está en tu `.env.local` local (no puedo leerlo por seguridad)
2. O necesitas generarla de nuevo si se perdió
3. **Formato:** Debe empezar con `0x` y tener 66 caracteres

### Si falta `NEXT_PUBLIC_ALCHEMY_BASE_RPC`:

**Opción 1 (Recomendado):** Crear cuenta en Alchemy
1. Ve a: https://dashboard.alchemy.com/
2. Crea una app para "Base" → "Mainnet"
3. Copia la URL HTTPS (formato: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`)

**Opción 2 (Temporal):** Usar RPC público
- Valor: `https://mainnet.base.org`
- ⚠️ Menos confiable, pero funciona para probar

---

## ✅ PASO 2: Crear Tabla `contracts` en Supabase

### SQL Completo (copia TODO y pégalo en Supabase):

```sql
-- ============================================================================
-- Create contracts table for v1.0 contract registry
-- ============================================================================
-- Esto arregla el error: "column contracts.default_for does not exist"

-- Eliminar tabla antigua si existe (backup primero si tienes datos importantes)
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
```

### Pasos:

1. Ve a: https://supabase.com/dashboard → Tu proyecto → **SQL Editor**
2. **Borra todo** lo que esté en el editor
3. **Pega** el SQL completo de arriba
4. Haz clic en **"Run"** (botón verde)
5. Deberías ver: **"Success. No rows returned"**
6. **Espera 30 segundos** para que PostgREST recargue

---

## ✅ PASO 3: Verificar que Todo Funciona

### 3.1 Endpoint de Diagnóstico

Ve a: `https://ranch-link.vercel.app/api/diagnose-mint`

**Deberías ver en la respuesta JSON:**

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
   - Batch Name: `Test Final`
   - Batch Date: Hoy
4. Haz clic en **"Generate & Mint Tags"**
5. **Deberías ver:**
   - ✅ No errores
   - ✅ Tag con `Token ID: #1` (o el número que corresponda)
   - ✅ Status: `ON-CHAIN` (verde)
   - ✅ Basescan link funcionando
   - ✅ Listo para imprimir

---

## 🔧 Si Algo Falla

### Error: "Missing SERVER_WALLET_PRIVATE_KEY"
**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Agrega `SERVER_WALLET_PRIVATE_KEY`
3. Valor: Está en tu `.env.local` local
4. Haz clic en **"Save"**
5. Espera 1-2 minutos para que Vercel haga redeploy

### Error: "column contracts.default_for does not exist"
**Solución:**
1. Ejecuta el SQL del PASO 2 en Supabase
2. Verifica que aparezca "Success"
3. Espera 30 segundos
4. Prueba de nuevo

### Error: "Insufficient balance"
**Solución:**
1. Verifica balance: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
2. Si es < 0.001 ETH, envía ETH a esa dirección
3. Mínimo necesario: 0.001 ETH

### Error: "Server wallet does NOT have MINTER_ROLE"
**Solución:**
1. Verifica en Basescan: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
2. Función `hasRole`:
   - Role: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
   - Account: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
   - Debe retornar `true`
3. Si retorna `false`, ejecuta el script de grant-minter

---

## 📋 Checklist Final

Antes de probar el mint, verifica:

- [ ] `SERVER_WALLET_PRIVATE_KEY` en Vercel (verificar que existe)
- [ ] `NEXT_PUBLIC_ALCHEMY_BASE_RPC` en Vercel (verificar que existe)
- [ ] Tabla `contracts` creada en Supabase (ejecutar SQL)
- [ ] Contrato RanchLinkTag insertado en `contracts` (verificar en Table Editor)
- [ ] `/api/diagnose-mint` muestra `can_mint: true`
- [ ] Wallet tiene balance ≥ 0.001 ETH
- [ ] Wallet tiene MINTER_ROLE (verificar en Basescan)
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
- ✅ Basescan links funcionando

---

## 📞 Si Necesitas Ayuda

1. **Verificar variables en Vercel:**
   - Ve a: https://vercel.com/dashboard → ranch-link → Settings → Environment Variables
   - Revisa que todas las variables de arriba existan

2. **Verificar tabla en Supabase:**
   - Ve a: https://supabase.com/dashboard → Tu proyecto → Table Editor
   - Busca tabla `contracts`
   - Debe tener 1 fila con RanchLinkTag

3. **Verificar wallet:**
   - Balance: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
   - MINTER_ROLE: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract

4. **Endpoint de diagnóstico:**
   - `https://ranch-link.vercel.app/api/diagnose-mint`
   - Te dirá exactamente qué falta

---

**¡La nave está lista! Solo necesitas verificar estos 3 pasos y debería funcionar perfectamente.** 🚀

