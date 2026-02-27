# 📋 RESPUESTA: Wallets, Vercel, y Flujo de Batch Creation

## 🔐 ESTADO DE WALLETS

### ✅ Wallets Nuevas Creadas

**Sí, las wallets nuevas ya fueron creadas:**

- **Address:** `0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4`
- **Private Key:** `0xabf8f0095eedcbde8117311cf7f541414a13bb96ff0f5784dcfa9c2d6fbc51c7`

**Referencias en documentos:**
- `SOLUCION_INMEDIATA_NUEVA_WALLET.md`
- `ADMISION_ERRORES_Y_SOLUCION.md`
- `OTORGAR_MINTER_ROLE_AUTOMATICO.md`

### ⚠️ ESTADO EN VERCEL

**NO, aún NO están configuradas en Vercel.**

**Acción requerida:**
1. Ve a: Vercel Dashboard → Settings → Environment Variables
2. Actualiza estas variables:
   - `SERVER_WALLET_ADDRESS` = `0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4`
   - `SERVER_WALLET_PRIVATE_KEY` = `0xabf8f0095eedcbde8117311cf7f541414a13bb96ff0f5784dcfa9c2d6fbc51c7`
3. **Redeploy** después de actualizar las variables

**Verificación:**
- Puedes usar `/api/diagnose-mint` después del redeploy para verificar que las variables están configuradas

---

## 🔄 FLUJO DE BATCH CREATION Y CLAIM

### Flujo Actual (v1.0)

```
1. Super Admin crea Batch
   ↓
2. POST /api/factory/batches
   ↓
3. Para cada tag en el batch:
   a. Crea tag en DB (status: 'minting')
   b. ⚡ MINTA NFT INMEDIATAMENTE (línea 287-292)
      - NFT se mintea al server wallet
      - Token ID se guarda en DB
      - Status cambia a 'on_chain_unclaimed'
   c. Pin metadata a IPFS (opcional, no bloquea)
   ↓
4. Batch completo con NFTs minted
   ↓
5. Tags están listos para imprimir/enviar
   ↓
6. Usuario recibe tag físico
   ↓
7. Usuario escanea QR → /t/RL-001
   ↓
8. Usuario llena formulario (attach tag)
   ↓
9. POST /api/attach-tag
   - ✅ Verifica que tag tiene token_id (on-chain)
   - ✅ Crea/actualiza animal en DB
   - ✅ Vincula tag con animal
   - ✅ Actualiza metadata en IPFS y on-chain (setCID)
   - ❌ NO hace segundo mint (el NFT ya existe)
   ↓
10. Tag está "claimed/attached" con animal
```

### ⚠️ IMPORTANTE: NO HAY SEGUNDO MINT

**El mint se hace UNA SOLA VEZ durante la creación del batch.**

**Evidencia en código:**
- `apps/web/app/api/factory/batches/route.ts` línea 287-292: `mintTagUnified()` se llama durante batch creation
- `apps/web/app/api/attach-tag/route.ts` línea 78-92: Verifica que `token_id` existe, NO hace mint
- `apps/web/app/api/attach-tag/route.ts` línea 234-237: Solo actualiza metadata (`setCID`), no mintea nuevo NFT

**Cuando el usuario "claim" el tag:**
- Solo está "attachando" el tag a un animal
- El NFT ya existe desde el batch creation
- Se actualiza el tokenURI con metadata completa del animal

---

## 🚫 ¿QUÉ ESTÁ BLOQUEADO ACTUALMENTE?

### Problema Principal: MINT NO FUNCIONA

**El mint durante batch creation está bloqueado por:**

1. ❌ **Falta `SERVER_WALLET_PRIVATE_KEY` en Vercel**
   - La variable existe en documentos pero no está en Vercel
   - Sin esto, no se puede crear wallet client para minting

2. ❌ **Falta `RANCHLINKTAG_ADDRESS` configurado**
   - El contrato puede estar deployado, pero falta la dirección en variables de entorno
   - O el contrato no está deployado aún

3. ❌ **Falta MINTER_ROLE otorgado**
   - El server wallet necesita tener MINTER_ROLE en el contrato
   - Sin esto, el mint fallará con "Only minter role can mint"

4. ⚠️ **Wallet puede no tener fondos**
   - La nueva wallet necesita ETH para pagar gas
   - Mínimo recomendado: 0.001 ETH en Base Mainnet

### Errores Esperados

**Si intentas crear un batch ahora, verás:**
```
Error: Missing SERVER_WALLET_PRIVATE_KEY environment variable
```
o
```
Error: Missing contract address (RANCHLINKTAG_ADDRESS or NEXT_PUBLIC_CONTRACT_TAG)
```
o
```
Error: Server wallet does NOT have MINTER_ROLE on contract
```

---

## ✅ PASOS PARA RESOLVER

### Paso 1: Configurar Variables en Vercel

1. Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Agrega/Actualiza:
   ```
   SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4
   SERVER_WALLET_PRIVATE_KEY=0xabf8f0095eedcbde8117311cf7f541414a13bb96ff0f5784dcfa9c2d6fbc51c7
   RANCHLINKTAG_ADDRESS=0x... (dirección del contrato deployado)
   NEXT_PUBLIC_CONTRACT_TAG=0x... (misma dirección)
   ```
3. Guarda y haz **Redeploy**

### Paso 2: Verificar Contrato Deployado

**Si el contrato NO está deployado:**
- Deploy usando `deploy-ranchlinktag.ts`
- Copia la dirección del output
- Agrega a Vercel como `RANCHLINKTAG_ADDRESS`

**Si el contrato YA está deployado:**
- Verifica la dirección en Basescan o en tus notas
- Agrega a Vercel

### Paso 3: Otorgar MINTER_ROLE

**Ejecutar script:**
```bash
cd packages/contracts
export PRIVATE_KEY=<private_key_de_wallet_con_ADMIN_ROLE>
export RANCHLINKTAG_ADDRESS=<dirección_del_contrato>
export SERVER_WALLET_ADDRESS=0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4
npx hardhat run scripts/grant-minter.ts --network base
```

### Paso 4: Fundear Wallet

**Enviar ETH a:**
- Address: `0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4`
- Network: Base Mainnet
- Cantidad: 0.001 ETH mínimo (recomendado: 0.01 ETH)

### Paso 5: Verificar

**Ejecutar diagnóstico:**
```
GET https://ranch-link.vercel.app/api/diagnose-mint
```

**Debe mostrar:**
- ✅ `SERVER_WALLET_PRIVATE_KEY` existe
- ✅ `RANCHLINKTAG_ADDRESS` existe
- ✅ Wallet balance suficiente
- ✅ MINTER_ROLE otorgado
- ✅ RPC connection funciona
- ✅ `can_mint: true`

---

## 📊 RESUMEN

### Preguntas Respondidas

1. **¿Ya creaste las wallets nuevas?**
   - ✅ SÍ, fueron creadas anteriormente
   - Address: `0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4`
   - Private Key: `0xabf8f0095eedcbde8117311cf7f541414a13bb96ff0f5784dcfa9c2d6fbc51c7`

2. **¿Aún es necesario actualizarlas en Vercel?**
   - ✅ SÍ, **aún NO están en Vercel**
   - Necesitas agregarlas manualmente en Vercel Dashboard
   - Luego hacer redeploy

3. **¿El mint va primero o después del claim?**
   - ✅ **MINT VA PRIMERO** durante batch creation
   - El NFT se mintea inmediatamente cuando se crea el batch
   - El usuario solo "attach" el tag al animal (no hay segundo mint)

4. **¿Hay algo bloqueado que no permite este flujo?**
   - ✅ SÍ, **múltiples problemas bloquean el mint:**
     - Variables de entorno faltantes en Vercel
     - MINTER_ROLE no otorgado
     - Posible falta de fondos en wallet
     - Posible contrato no deployado

### Acciones Inmediatas

1. **Configurar variables en Vercel** (5 min)
2. **Verificar/Deploy contrato** (15 min si no está deployado)
3. **Otorgar MINTER_ROLE** (5 min)
4. **Fundear wallet** (5 min)
5. **Verificar con diagnose-mint** (2 min)

**Total: ~30 minutos para tener sistema funcionando**

---

## 🔍 DIAGNÓSTICO RÁPIDO

**Para verificar qué falta exactamente, ejecuta:**

```bash
curl https://ranch-link.vercel.app/api/diagnose-mint
```

Este endpoint te dirá exactamente qué está faltando y qué está funcionando.

---

**Una vez resueltos estos problemas, el flujo completo funcionará:**
1. Batch creation → Mint NFTs ✅
2. User scan QR → Attach tag to animal ✅
3. Metadata update on-chain ✅



