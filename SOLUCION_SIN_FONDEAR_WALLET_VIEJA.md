# 🚀 SOLUCIÓN: Otorgar MINTER_ROLE Sin Fondear Wallet Vieja

## 🔍 PROBLEMA

La wallet vieja `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83` drena fondos automáticamente (paymaster de Coinbase CDP), así que NO podemos fondearla.

---

## ✅ SOLUCIÓN: Verificar Quién Tiene ADMIN_ROLE

El contrato `RanchLinkTagUpgradeable` fue desplegado con UUPS proxy. Necesitamos verificar:

1. **¿Quién tiene ADMIN_ROLE?**
   - El deployer original (wallet vieja)
   - ¿Hay otros admins?

2. **¿Podemos usar otra wallet?**

---

## 🔧 OPCIÓN 1: Verificar en Basescan

**Verificar quién tiene ADMIN_ROLE:**
1. Ve a: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
2. Busca función: `hasRole`
3. Parámetros:
   - `role`: `0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775` (ADMIN_ROLE)
   - `account`: `<cualquier_wallet_address>`
4. Verifica si hay otras wallets con ADMIN_ROLE

---

## 🔧 OPCIÓN 2: Fondear y Ejecutar MUY Rápido

**Si solo la wallet vieja tiene ADMIN_ROLE:**

1. **Preparar el comando ANTES de fondear:**
   ```bash
   cd packages/contracts
   export PRIVATE_KEY=0xe1ec3ccd3262937d9530d016279f9c9915c4b89dd98ab6b2954eda6296c6fc72
   export RANCHLINKTAG_ADDRESS=0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
   export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4
   export ALCHEMY_BASE_RPC=<tu_rpc_url>
   ```

2. **Fondear wallet vieja:**
   - Address: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
   - Network: Base Mainnet
   - Cantidad: **0.0002 ETH** (un poco más para seguridad)

3. **EJECUTAR INMEDIATAMENTE (en la misma terminal):**
   ```bash
   npx hardhat run scripts/grant-minter-upgradeable.ts --network base
   ```

4. **El script debe ejecutarse ANTES de que el paymaster barra los fondos**

---

## 🔧 OPCIÓN 3: Usar Otra Wallet (Si Tiene ADMIN_ROLE)

**Si tienes otra wallet con ADMIN_ROLE:**

```bash
cd packages/contracts

export PRIVATE_KEY=<private_key_de_otra_wallet_con_admin_role>
export RANCHLINKTAG_ADDRESS=0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4
export ALCHEMY_BASE_RPC=<tu_rpc_url>

npx hardhat run scripts/grant-minter-upgradeable.ts --network base
```

---

## 🔧 OPCIÓN 4: Verificar Si Hay DEFAULT_ADMIN_ROLE

El contrato puede tener `DEFAULT_ADMIN_ROLE` además de `ADMIN_ROLE`. Verifica:

1. Ve a: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
2. Busca función: `hasRole`
3. Parámetros:
   - `role`: `0x0000000000000000000000000000000000000000000000000000000000000000` (DEFAULT_ADMIN_ROLE)
   - `account`: `<wallet_address>`

---

## ❌ OPCIÓN 5: Fork/Redeploy (NO RECOMENDADO)

**NO es necesario hacer fork o redeploy del contrato** porque:
- El contrato ya está desplegado y funcionando
- Solo necesitamos otorgar MINTER_ROLE
- Un redeploy sería costoso y perderíamos el NFT #1 ya minted

---

## 📋 CHECKLIST

- [ ] Verificar quién tiene ADMIN_ROLE en Basescan
- [ ] Si solo la wallet vieja: Fondear y ejecutar MUY rápido
- [ ] Si hay otra wallet: Usar esa wallet
- [ ] Verificar MINTER_ROLE otorgado (usar `/api/diagnose-mint`)
- [ ] Probar mint (generar 1 tag)

---

## ⚠️ IMPORTANTE

**El contrato NO puede cambiarse desde el código** - los roles están en el smart contract en Base Mainnet. Solo podemos:
- Otorgar roles usando una wallet con ADMIN_ROLE
- O hacer upgrade del contrato (UUPS proxy permite esto, pero requiere ADMIN_ROLE también)

**La mejor opción es verificar quién tiene ADMIN_ROLE y usar esa wallet para otorgar MINTER_ROLE.**

---

**¿Quieres que verifique en Basescan quién tiene ADMIN_ROLE, o prefieres intentar fondear y ejecutar rápido?** 🚀


