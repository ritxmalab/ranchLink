# 🔗 Base vs Ethereum Mainnet - Explicación

## ⚠️ IMPORTANTE: Son Redes Diferentes

**Ethereum Mainnet** y **Base Mainnet** son redes **separadas**:
- Misma dirección de wallet (compatible EVM)
- Pero el ETH en una red NO está disponible en la otra
- Necesitas hacer "bridge" (puente) para mover ETH entre redes

---

## 🔍 Cómo Verificar Dónde Está tu ETH

### 1. Verificar en Ethereum Mainnet:
https://etherscan.io/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

### 2. Verificar en Base Mainnet:
https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

**Si tienes ETH en Ethereum pero no en Base, necesitas hacer bridge.**

---

## 🌉 Cómo Hacer Bridge de Ethereum → Base

### Opción 1: Base Bridge Oficial (Recomendado)

1. Ve a: https://bridge.base.org/
2. Conecta tu wallet (MetaMask, Coinbase Wallet, etc.)
3. **Asegúrate de estar en Ethereum Mainnet** (red origen)
4. Selecciona cantidad de ETH a enviar (ej: 0.001 ETH)
5. Haz clic en "Bridge"
6. Confirma la transacción en tu wallet
7. Espera ~2 minutos para que se complete
8. El ETH aparecerá en Base Mainnet automáticamente

### Opción 2: Coinbase Exchange (Más Rápido)

Si tienes Coinbase Exchange:

1. Ve a Coinbase Exchange
2. Selecciona "Send" o "Enviar"
3. Selecciona "ETH"
4. Pega la dirección: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
5. **IMPORTANTE:** Selecciona red **"Base"** (no Ethereum)
6. Envía directamente a Base Mainnet
7. Confirma

### Opción 3: Desde tu Wallet en Base

Si ya tienes ETH en Base en otro wallet:

1. Abre tu wallet en Base Mainnet
2. Envía directamente a: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
3. Asegúrate de estar en **Base Mainnet** (no Ethereum)

---

## ✅ Verificar Después de Enviar

### En Base Mainnet:
https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

**Deberías ver:**
- Balance en ETH (no solo $0.03)
- Transacciones recientes

### En la App:
`https://ranch-link.vercel.app/api/diagnose-mint`

**Deberías ver:**
```json
{
  "checks": {
    "wallet": {
      "balance_eth": "0.001...",
      "sufficient": true
    }
  }
}
```

---

## 🚨 Errores Comunes

### ❌ Error: "Insufficient balance" después de enviar
**Causa:** Enviaste a Ethereum Mainnet en lugar de Base Mainnet  
**Solución:** Haz bridge desde Ethereum a Base usando Base Bridge

### ❌ Error: "Transaction failed"
**Causa:** No estás en la red correcta  
**Solución:** Asegúrate de estar en Base Mainnet (Chain ID: 8453)

---

## 📋 Checklist

- [ ] Verificar balance en Ethereum: https://etherscan.io/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
- [ ] Verificar balance en Base: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
- [ ] Si tienes ETH en Ethereum pero no en Base → Usar Base Bridge
- [ ] Si tienes ETH en Base → Enviar directamente al wallet del servidor
- [ ] Verificar que el balance en Base sea ≥ 0.001 ETH
- [ ] Probar mint de nuevo

---

## 💡 Resumen

**Para RanchLink, necesitas ETH en BASE MAINNET, no en Ethereum Mainnet.**

Si ya enviaste ETH pero está en Ethereum Mainnet, necesitas hacer bridge a Base usando https://bridge.base.org/


