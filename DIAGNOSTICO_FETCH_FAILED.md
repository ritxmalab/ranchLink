# 🔍 DIAGNÓSTICO: TypeError: fetch failed

## 🚨 PROBLEMA

El frontend no puede conectarse al endpoint `/api/factory/batches` en producción.

**Error:** `TypeError: fetch failed`

---

## 🔍 POSIBLES CAUSAS

### 1. Endpoint No Desplegado
- El build de Next.js 14 puede no haber incluido el endpoint
- Verificar que el archivo existe: `apps/web/app/api/factory/batches/route.ts`

### 2. Variables de Entorno Faltantes en Vercel
- `SERVER_WALLET_PRIVATE_KEY` - CRÍTICO
- `SERVER_WALLET_ADDRESS` - CRÍTICO
- `RANCHLINKTAG_ADDRESS` - CRÍTICO
- `NEXT_PUBLIC_CONTRACT_TAG` - CRÍTICO
- `NEXT_PUBLIC_ALCHEMY_BASE_RPC` - CRÍTICO
- `SUPABASE_SERVICE_KEY` - CRÍTICO

### 3. Build Fallido en Vercel
- El build puede haber fallado silenciosamente
- Verificar logs de Vercel

### 4. Timeout del Servidor
- El endpoint puede estar crasheando antes de responder
- Verificar logs de Vercel

---

## ✅ VERIFICACIONES INMEDIATAS

### 1. Verificar Endpoint Directamente

**Abrir en navegador:**
```
https://ranch-link.vercel.app/api/health
```

**Debería retornar:**
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 2. Verificar Diagnóstico de Mint

**Abrir en navegador:**
```
https://ranch-link.vercel.app/api/diagnose-mint
```

**Debería mostrar:**
- Variables de entorno configuradas
- Wallet balance
- MINTER_ROLE status
- RPC connection

### 3. Verificar Factory Endpoint (POST)

**Usar curl o Postman:**
```bash
curl -X POST https://ranch-link.vercel.app/api/factory/batches \
  -H "Content-Type: application/json" \
  -d '{
    "batchName": "Test Batch",
    "batchSize": 1,
    "model": "BASIC_QR",
    "material": "PETG",
    "color": "Mesquite"
  }'
```

**Si retorna error, ver el mensaje completo.**

---

## 🔧 SOLUCIONES

### Solución 1: Verificar Variables en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona proyecto: `ranch-link`
3. Settings → Environment Variables
4. Verifica que TODAS estas estén configuradas:
   - ✅ `SERVER_WALLET_PRIVATE_KEY`
   - ✅ `SERVER_WALLET_ADDRESS`
   - ✅ `RANCHLINKTAG_ADDRESS`
   - ✅ `NEXT_PUBLIC_CONTRACT_TAG`
   - ✅ `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
   - ✅ `SUPABASE_SERVICE_KEY`
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Solución 2: Forzar Redeploy

1. Ve a: https://vercel.com/dashboard
2. Selecciona proyecto: `ranch-link`
3. Deployments → Latest deployment
4. Click "Redeploy"

### Solución 3: Verificar Logs de Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona proyecto: `ranch-link`
3. Deployments → Latest deployment → Logs
4. Buscar errores relacionados con:
   - `/api/factory/batches`
   - `SERVER_WALLET_PRIVATE_KEY`
   - `RANCHLINKTAG_ADDRESS`
   - `fetch failed`

---

## 📋 CHECKLIST DE DIAGNÓSTICO

- [ ] Endpoint `/api/health` responde
- [ ] Endpoint `/api/diagnose-mint` responde
- [ ] Variables de entorno configuradas en Vercel
- [ ] Build exitoso en Vercel
- [ ] Deployment activo
- [ ] Logs de Vercel sin errores críticos

---

## 🚨 SI EL PROBLEMA PERSISTE

**Verificar:**
1. ¿El endpoint existe en el código? ✅ (Sí, `apps/web/app/api/factory/batches/route.ts`)
2. ¿El build fue exitoso? (Verificar en Vercel)
3. ¿Las variables de entorno están configuradas? (Verificar en Vercel)
4. ¿Hay errores en los logs de Vercel? (Revisar logs)

**Si todo está bien pero sigue fallando:**
- Puede ser un problema de timeout
- El endpoint puede estar crasheando por falta de variables
- Verificar logs de Vercel para el error exacto

---

**El error mejorado ahora mostrará más detalles sobre qué está fallando.** 🔍


