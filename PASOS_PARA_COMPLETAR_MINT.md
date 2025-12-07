# 🚀 Pasos para Completar el Mint

## 🎯 Situación Actual

✅ **Tag RL-001 generado correctamente**  
❌ **Token ID: Pending** (el mint no se completó)

---

## 📋 PASO 1: Revisar Logs de Vercel

### 1.1 Ve a Vercel Dashboard
1. Abre: https://vercel.com
2. Selecciona el proyecto **ranchLink**
3. Click en **Deployments** → Último deployment
4. Click en **Functions** → Busca `/api/factory/batches`

### 1.2 Busca el Error
En los logs, busca líneas que digan:
- `Failed to mint tag RL-001:`
- `Error:`
- Cualquier mensaje en rojo

**Copia el error completo** y compártelo conmigo.

---

## 📋 PASO 2: Verificar Variables de Entorno en Vercel

### 2.1 Ve a Settings → Environment Variables

Asegúrate de que estas variables estén configuradas:

#### ✅ CRÍTICAS para Mint:
- `RANCHLINKTAG_ADDRESS` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- `SERVER_WALLET_PRIVATE_KEY` = (tu private key - debe empezar con `0x`)
- `SERVER_WALLET_ADDRESS` = `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- `ALCHEMY_BASE_RPC` = (tu endpoint de Alchemy para Base Mainnet)

#### ✅ También necesarias:
- `NEXT_PUBLIC_CONTRACT_TAG` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- `NEXT_PUBLIC_ALCHEMY_BASE_RPC` = (mismo endpoint de Alchemy)

### 2.2 Verifica que estén en PRODUCTION
- Asegúrate de que las variables estén marcadas para **Production**
- Si solo están en Development, el mint no funcionará en producción

---

## 📋 PASO 3: Verificar Balance del Server Wallet

### 3.1 Verifica en Basescan
Abre: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

**¿Cuánto ETH tiene el wallet?**
- Si es **0 o muy bajo (< 0.001 ETH)**: Necesitas enviar ETH para gas
- Si tiene suficiente: El problema es otro

### 3.2 Si Necesitas Enviar ETH
1. Envía ETH desde tu wallet personal a: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
2. Recomendado: **0.01-0.05 ETH** para varios mints

---

## 📋 PASO 4: Verificar MINTER_ROLE

### 4.1 Verifica que el Server Wallet tenga MINTER_ROLE
El contract `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242` debe tener concedido `MINTER_ROLE` al server wallet `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`.

**Si no estás seguro**, puedo crear un script para verificarlo.

---

## 📋 PASO 5: Reintentar el Mint

### Opción A: Generar Nuevo Batch (Más Fácil)
1. Ve a `/superadmin` → Tab **Factory**
2. Genera un nuevo batch de 1 tag
3. Si funciona, el `token_id` aparecerá inmediatamente

### Opción B: Reintentar Mint para RL-001 (Si Implementamos)
Podríamos crear un endpoint `/api/retry-mint/[tag_code]` para reintentar el mint de un tag específico.

---

## 🔍 Errores Comunes y Soluciones

### Error: "Missing RANCHLINKTAG_ADDRESS"
**Solución**: Agrega la variable en Vercel

### Error: "Missing SERVER_WALLET_PRIVATE_KEY"
**Solución**: Agrega la variable en Vercel (debe empezar con `0x`)

### Error: "insufficient funds for gas"
**Solución**: Envía ETH al server wallet

### Error: "execution reverted" o "AccessControl"
**Solución**: El server wallet no tiene MINTER_ROLE - necesitamos concederlo

### Error: "network error" o "RPC error"
**Solución**: Verifica que `ALCHEMY_BASE_RPC` esté correcto

---

## ✅ Checklist Rápido

- [ ] Revisé logs de Vercel - ¿Qué error veo?
- [ ] Variables de entorno configuradas en Vercel (Production)
- [ ] Server wallet tiene ETH (> 0.001 ETH)
- [ ] Server wallet tiene MINTER_ROLE (si no estás seguro, puedo verificar)

---

## 🎯 Próximo Paso

**Empieza con el PASO 1** - Revisa los logs de Vercel y comparte el error que veas. Con eso podré darte la solución exacta.

**O si prefieres**, puedo crear un script para verificar todo automáticamente (balance, MINTER_ROLE, variables de entorno).

¿Qué prefieres hacer primero?

