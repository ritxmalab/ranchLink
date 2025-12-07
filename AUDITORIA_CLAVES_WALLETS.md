# 🔐 AUDITORÍA DE CLAVES Y WALLETS - RanchLink

**Fecha:** 2024-12-06  
**Objetivo:** Mapeo completo de todas las direcciones, claves y configuraciones de wallets antes del deployment v1.0

---

## 📋 RESUMEN EJECUTIVO

**Estado actual:**
- ✅ **RPC URLs configuradas** (Alchemy Base Sepolia y Mainnet)
- ✅ **SERVER_WALLET_ADDRESS definida** (v0.9 legacy)
- ❌ **PRIVATE_KEY para deploy MISSING**
- ❌ **SERVER_WALLET_PRIVATE_KEY para minting MISSING**
- ❌ **RANCHLINKTAG_ADDRESS vacío** (contrato no desplegado aún)

**Recomendación:** Crear nueva wallet para v1.0 con PRIVATE_KEY y SERVER_WALLET_PRIVATE_KEY.

---

## 1️⃣ ESCANEO DE ARCHIVOS .env

### Archivos encontrados:
1. `./.env.example` - Template (no contiene valores reales)
2. `./apps/web/.env.local` - **Archivo activo con valores reales**
3. `./apps/web/.env.example` - Template
4. `./apps/web/.env.production.example` - Template producción

---

## 2️⃣ VARIABLES ENCONTRADAS EN `apps/web/.env.local`

### 🔑 **PRIVATE KEYS / SECRETS**

| Variable | Tipo | Valor Abreviado | Estado | Uso |
|----------|------|-----------------|--------|-----|
| `SUPABASE_SERVICE_KEY` | Service Key | `sb_se****MSqU` | ✅ Definida | Backend Supabase (server-side) |
| `CDP_API_KEY_SECRET` | API Secret | `2xrA****ZWg==` | ✅ Definida | Coinbase Developer Platform |
| `CDP_WALLET_SECRET` | Wallet Secret (encriptado) | `MIGH****ElWm` | ✅ Definida | CDP wallet (formato PEM) |
| `PRIVATE_KEY` | **Private Key** | ❌ **NO EXISTE** | ❌ **MISSING** | Hardhat deploy scripts |
| `SERVER_WALLET_PRIVATE_KEY` | **Private Key** | ❌ **NO EXISTE** | ❌ **MISSING** | Backend minting (ranchLinkTag.ts) |

### 📍 **DIRECCIONES PÚBLICAS**

| Variable | Tipo | Valor Abreviado | Estado | Uso |
|----------|------|-----------------|--------|-----|
| `SERVER_WALLET_ADDRESS` | EVM Address | `0xCC8****a2f` | ✅ Definida | v0.9 legacy, scripts deploy |
| `SERVER_SOLANA_ADDRESS` | Solana Address | `4TTb****BQBZ` | ✅ Definida | v0.9 legacy (no usado en v1.0) |
| `NEXT_PUBLIC_CONTRACT_TAG` | Contract Address | **VACÍO** | ❌ Vacío | Frontend (Basescan links) |
| `NEXT_PUBLIC_CONTRACT_REGISTRY` | Contract Address | **VACÍO** | ❌ Vacío | v0.9 legacy (no usado en v1.0) |

### 🌐 **RPC ENDPOINTS**

| Variable | Tipo | Valor | Estado | Uso |
|----------|------|-------|--------|-----|
| `ALCHEMY_BASE_SEPOLIA_RPC` | RPC URL | `https://base-sepolia...` | ✅ Definida | Hardhat testnet |
| `NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC` | RPC URL | `https://base-sepolia...` | ✅ Definida | Frontend testnet |
| `ALCHEMY_BASE_MAINNET_RPC` | RPC URL | `https://base-mainnet...` | ✅ Definida | Hardhat mainnet |
| `NEXT_PUBLIC_ALCHEMY_BASE_RPC` | RPC URL | `https://base-mainnet...` | ✅ Definida | Frontend mainnet |
| `ALCHEMY_ETH_MAINNET_RPC` | RPC URL | `https://eth-mainnet...` | ✅ Definida | v0.9 legacy (no usado en v1.0) |
| `ALCHEMY_SOLANA_MAINNET_RPC` | RPC URL | `https://solana-mainnet...` | ✅ Definida | v0.9 legacy (no usado en v1.0) |
| `ALCHEMY_BITCOIN_MAINNET_RPC` | RPC URL | `https://bitcoin-mainnet...` | ✅ Definida | v0.9 legacy (no usado en v1.0) |

### 🔧 **OTRAS CONFIGURACIONES**

| Variable | Tipo | Valor | Estado | Uso |
|----------|------|-------|--------|-----|
| `CDP_API_KEY` | API Key | `f062****766bb` | ✅ Definida | Coinbase Developer Platform |
| `CDP_API_KEY_ID` | API Key ID | `de5c****bb44` | ✅ Definida | Coinbase Developer Platform |
| `ALCHEMY_APP_ID` | App ID | `u7t0****58vh6` | ✅ Definida | Alchemy (identificación) |
| `ALCHEMY_API_KEY` | API Key | `trKk****tlK5` | ✅ Definida | Alchemy (usado en RPC URLs) |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID | `84532` | ✅ Definida | Base Sepolia (testnet) |

---

## 3️⃣ USO EN EL CÓDIGO

### 📦 **Hardhat (packages/contracts/)**

#### `hardhat.config.ts`
- **Línea 23, 27:** `process.env.PRIVATE_KEY`
  - **Uso:** Cuenta para deploy de contratos
  - **Estado:** ❌ **MISSING** - Necesario para deploy
  - **Versión:** v1.0 (nuevo)

#### `scripts/deploy-ranchlinktag.ts`
- **Línea 19:** `process.env.RANCHLINKTAG_ADDRESS`
  - **Uso:** Dirección del contrato desplegado (para grant-minter)
  - **Estado:** ❌ **MISSING** - Se llenará después del deploy
  - **Versión:** v1.0 (nuevo)

#### `scripts/grant-minter.ts`
- **Línea 19:** `process.env.RANCHLINKTAG_ADDRESS`
- **Línea 20:** `process.env.SERVER_WALLET_ADDRESS`
  - **Uso:** Otorgar MINTER_ROLE al server wallet
  - **Estado:** RANCHLINKTAG_ADDRESS ❌ MISSING, SERVER_WALLET_ADDRESS ✅ Existe
  - **Versión:** v1.0 (nuevo)

### 🌐 **Backend (apps/web/)**

#### `lib/blockchain/ranchLinkTag.ts`
- **Línea 50:** `process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG`
  - **Uso:** Dirección del contrato para minting
  - **Estado:** ❌ **AMBOS VACÍOS**
  - **Versión:** v1.0 (nuevo)

- **Línea 64:** `process.env.SERVER_WALLET_PRIVATE_KEY`
  - **Uso:** Private key para crear wallet client (minting)
  - **Estado:** ❌ **MISSING** - Crítico para v1.0
  - **Versión:** v1.0 (nuevo)

#### `app/api/factory/batches/route.ts`
- **Línea 111:** `process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG`
  - **Uso:** Dirección del contrato en factory endpoint
  - **Estado:** ❌ **AMBOS VACÍOS**
  - **Versión:** v1.0 (nuevo)

#### `lib/blockchain/config.ts`
- **Línea 10, 28:** `process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC` / `NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC`
  - **Uso:** RPC URLs para viem clients
  - **Estado:** ✅ **Definidas**
  - **Versión:** v1.0 (nuevo)

- **Línea 50:** `process.env.NEXT_PUBLIC_CONTRACT_TAG`
  - **Uso:** Contract address en CONTRACTS object
  - **Estado:** ❌ **VACÍO**
  - **Versión:** v1.0 (nuevo)

### 📝 **Legacy (v0.9) - No usado en v1.0**

- `scripts/deploy-rwa.ts` - Usa `SERVER_WALLET_ADDRESS` (legacy)
- `scripts/secure-deploy.ts` - Usa `SERVER_WALLET_ADDRESS` (legacy)
- `NEXT_PUBLIC_CONTRACT_REGISTRY` - Contrato legacy no usado en v1.0
- `SERVER_SOLANA_ADDRESS` - Solana no usado en v1.0
- RPCs de ETH, Solana, Bitcoin - No usados en v1.0

---

## 4️⃣ CLASIFICACIÓN FINAL

### 💼 **WALLETS / DIRECCIONES ACTUALES**

| Variable | Address Abreviado | Dónde se Define | Dónde se Usa | Rol | Estado |
|----------|-------------------|-----------------|--------------|-----|--------|
| `SERVER_WALLET_ADDRESS` | `0xCC8****a2f` | `apps/web/.env.local` | `scripts/grant-minter.ts`, `scripts/deploy-rwa.ts` | v0.9 legacy, scripts deploy | ✅ Existe pero no operativa para v1.0 |
| `SERVER_SOLANA_ADDRESS` | `4TTb****BQBZ` | `apps/web/.env.local` | Ningún archivo v1.0 | v0.9 legacy | ⚠️ No usado en v1.0 |
| `NEXT_PUBLIC_CONTRACT_TAG` | **VACÍO** | `apps/web/.env.local` | `ranchLinkTag.ts`, `factory/batches`, `config.ts` | v1.0 contract address | ❌ **MISSING - Crítico** |
| `RANCHLINKTAG_ADDRESS` | **NO EXISTE** | No definida | `ranchLinkTag.ts`, `factory/batches`, scripts deploy | v1.0 contract address (server-side) | ❌ **MISSING - Crítico** |

### 🔐 **PRIVATE KEYS ESPERADAS**

| Variable | ¿Existe? | ¿Quién la Necesita? | ¿Está MISSING? | Prioridad |
|----------|----------|---------------------|----------------|-----------|
| `PRIVATE_KEY` | ❌ NO | Hardhat deploy scripts | ✅ **SÍ - MISSING** | 🔴 **CRÍTICA** |
| `SERVER_WALLET_PRIVATE_KEY` | ❌ NO | `ranchLinkTag.ts` (minting) | ✅ **SÍ - MISSING** | 🔴 **CRÍTICA** |

**Nota:** `CDP_WALLET_SECRET` existe pero es un formato PEM encriptado para CDP, no una private key EVM estándar.

### 📄 **CONTRATOS**

| Variable | Dónde se Usa | Versión | Estado |
|----------|--------------|---------|--------|
| `RANCHLINKTAG_ADDRESS` | `ranchLinkTag.ts`, `factory/batches`, scripts deploy | v1.0 | ❌ **MISSING - Se llenará después del deploy** |
| `NEXT_PUBLIC_CONTRACT_TAG` | `ranchLinkTag.ts`, `factory/batches`, `config.ts`, frontend | v1.0 | ❌ **VACÍO - Se llenará después del deploy** |
| `NEXT_PUBLIC_CONTRACT_REGISTRY` | `config.ts` | v0.9 legacy | ⚠️ No usado en v1.0 |

---

## 5️⃣ RECOMENDACIÓN FINAL

### 🎯 **CONCLUSIÓN CLARA**

**Actualmente NO hay ninguna PRIVATE_KEY definida para v1.0.** Solo existe:

1. **`SERVER_WALLET_ADDRESS`** (`0xCC8****a2f`) - Dirección legacy de v0.9 que:
   - Está definida pero **NO tiene private key asociada** en el .env
   - Se usa en scripts legacy pero **no es operativa para v1.0**
   - **No se puede usar para minting** porque falta `SERVER_WALLET_PRIVATE_KEY`

2. **`CDP_WALLET_SECRET`** - Existe pero es formato PEM para Coinbase CDP, no una private key EVM estándar

### ✅ **ACCIÓN REQUERIDA**

**Para proceder con el deployment v1.0, necesitas:**

1. **Crear una nueva wallet EVM** (o usar una existente con fondos en Base Sepolia):
   - Exportar la **private key** (formato: `0x...`)
   - Obtener la **address** (formato: `0x...`)

2. **Agregar al `apps/web/.env.local`:**
   ```bash
   # Para Hardhat deploy
   PRIVATE_KEY=0x...  # Private key de la wallet para deploy
   
   # Para backend minting (puede ser la misma wallet o diferente)
   SERVER_WALLET_PRIVATE_KEY=0x...  # Private key para minting
   SERVER_WALLET_ADDRESS=0x...     # Address (actualizar si es nueva wallet)
   ```

3. **Después del deploy del contrato, agregar:**
   ```bash
   RANCHLINKTAG_ADDRESS=0x...  # Dirección del contrato desplegado
   NEXT_PUBLIC_CONTRACT_TAG=0x...  # Misma dirección (para frontend)
   ```

### ⚠️ **SEGURIDAD**

- **NO** uses la misma wallet que tu Ledger o wallet principal
- **NO** commitees el `.env.local` al repositorio
- **SÍ** usa una wallet dedicada solo para el servidor con fondos limitados
- **SÍ** considera usar una wallet diferente para deploy vs minting (separación de responsabilidades)

### 📊 **ESTADO ACTUAL vs REQUERIDO**

| Componente | Estado Actual | Requerido para v1.0 |
|------------|---------------|---------------------|
| RPC URLs | ✅ Completo | ✅ OK |
| Deploy Wallet (PRIVATE_KEY) | ❌ Missing | 🔴 **NECESARIO** |
| Minting Wallet (SERVER_WALLET_PRIVATE_KEY) | ❌ Missing | 🔴 **NECESARIO** |
| Contract Address | ❌ Vacío | ⏳ Después del deploy |
| Server Wallet Address | ✅ Existe (legacy) | ⚠️ Actualizar si nueva wallet |

---

## 📝 **NOTAS ADICIONALES**

- **v0.9 legacy:** Variables como `SERVER_SOLANA_ADDRESS`, `NEXT_PUBLIC_CONTRACT_REGISTRY`, y RPCs de otras chains no se usan en v1.0 pero se mantienen para compatibilidad
- **CDP_WALLET_SECRET:** Es un formato especial de Coinbase CDP, no se usa para minting directo en v1.0
- **Hardhat config:** Ya está actualizado para leer desde `apps/web/.env.local`

---

**✅ Auditoría completada. Listo para configurar wallets y proceder con deploy.**

