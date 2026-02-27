# 🚀 OTORGAR MINTER_ROLE AUTOMÁTICAMENTE

## 🎯 PROBLEMA

La nueva wallet `0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4` NO tiene MINTER_ROLE, por eso el minting no funciona.

---

## ✅ SOLUCIÓN: Script Automático

### PASO 1: Verificar Wallet Vieja Tiene ADMIN_ROLE

La wallet vieja `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83` fue el deployer, así que tiene `ADMIN_ROLE`.

**Verificar en Basescan:**
1. Ve a: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
2. Busca función: `hasRole`
3. Parámetros:
   - `role`: `0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775` (ADMIN_ROLE)
   - `account`: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
4. Debe retornar: `true`

---

### PASO 2: Ejecutar Script para Otorgar MINTER_ROLE

**Opción A: Si tienes la private key de la wallet vieja**

```bash
cd packages/contracts

# Configura la wallet vieja como PRIVATE_KEY (tiene ADMIN_ROLE)
export PRIVATE_KEY=<private_key_de_wallet_vieja>
export RANCHLINKTAG_ADDRESS=0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4

# Ejecuta el script
npx hardhat run scripts/grant-minter-upgradeable.ts --network base
```

**Opción B: Si NO tienes la private key de la wallet vieja**

Necesitas usar una wallet que tenga ADMIN_ROLE. Las opciones son:

1. **Usar la wallet vieja** (si tienes acceso)
2. **Usar otra wallet con ADMIN_ROLE** (si hay alguna)
3. **Verificar quién tiene ADMIN_ROLE** en Basescan

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

## 🔍 DIAGNÓSTICO ADICIONAL

Si después de otorgar MINTER_ROLE sigue sin funcionar, verifica:

1. **Wallet Balance:**
   - Debe tener al menos 0.0001 ETH
   - Actual: 0.00119423 ETH ✅ (suficiente)

2. **RPC Connection:**
   - Verifica que `NEXT_PUBLIC_ALCHEMY_BASE_RPC` está configurado en Vercel
   - Debe ser: `https://base-mainnet.g.alchemy.com/v2/...`

3. **Contract Address:**
   - Verifica que `RANCHLINKTAG_ADDRESS` está configurado en Vercel
   - Debe ser: `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`

4. **Server Wallet Address:**
   - Verifica que `SERVER_WALLET_ADDRESS` está configurado en Vercel
   - Debe ser: `0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4`

5. **Server Wallet Private Key:**
   - Verifica que `SERVER_WALLET_PRIVATE_KEY` está configurado en Vercel
   - Debe ser: `0xabf8f0095eedcbde8117311cf7f541414a13bb96ff0f5784dcfa9c2d6fbc51c7`

---

## 📋 CHECKLIST

- [ ] Verificar que wallet vieja tiene ADMIN_ROLE
- [ ] Ejecutar script para otorgar MINTER_ROLE
- [ ] Verificar MINTER_ROLE (usar `/api/diagnose-mint`)
- [ ] Verificar wallet balance (0.00119423 ETH ✅)
- [ ] Verificar RPC connection
- [ ] Verificar contract address
- [ ] Verificar server wallet address
- [ ] Verificar server wallet private key
- [ ] Probar mint (generar 1 tag)
- [ ] Verificar que token_id se asigna
- [ ] Verificar que status es ON-CHAIN

---

**El problema más probable es que la nueva wallet NO tiene MINTER_ROLE. Otorgarlo debería resolver el problema.** 🚀


