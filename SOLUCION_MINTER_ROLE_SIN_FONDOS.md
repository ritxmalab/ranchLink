# 🚨 SOLUCIÓN: Otorgar MINTER_ROLE Sin Fondos

## 🔍 PROBLEMA

La wallet vieja `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83` NO tiene fondos (balance 0), por lo que NO puede otorgar MINTER_ROLE.

**Error:**
```
insufficient funds for gas * price + value: balance 0, tx cost 244304314556
```

---

## ✅ SOLUCIÓN: Fondear Wallet Vieja Temporalmente

### PASO 1: Fondear Wallet Vieja

**Envía ETH a la wallet vieja:**
- Address: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- Network: Base Mainnet
- Cantidad: **0.0001 ETH** (suficiente para 1 transacción)

**⚠️ IMPORTANTE:** Esta wallet drena fondos automáticamente (paymaster), así que:
- Envía solo lo necesario (0.0001 ETH)
- Ejecuta el script INMEDIATAMENTE después de fondear
- El paymaster puede barrer los fondos en el mismo bloque

---

### PASO 2: Ejecutar Script para Otorgar MINTER_ROLE

**Opción A: Si fondaste la wallet vieja**

```bash
cd packages/contracts

export PRIVATE_KEY=<REDACTED_PRIVATE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>
export RANCHLINKTAG_ADDRESS=0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4
export ALCHEMY_BASE_RPC=<tu_rpc_url>

npx hardhat run scripts/grant-minter-upgradeable.ts --network base
```

**Resultado esperado:**
```
✅ MINTER_ROLE granted successfully!
Server wallet can now mint tags.
```

---

### PASO 3: Verificar que Funciona

**1. Verificar MINTER_ROLE:**
```
GET https://ranch-link.vercel.app/api/diagnose-mint
```

Busca:
```json
{
  "checks": {
    "minter_role": {
      "has_role": true,  // <-- Debe ser true
      "server_wallet": "0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4"
    }
  }
}
```

**2. Probar mint:**
- Ve a: https://ranch-link.vercel.app/superadmin
- Tab **Factory**
- Genera 1 tag de prueba
- Debe mostrar `Token ID: #X` (no "Pending")
- Status debe ser `ON-CHAIN` (verde)

---

## 🔄 ALTERNATIVA: Usar Otra Wallet con ADMIN_ROLE

Si tienes otra wallet con ADMIN_ROLE, puedes usarla en lugar de la wallet vieja:

```bash
cd packages/contracts

export PRIVATE_KEY=<private_key_de_wallet_con_admin_role>
export RANCHLINKTAG_ADDRESS=0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4
export ALCHEMY_BASE_RPC=<tu_rpc_url>

npx hardhat run scripts/grant-minter-upgradeable.ts --network base
```

---

## 📋 CHECKLIST

- [ ] Fondear wallet vieja (0.0001 ETH en Base Mainnet)
- [ ] Ejecutar script para otorgar MINTER_ROLE
- [ ] Verificar MINTER_ROLE (usar `/api/diagnose-mint`)
- [ ] Verificar wallet balance (nueva wallet: 0.00119423 ETH ✅)
- [ ] Probar mint (generar 1 tag)
- [ ] Verificar que token_id se asigna
- [ ] Verificar que status es ON-CHAIN

---

## ⚠️ ADVERTENCIA

**La wallet vieja drena fondos automáticamente**, así que:
- Envía solo lo necesario (0.0001 ETH)
- Ejecuta el script INMEDIATAMENTE después de fondear
- El paymaster puede barrer los fondos en el mismo bloque

**Después de otorgar MINTER_ROLE, NO uses la wallet vieja para nada más.**

---

**El problema es que la wallet vieja no tiene fondos. Fondearla temporalmente debería resolver el problema.** 🚀


