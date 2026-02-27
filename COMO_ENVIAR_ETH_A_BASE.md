# 🌉 Cómo Enviar ETH a Base Mainnet

## ⚠️ Aclaración Importante

**Base NO es un token que compras.** Base es una red (Layer 2) que usa **ETH como moneda nativa**.

Lo que necesitas es hacer **bridge** (puente) de ETH desde Ethereum Mainnet → Base Mainnet.

---

## 🔄 Opción 1: Base Bridge Oficial (Recomendado)

### Desde Coinbase Wallet o MetaMask:

1. **Ve a:** https://bridge.base.org/
2. **Conecta tu wallet** (Coinbase Wallet, MetaMask, etc.)
3. **Asegúrate de estar en Ethereum Mainnet:**
   - En tu wallet, selecciona "Ethereum Mainnet"
   - Deberías ver tu balance de ETH
4. **En Base Bridge:**
   - **From:** Ethereum Mainnet
   - **To:** Base
   - **Amount:** 0.001 ETH (o más)
5. **Haz clic en "Bridge"**
6. **Confirma en tu wallet**
7. **Espera ~2 minutos**
8. **El ETH aparecerá en Base Mainnet automáticamente**

### Después del Bridge:

1. **Cambia tu wallet a Base Mainnet:**
   - En Coinbase Wallet: Selecciona "Base" en la lista de redes
   - En MetaMask: Agrega Base si no lo tienes (Chain ID: 8453)
2. **Verifica tu balance** - deberías ver el ETH que bridgaste
3. **Envía al wallet del servidor:**
   - Dirección: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
   - Asegúrate de estar en **Base Mainnet**
   - Envía 0.001 ETH o más

---

## 🔄 Opción 2: Coinbase Exchange (Más Rápido)

Si tienes Coinbase Exchange:

1. **Ve a Coinbase Exchange**
2. **Selecciona "Send" o "Enviar"**
3. **Selecciona "ETH"**
4. **Pega la dirección:** `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
5. **IMPORTANTE:** Selecciona red **"Base"** (no Ethereum)
6. **Cantidad:** 0.001 ETH o más
7. **Confirma y envía**
8. **El ETH llegará directamente a Base Mainnet** (sin necesidad de bridge)

---

## 🔄 Opción 3: Coinbase Wallet - Bridge Integrado

Si usas Coinbase Wallet:

1. **Abre Coinbase Wallet**
2. **Asegúrate de tener ETH en Ethereum Mainnet**
3. **Busca la opción "Bridge" o "Send to Base"** en el menú
4. Si no la encuentras, usa Base Bridge (Opción 1)

---

## 🔄 Opción 4: Orbiter Finance (Alternativa)

Si Base Bridge no funciona:

1. **Ve a:** https://www.orbiter.finance/
2. **Conecta tu wallet**
3. **From:** Ethereum
4. **To:** Base
5. **Amount:** 0.001 ETH
6. **Bridge**

---

## ✅ Verificar Después de Enviar

### 1. Verifica en Basescan:
https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

**Deberías ver:**
- Balance ≥ 0.001 ETH
- Transacciones recientes

### 2. Verifica en la App:
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

## 🚨 Problemas Comunes

### "No veo opción de bridge en Coinbase Wallet"
**Solución:** Usa Base Bridge directamente: https://bridge.base.org/

### "No puedo cambiar a Base Mainnet en mi wallet"
**Solución:** 
- **Coinbase Wallet:** Debería tener Base en la lista de redes
- **MetaMask:** Agrega Base manualmente:
  - Network Name: Base
  - RPC URL: https://mainnet.base.org
  - Chain ID: 8453
  - Currency Symbol: ETH

### "El bridge está tomando mucho tiempo"
**Normal:** Base Bridge puede tomar 1-2 minutos. Si pasa de 5 minutos, verifica la transacción en Etherscan.

---

## 💡 Resumen Rápido

1. **Tienes ETH en Ethereum Mainnet** ✅
2. **Necesitas ETH en Base Mainnet** ⚠️
3. **Solución:** Usa Base Bridge (https://bridge.base.org/) para mover ETH de Ethereum → Base
4. **Después:** Envía ETH desde tu wallet en Base al wallet del servidor
5. **Dirección del servidor:** `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`

---

**No necesitas "comprar BASE" - solo necesitas hacer bridge de ETH a Base Mainnet.** 🚀


