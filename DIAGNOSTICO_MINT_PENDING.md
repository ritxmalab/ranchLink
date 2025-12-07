# 🔍 Diagnóstico: Token ID "Pending"

## 🎯 Situación Actual

El tag **RL-001** se generó correctamente pero el **Token ID está "Pending"**, lo que indica que el mint no se completó.

---

## 🔍 Posibles Causas

### 1. **Error en el proceso de mint** (más probable)
El código tiene un `try-catch` que captura errores de mint pero continúa:
```typescript
try {
  const mintResult = await mintTagUnified({...})
  tokenId = mintResult.tokenId
  mintTxHash = mintResult.txHash
  // Update tag with token_id
} catch (mintError: any) {
  console.error(`Failed to mint tag ${tagCode}:`, mintError)
  // Continue - tag exists in DB, minting can be retried later
}
```

**Si el mint falla, el error se registra en los logs del servidor pero el tag se guarda sin `token_id`.**

### 2. **Problemas comunes de mint:**
- ❌ **Falta de ETH en server wallet** - No hay suficiente gas
- ❌ **RPC endpoint incorrecto** - `ALCHEMY_BASE_RPC` no está configurado
- ❌ **Contract address incorrecto** - `RANCHLINKTAG_ADDRESS` no está configurado
- ❌ **MINTER_ROLE no concedido** - El server wallet no tiene permisos
- ❌ **Network mismatch** - Está intentando mint en testnet pero el contract está en mainnet

---

## 🔧 Cómo Diagnosticar

### Paso 1: Revisar logs del servidor

En Vercel:
1. Ve a **Deployments** → Último deployment
2. Click en **Functions** → `/api/factory/batches`
3. Revisa los logs para ver el error exacto

Deberías ver algo como:
```
Failed to mint tag RL-001: [error message]
```

### Paso 2: Verificar variables de entorno

Asegúrate de que en Vercel estén configuradas:
- ✅ `RANCHLINKTAG_ADDRESS` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- ✅ `SERVER_WALLET_PRIVATE_KEY` = (tu private key)
- ✅ `SERVER_WALLET_ADDRESS` = `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- ✅ `ALCHEMY_BASE_RPC` = (tu Alchemy endpoint)
- ✅ `NEXT_PUBLIC_CONTRACT_TAG` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`

### Paso 3: Verificar balance del server wallet

El server wallet necesita ETH para pagar gas. Verifica en Basescan:
- https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

Si el balance es 0 o muy bajo, necesitas enviar ETH.

---

## 🔧 Solución: Reintentar Mint

Si el mint falló, puedes reintentarlo. El código está diseñado para esto - el tag existe en la DB pero sin `token_id`.

**Opciones:**

### Opción A: Reintentar desde la UI (si implementamos botón)
Podríamos agregar un botón "Retry Mint" en el Inventory tab.

### Opción B: Script manual de reintento
Podríamos crear un script que:
1. Busque tags con `mint_tx_hash IS NULL` o `token_id IS NULL`
2. Reintente el mint para esos tags
3. Actualice `token_id` cuando tenga éxito

---

## 📝 Próximos Pasos

1. **Revisa los logs de Vercel** para ver el error exacto
2. **Verifica variables de entorno** en Vercel
3. **Verifica balance del server wallet** en Basescan
4. **Comparte el error** que veas en los logs y lo solucionamos

---

**El tag está guardado correctamente. Solo necesitamos que el mint se complete para obtener el `token_id`.** ✅

