# 🚀 Instrucciones de Deployment - RanchLinkTag

## ✅ Verificación Pre-Deployment

El contrato `RanchLinkTag.sol` ha sido verificado y cumple 100% con todos los requisitos:

- ✅ Mint function con MINTER_ROLE y duplicate protection
- ✅ Bidirectional mappings (tokenId ↔ publicIdHash)
- ✅ TagMinted event para tracing
- ✅ Soulbound-until-transfer behavior

Ver detalles en: `RANCHLINKTAG_VERIFICATION.md`

---

## 📋 Paso 1: Configurar Variables de Entorno

Crea o actualiza `.env` en `packages/contracts/`:

```bash
# Wallet para deploy (debe tener ETH en Base Sepolia/Base)
PRIVATE_KEY=0x...

# RPC URLs (Alchemy)
ALCHEMY_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# Después del deploy, agregar:
RANCHLINKTAG_ADDRESS=0x...
SERVER_WALLET_ADDRESS=0x...
```

---

## 📋 Paso 2: Deploy a Base Sepolia (Testnet)

### 2.1 Instalar dependencias (si no están instaladas)

```bash
cd packages/contracts
npm install
```

### 2.2 Deploy del contrato

```bash
npx hardhat run scripts/deploy-ranchlinktag.ts --network baseSepolia
```

**Salida esperada:**
```
==========================================
Deploying RanchLinkTag Contract
==========================================
Deployer address: 0x...
Deployer balance: 0.1 ETH
...
✅ RanchLinkTag deployed successfully!
Contract address: 0x...
Network: baseSepolia
Chain ID: 84532
...
```

### 2.3 Guardar la dirección del contrato

Copia la dirección del contrato y guárdala. La necesitarás para:
- Variables de entorno en Vercel
- Script de grant-minter
- Configuración del backend

---

## 📋 Paso 3: Otorgar MINTER_ROLE al Server Wallet

### 3.1 Preparar Server Wallet

El server wallet es la wallet que usará el backend para mintear tags. Debe:
- Tener fondos en Base Sepolia (para gas)
- Su dirección debe estar en `SERVER_WALLET_ADDRESS`

### 3.2 Ejecutar script de grant

```bash
RANCHLINKTAG_ADDRESS=0x... \
SERVER_WALLET_ADDRESS=0x... \
npx hardhat run scripts/grant-minter.ts --network baseSepolia
```

**Salida esperada:**
```
==========================================
Granting MINTER_ROLE
==========================================
Contract address: 0x...
Server wallet: 0x...
...
✅ MINTER_ROLE granted successfully!
```

---

## 📋 Paso 4: Configurar Variables en Vercel

Agrega estas variables en Vercel (Settings → Environment Variables):

### Variables Backend (Server-side):
```
RANCHLINKTAG_ADDRESS=0x...                    # Dirección del contrato desplegado
SERVER_WALLET_PRIVATE_KEY=0x...              # Private key del server wallet
SERVER_WALLET_ADDRESS=0x...                  # Address del server wallet
```

### Variables Frontend (Client-side):
```
NEXT_PUBLIC_CONTRACT_TAG=0x...               # Misma dirección (para Basescan links)
NEXT_PUBLIC_CHAIN_ID=84532                   # Base Sepolia (8453 para mainnet)
NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC=https://...
```

### Variables existentes (verificar que estén):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
NEXT_PUBLIC_ALCHEMY_BASE_RPC=...
```

---

## 📋 Paso 5: Verificar Integración

### 5.1 Verificar wrapper TypeScript

El wrapper ya está configurado correctamente:
- ✅ Usa `mintTo(to, hashPublicId(public_id), cid)`
- ✅ Llama `getTokenId(publicIdHash)` después del mint
- ✅ Retorna `tokenId` y `txHash`

**Archivo:** `apps/web/lib/blockchain/ranchLinkTag.ts`

### 5.2 Verificar endpoint factory

El endpoint `/api/factory/batches`:
- ✅ Crea tags en Supabase
- ✅ Llama `mintTag()` del wrapper
- ✅ Actualiza `tags.token_id` y `tags.mint_tx_hash`
- ✅ Retorna `token_id` en la respuesta

**Archivo:** `apps/web/app/api/factory/batches/route.ts`

### 5.3 Verificar dashboard

El dashboard muestra:
- ✅ `token_id` en vista de animales
- ✅ `token_id` en vista de inventario
- ✅ Indicadores ON-CHAIN ✅ / OFF-CHAIN ⚪
- ✅ Links a Basescan

**Archivo:** `apps/web/app/dashboard/page.tsx`

### 5.4 Verificar stickers

Los stickers en `/superadmin` muestran:
- ✅ QR code apuntando a `/t/[tag_code]`
- ✅ Tag ID (tag_code)
- ✅ Animal ID (public_id)
- ✅ Token ID (cuando está disponible)

**Archivo:** `apps/web/app/superadmin/page.tsx`

---

## 📋 Paso 6: Deploy a Base Mainnet (Producción)

Una vez probado en testnet:

### 6.1 Deploy a mainnet

```bash
npx hardhat run scripts/deploy-ranchlinktag.ts --network base
```

### 6.2 Grant MINTER_ROLE en mainnet

```bash
RANCHLINKTAG_ADDRESS=0x... \
SERVER_WALLET_ADDRESS=0x... \
npx hardhat run scripts/grant-minter.ts --network base
```

### 6.3 Actualizar variables en Vercel

- Cambiar `RANCHLINKTAG_ADDRESS` a la dirección de mainnet
- Cambiar `NEXT_PUBLIC_CHAIN_ID` a `8453` (Base mainnet)
- Usar `NEXT_PUBLIC_ALCHEMY_BASE_RPC` (no Sepolia)

---

## 🧪 Testing Post-Deployment

### Test 1: Mint un tag de prueba

1. Ir a `/superadmin`
2. Generar un batch pequeño (1-5 tags)
3. Verificar que:
   - Tags se crean en Supabase
   - NFTs se mintean en blockchain
   - `token_id` aparece en la respuesta
   - `token_id` aparece en el sticker

### Test 2: Verificar en Basescan

1. Copiar `token_id` de un tag mintado
2. Ir a: `https://sepolia.basescan.org/token/{CONTRACT_ADDRESS}?a={token_id}`
3. Verificar que el NFT existe y tiene metadata

### Test 3: Verificar dashboard

1. Ir a `/dashboard`
2. Verificar que:
   - Stats muestran tags on-chain
   - Vista de animales muestra `token_id`
   - Vista de inventario muestra on-chain status
   - Links a Basescan funcionan

---

## ⚠️ Troubleshooting

### Error: "Missing RANCHLINKTAG_ADDRESS"
- Verificar que la variable esté en Vercel
- Verificar que esté en `turbo.json` env array

### Error: "Failed to get token ID after minting"
- Verificar que el mint fue exitoso (check tx hash en Basescan)
- Verificar que `getTokenId()` esté en el ABI del wrapper
- Esperar unos segundos después del mint antes de llamar `getTokenId()`

### Error: "Not authorized" al mintear
- Verificar que `SERVER_WALLET_ADDRESS` tenga `MINTER_ROLE`
- Ejecutar script `grant-minter.ts` nuevamente

### Tags no aparecen en dashboard
- Verificar que `/api/dashboard/animals` y `/api/dashboard/tags` estén funcionando
- Verificar que las queries de Supabase estén correctas
- Verificar autenticación (si está implementada)

---

## 📝 Checklist Final

Antes de considerar el deployment completo:

- [ ] Contrato desplegado en Base Sepolia
- [ ] MINTER_ROLE otorgado a server wallet
- [ ] Variables configuradas en Vercel
- [ ] Test de mint exitoso
- [ ] `token_id` aparece en stickers
- [ ] Dashboard muestra on-chain status
- [ ] Links a Basescan funcionan
- [ ] Documentación actualizada

---

## 🎯 Próximos Pasos

1. **Testing exhaustivo en testnet**
2. **Deploy a mainnet cuando esté listo**
3. **Monitorear primeros mints en producción**
4. **Implementar retry logic para mints fallidos**
5. **Agregar analytics de on-chain coverage**

---

**¿Listo para deploy?** Ejecuta el script de deploy cuando estés listo:
```bash
npx hardhat run scripts/deploy-ranchlinktag.ts --network baseSepolia
```

