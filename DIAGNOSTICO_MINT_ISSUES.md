# 🔍 Diagnóstico: Problemas de Mint en Producción

## Problema Actual

Los tags se están generando pero muestran:
- **Token ID: Pending**
- **On-Chain: OFF-CHAIN**
- **Status: In Inventory** o **Attached**

Esto indica que el mint **NO se está completando** correctamente.

---

## ✅ Cambios Implementados

### 1. Mint es ahora MANDATORY y Blocking

- **Antes**: Tags se creaban en DB y el mint era opcional/async
- **Ahora**: Tags NO son "reales" hasta que tengan `token_id` y `contract_address`

### 2. Pre-flight Checks

Antes de intentar mint, el sistema verifica:
- ✅ `SERVER_WALLET_PRIVATE_KEY` está configurado
- ✅ `RANCHLINKTAG_ADDRESS` está configurado
- ✅ `NEXT_PUBLIC_ALCHEMY_BASE_RPC` o `ALCHEMY_BASE_RPC` está configurado
- ✅ Server wallet tiene suficiente ETH (> 0.001 ETH)

### 3. Logging Detallado

Cada paso del proceso ahora loggea:
```
[FACTORY] Starting batch creation...
[FACTORY] Pre-flight checks...
[FACTORY] Pre-flight checks passed: [...]
[FACTORY] Creating batch in database...
[FACTORY] Batch created: {batch_id}
[FACTORY] Processing tag 1/3: RL-001
[FACTORY] Tag RL-001 created in DB, now minting on-chain...
[FACTORY] Calling mintTagUnified for RL-001...
[FACTORY] ✅ Mint successful for RL-001: token_id=1, tx=0x...
[FACTORY] Tag RL-001 updated in DB with token_id=1
```

O si falla:
```
[FACTORY] ❌ Failed to mint tag RL-001: Error message
[FACTORY] Error details: { message, stack, name }
```

### 4. Estados de Tag Actualizados

- **`minting`**: Tag creado en DB, mint en progreso
- **`on_chain_unclaimed`**: Mint exitoso, listo para claim
- **`mint_failed`**: Mint falló, NO se puede usar

### 5. Batch Status

- **`minting`**: Batch creado, mints en progreso
- **`ready_for_sale`**: Todos los tags minted exitosamente
- **`mint_failed`**: Al menos un tag falló

---

## 🔧 Cómo Diagnosticar el Problema

### Paso 1: Verificar Variables de Entorno en Vercel

Ve a Vercel → Settings → Environment Variables y verifica:

```
✅ SERVER_WALLET_PRIVATE_KEY = 0x...
✅ SERVER_WALLET_ADDRESS = 0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
✅ RANCHLINKTAG_ADDRESS = 0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
✅ NEXT_PUBLIC_CONTRACT_TAG = 0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
✅ NEXT_PUBLIC_ALCHEMY_BASE_RPC = https://base-mainnet.g.alchemy.com/v2/...
✅ ALCHEMY_BASE_RPC = https://base-mainnet.g.alchemy.com/v2/...
```

### Paso 2: Verificar Balance del Server Wallet

Abre: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

**¿Tiene ETH?** (necesita > 0.001 ETH para gas)

### Paso 3: Verificar MINTER_ROLE

El server wallet debe tener `MINTER_ROLE` en el contrato.

Verifica en Basescan:
- Contract: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
- Busca la función `hasRole(MINTER_ROLE, 0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83)`

### Paso 4: Revisar Logs de Vercel

1. Ve a Vercel → Deployments → Último deployment
2. Click en **Functions** → `/api/factory/batches`
3. Busca los logs que empiezan con `[FACTORY]`
4. Identifica dónde falla:
   - ¿Pre-flight checks fallan?
   - ¿El mint falla con un error específico?
   - ¿La actualización de DB falla?

### Paso 5: Probar con un Batch Pequeño

1. Ve a `/superadmin` → Tab Factory
2. Configura:
   - Batch Size: **1** (para probar)
   - Material: PETG
   - Model: BASIC_QR
   - Color: Test
   - Batch Name: Test Mint
3. Click **"Generate & Mint Tags"**
4. Revisa:
   - ¿Qué mensaje aparece?
   - ¿Aparece en Inventory con Token ID?
   - ¿Los logs en Vercel muestran el mint exitoso?

---

## 🚨 Errores Comunes y Soluciones

### Error: "Pre-flight checks failed"

**Causa**: Variables de entorno faltantes o incorrectas

**Solución**:
1. Verifica todas las variables en Vercel
2. Asegúrate de que `SERVER_WALLET_PRIVATE_KEY` empiece con `0x`
3. Asegúrate de que `RANCHLINKTAG_ADDRESS` sea el proxy address correcto

### Error: "Insufficient balance"

**Causa**: Server wallet no tiene suficiente ETH

**Solución**:
1. Envía ETH al server wallet: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
2. Necesitas al menos 0.001 ETH por tag (más para batches grandes)

### Error: "Missing MINTER_ROLE"

**Causa**: Server wallet no tiene permisos para mint

**Solución**:
1. Ejecuta el script `grant-minter` para dar `MINTER_ROLE` al server wallet
2. Verifica en Basescan que el role fue concedido

### Error: "RPC connection failed"

**Causa**: RPC endpoint incorrecto o no disponible

**Solución**:
1. Verifica que `NEXT_PUBLIC_ALCHEMY_BASE_RPC` apunta a Base Mainnet
2. Prueba el endpoint manualmente
3. Considera usar un RPC alternativo si Alchemy falla

### Error: "Failed to get token ID after minting"

**Causa**: La transacción se completó pero `getTokenId()` no encuentra el token

**Solución**:
1. Verifica que el contrato tiene la función `getTokenId(publicIdHash)`
2. Verifica que el `publicIdHash` es correcto
3. Revisa la transacción en Basescan para ver si el mint realmente ocurrió

---

## 📊 Qué Esperar Después del Fix

### Si el Mint Funciona Correctamente:

1. **Factory UI**:
   - Mensaje: "✅ Successfully created batch with X tags. All tags are on-chain and ready for sale."
   - Tags aparecen en Inventory con **Token ID** (no "Pending")
   - Status: **"ON-CHAIN • Unclaimed"** (verde)

2. **Database**:
   - `tags.token_id` tiene un valor (ej: "1", "2", "3")
   - `tags.contract_address` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
   - `tags.mint_tx_hash` tiene un hash de transacción
   - `tags.status` = `'on_chain_unclaimed'`

3. **Basescan**:
   - Puedes ver la transacción de mint
   - Puedes ver el NFT en el contrato
   - Token ID coincide con el de la DB

### Si el Mint Falla:

1. **Factory UI**:
   - Mensaje: "⚠️ Created batch with X tags. Y minted successfully, Z failed to mint."
   - Warnings claros sobre qué hacer

2. **Database**:
   - Tags fallidos tienen `tags.status` = `'mint_failed'`
   - `tags.token_id` = NULL
   - `tags.mint_tx_hash` = NULL

3. **Logs**:
   - Error detallado en logs de Vercel
   - Indica exactamente qué falló

---

## 🎯 Próximos Pasos

1. **Desplegar el fix** (ya hecho - commit `ce33b06`)
2. **Verificar variables de entorno** en Vercel
3. **Probar con batch de 1 tag** y revisar logs
4. **Si funciona**: Probar con batch más grande
5. **Si falla**: Revisar logs específicos y corregir el problema identificado

---

## 📝 Notas Importantes

- **Ningún tag debe imprimirse** si tiene `token_id = NULL`
- **Ningún tag debe venderse** si tiene `status = 'mint_failed'`
- **El mint es ahora MANDATORY** - no hay tags "off-chain" válidos en v1.0
- **Los tags existentes con `token_id = NULL`** necesitan retry mint antes de usar

---

**Última actualización**: Después de commit `ce33b06` (mint mandatory con logging detallado)

