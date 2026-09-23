# 🚀 SOLUCIÓN FINAL: Olvidar Wallet Vieja Completamente

## 🎯 OBJETIVO

Otorgar **MINTER_ROLE** y **ADMIN_ROLE** a la nueva wallet en **UNA SOLA EJECUCIÓN**, para poder olvidar completamente la wallet vieja.

---

## ✅ PASOS

### PASO 1: Fondear Wallet Vieja (Temporalmente)

**Envía ETH a la wallet vieja:**
- Address: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- Network: Base Mainnet
- Cantidad: **0.0003 ETH** (un poco más para seguridad - 2 transacciones)

**⚠️ IMPORTANTE:** Esta wallet drena fondos automáticamente, así que:
- Ejecuta el script **INMEDIATAMENTE** después de fondear
- El script otorga AMBOS roles en 2 transacciones rápidas

---

### PASO 2: Ejecutar Script (Otorga MINTER_ROLE + ADMIN_ROLE)

**Prepara el comando ANTES de fondear:**

```bash
cd packages/contracts

export PRIVATE_KEY=<REDACTED_PRIVATE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>
export RANCHLINKTAG_ADDRESS=0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4
export ALCHEMY_BASE_RPC=$(cd ../../apps/web && grep NEXT_PUBLIC_ALCHEMY_BASE_RPC .env.local | cut -d '=' -f2)

# Ejecuta el script (otorga MINTER_ROLE + ADMIN_ROLE)
npx hardhat run scripts/grant-minter-and-admin-to-new-wallet.ts --network base
```

**Resultado esperado:**
```
✅ MINTER_ROLE granted in block: XXXXX
✅ ADMIN_ROLE granted in block: XXXXX
✅ SUCCESS! New wallet can now:
   - Mint tags (MINTER_ROLE)
   - Manage roles (ADMIN_ROLE)
⚠️  You can now forget about the old wallet completely!
```

---

### PASO 3: Verificar que Funciona

**1. Verificar roles:**
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

## 📋 DESPUÉS DE EJECUTAR

**Una vez que la nueva wallet tenga MINTER_ROLE y ADMIN_ROLE:**

1. ✅ **Puedes olvidar completamente la wallet vieja**
2. ✅ **La nueva wallet puede mint tags**
3. ✅ **La nueva wallet puede otorgar roles en el futuro**
4. ✅ **No necesitas fondear la wallet vieja nunca más**

---

## ⚠️ IMPORTANTE

**El script hace 2 transacciones:**
1. Otorga MINTER_ROLE
2. Otorga ADMIN_ROLE

**Por eso necesitas 0.0003 ETH** (un poco más para seguridad).

**Ejecuta el script INMEDIATAMENTE después de fondear** para evitar que el paymaster barra los fondos.

---

## 🎯 RESUMEN

1. Fondear wallet vieja: **0.0003 ETH**
2. Ejecutar script: **grant-minter-and-admin-to-new-wallet.ts**
3. Verificar: **MINTER_ROLE y ADMIN_ROLE otorgados**
4. **Olvidar wallet vieja completamente** ✅

---

**Después de esto, todo funciona con la nueva wallet y puedes olvidar la vieja.** 🚀


