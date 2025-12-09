# 🔧 Vercel Environment Variables Setup

## ❌ Problema Identificado

El endpoint `/api/diagnose-mint` confirmó que faltan estas variables en Vercel:

1. `SERVER_WALLET_PRIVATE_KEY` - **CRÍTICO** (firma transacciones)
2. `NEXT_PUBLIC_ALCHEMY_BASE_RPC` o `ALCHEMY_BASE_RPC` - **CRÍTICO** (conexión a Base)

## ✅ Variables que DEBES Agregar en Vercel

### Paso 1: Ir a Vercel Dashboard
1. Ve a: https://vercel.com/dashboard
2. Selecciona el proyecto: **ranch-link**
3. Ve a: **Settings** → **Environment Variables**

### Paso 2: Agregar Variables

#### Variable 1: `SERVER_WALLET_PRIVATE_KEY`
- **Name:** `SERVER_WALLET_PRIVATE_KEY`
- **Value:** (la clave privada del wallet del servidor - está en tu `.env.local` local)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- **⚠️ IMPORTANTE:** Esta es una clave privada - NO la compartas públicamente

#### Variable 2: `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
- **Name:** `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
- **Value:** (tu URL de Alchemy para Base Mainnet)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- **Formato:** `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

#### Variable 3: `ALCHEMY_BASE_RPC` (alternativa/backup)
- **Name:** `ALCHEMY_BASE_RPC`
- **Value:** (mismo valor que `NEXT_PUBLIC_ALCHEMY_BASE_RPC`)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

### Paso 3: Verificar Variables Existentes

Asegúrate de que estas variables YA están configuradas (deberían estar):

- ✅ `RANCHLINKTAG_ADDRESS` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- ✅ `NEXT_PUBLIC_CONTRACT_TAG` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- ✅ `SERVER_WALLET_ADDRESS` = `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- ✅ `NEXT_PUBLIC_CHAIN_ID` = `8453` (Base Mainnet)

### Paso 4: Después de Agregar Variables

1. **Redeploy:** Vercel debería detectar los cambios automáticamente, pero si no:
   - Ve a **Deployments**
   - Haz clic en los 3 puntos del último deployment
   - Selecciona **Redeploy**

2. **Verificar:**
   - Espera 1-2 minutos para que el deployment termine
   - Ve a: `https://ranch-link.vercel.app/api/diagnose-mint`
   - Deberías ver:
     - ✅ `SERVER_WALLET_PRIVATE_KEY: exists: true`
     - ✅ `NEXT_PUBLIC_ALCHEMY_BASE_RPC: exists: true`
     - ✅ `can_mint: true`

3. **Probar Mint:**
   - Ve a `/superadmin` → Factory tab
   - Genera un batch pequeño (1-3 tags)
   - Deberías ver `Token ID: #1` (o el número que corresponda) en lugar de "Pending"

## 🔍 Cómo Obtener los Valores

### `SERVER_WALLET_PRIVATE_KEY`
Este valor está en tu `.env.local` local. Si no lo tienes:
- El wallet del servidor es: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- Necesitas la clave privada que corresponde a esa dirección
- **⚠️ NO compartas esta clave públicamente**

### `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
1. Ve a: https://dashboard.alchemy.com/
2. Selecciona tu app de Base Mainnet
3. Ve a **API Keys**
4. Copia la **HTTPS** URL (formato: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`)

Si no tienes una cuenta de Alchemy:
- Opción 1: Crear cuenta gratuita en Alchemy (tier gratuito incluye suficientes requests)
- Opción 2: Usar RPC público (menos confiable): `https://mainnet.base.org`

## 📋 Checklist Final

Antes de probar el mint, verifica:

- [ ] `SERVER_WALLET_PRIVATE_KEY` agregada en Vercel
- [ ] `NEXT_PUBLIC_ALCHEMY_BASE_RPC` agregada en Vercel
- [ ] `RANCHLINKTAG_ADDRESS` configurada
- [ ] `SERVER_WALLET_ADDRESS` configurada
- [ ] Deployment completado sin errores
- [ ] `/api/diagnose-mint` muestra `can_mint: true`
- [ ] Wallet tiene balance suficiente (≥ 0.001 ETH)
- [ ] Wallet tiene `MINTER_ROLE` en el contrato

## 🚨 Si Aún Falla Después de Esto

1. Verifica que el wallet tiene balance:
   - Ve a: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
   - Debe tener al menos 0.001 ETH

2. Verifica que el wallet tiene MINTER_ROLE:
   - Ve a: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
   - Busca la función `hasRole`
   - Role: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
   - Account: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
   - Debe retornar `true`

3. Revisa el endpoint de diagnóstico:
   - `https://ranch-link.vercel.app/api/diagnose-mint`
   - Todos los checks deben pasar

---

**Una vez que agregues estas variables, el mint debería funcionar inmediatamente.** 🚀

