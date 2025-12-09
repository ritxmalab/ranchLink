# ⚠️ Solución: Balance Insuficiente en Wallet del Servidor

## 🔴 Problema Identificado

**Error:** "Insufficient balance: 0.000010497043314101 ETH (need at least 0.001 ETH for gas)"

**Balance actual:** `0.000010497043314101 ETH`  
**Balance necesario:** `0.001 ETH` (mínimo)  
**Recomendado:** `0.01 ETH` (para múltiples mints)

---

## ✅ Solución: Enviar ETH al Wallet del Servidor

### Wallet del Servidor:
```
0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
```

### Pasos para Enviar ETH:

#### Opción 1: Desde tu Wallet Personal (MetaMask, Coinbase Wallet, etc.)

1. **Abre tu wallet** (MetaMask, Coinbase Wallet, etc.)
2. **Asegúrate de estar en Base Mainnet:**
   - Network: Base
   - Chain ID: 8453
3. **Haz clic en "Send" o "Enviar"**
4. **Pega la dirección del wallet del servidor:**
   ```
   0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
   ```
5. **Cantidad a enviar:**
   - **Mínimo:** `0.001 ETH` (para 1-2 mints)
   - **Recomendado:** `0.01 ETH` (para ~10-20 mints)
   - **Seguro:** `0.1 ETH` (para muchos mints)
6. **Revisa y confirma** la transacción
7. **Espera la confirmación** (Base confirma en ~2 segundos)

#### Opción 2: Desde Coinbase Exchange

1. Ve a Coinbase Exchange
2. Selecciona "Send" o "Enviar"
3. Selecciona "ETH" como moneda
4. Pega la dirección: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
5. Selecciona red: **Base** (no Ethereum Mainnet)
6. Envía `0.01 ETH` o más
7. Confirma

#### Opción 3: Bridge desde Ethereum Mainnet

Si tienes ETH en Ethereum Mainnet:

1. Usa el Base Bridge: https://bridge.base.org/
2. Conecta tu wallet
3. Selecciona "ETH" y cantidad
4. Envía a Base Mainnet
5. Luego envía desde tu wallet en Base al wallet del servidor

---

## 🔍 Verificar Balance Después de Enviar

### En Basescan:
https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

### En la App:
1. Ve a: `https://ranch-link.vercel.app/api/diagnose-mint`
2. Busca en la respuesta:
   ```json
   {
     "checks": {
       "wallet": {
         "balance_eth": "0.01...",
         "sufficient": true
       }
     }
   }
   ```

---

## 💰 Cantidades Recomendadas

| Cantidad | Uso | Duración Estimada |
|----------|-----|-------------------|
| `0.001 ETH` | Mínimo para 1-2 mints | ~$3 USD |
| `0.01 ETH` | Recomendado para ~10-20 mints | ~$30 USD |
| `0.1 ETH` | Seguro para muchos mints | ~$300 USD |

**Nota:** El gas en Base es muy barato (~$0.01-0.05 por mint), así que `0.01 ETH` debería durar mucho tiempo.

---

## ✅ Después de Enviar ETH

1. **Espera 10-30 segundos** para que la transacción se confirme
2. **Verifica el balance** en Basescan o `/api/diagnose-mint`
3. **Prueba el mint de nuevo:**
   - Ve a `/superadmin` → Inventory
   - Haz clic en "Retry Mint" para RL-003
   - Debería funcionar ahora

---

## 🚨 Si Aún Falla Después de Enviar ETH

1. **Verifica que enviaste a Base Mainnet** (no Ethereum Mainnet)
2. **Verifica la dirección** es correcta: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
3. **Espera 1-2 minutos** y verifica el balance de nuevo
4. **Revisa la transacción** en Basescan para confirmar que llegó

---

## 📋 Checklist

- [ ] Enviar ETH al wallet: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- [ ] Verificar que estás en **Base Mainnet** (no Ethereum)
- [ ] Enviar al menos `0.001 ETH` (recomendado `0.01 ETH`)
- [ ] Verificar balance en Basescan
- [ ] Probar mint de nuevo

---

**Una vez que tengas suficiente balance, el mint debería funcionar perfectamente.** 🚀

