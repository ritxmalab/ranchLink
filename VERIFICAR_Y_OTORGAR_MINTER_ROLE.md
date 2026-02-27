# 🔍 VERIFICAR Y OTORGAR MINTER_ROLE

## 🎯 PROBLEMA

Los tags se crean en la DB pero el minting NO está pasando. Esto significa que la nueva wallet probablemente NO tiene MINTER_ROLE.

---

## ✅ SOLUCIÓN: Otorgar MINTER_ROLE

### PASO 1: Verificar si tiene MINTER_ROLE

**Opción A: Usar endpoint de diagnóstico**
```
GET https://ranch-link.vercel.app/api/diagnose-mint
```

Busca en la respuesta:
```json
{
  "checks": {
    "minter_role": {
      "has_role": false,  // <-- Si es false, no tiene el rol
      "server_wallet": "0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4",
      "contract": "0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242"
    }
  }
}
```

**Opción B: Verificar en Basescan**
1. Ve a: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
2. Busca función: `hasRole`
3. Parámetros:
   - `role`: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6` (MINTER_ROLE)
   - `account`: `0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4`
4. Debe retornar: `true`

---

### PASO 2: Otorgar MINTER_ROLE

**La wallet vieja tiene ADMIN_ROLE (fue el deployer). Úsala para otorgar MINTER_ROLE:**

```bash
cd packages/contracts

# Configura la wallet vieja como PRIVATE_KEY (tiene ADMIN_ROLE)
export PRIVATE_KEY=<private_key_de_wallet_vieja>
export RANCHLINKTAG_ADDRESS=0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4

# Ejecuta el script
npx hardhat run scripts/grant-minter-upgradeable.ts --network base
```

**Resultado esperado:**
```
✅ MINTER_ROLE granted successfully!
Server wallet can now mint tags.
```

---

### PASO 3: Verificar que Funciona

1. **Verificar MINTER_ROLE:**
   ```
   GET https://ranch-link.vercel.app/api/diagnose-mint
   ```
   Debe mostrar: `"has_role": true`

2. **Probar mint:**
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

- [ ] Verificar MINTER_ROLE (usar `/api/diagnose-mint`)
- [ ] Si NO tiene rol: Otorgar MINTER_ROLE (usar script)
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


