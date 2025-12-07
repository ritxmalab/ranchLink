# 🔬 CONTRATOS EXPERIMENTALES Y AVANZADOS - Organización

## ✅ CONFIRMACIÓN: Todos los Contratos Están Guardados

**Ubicación:** `packages/contracts/contracts/`

### **Contratos Existentes:**

1. ✅ **RanchLinkTag.sol** - **PRODUCCIÓN (v1.0)**
   - ERC-721 estándar
   - En uso actual
   - Ubicación: `packages/contracts/contracts/RanchLinkTag.sol`

2. ✅ **RanchLinkRWA.sol** - **EXPERIMENTAL (Futuro)**
   - ERC-7518 (DyCIST) - Real World Assets
   - Partitions: Animal Tags, Software Licenses, Trademarks, Revenue Share
   - Features avanzadas de compliance y revenue distribution
   - **Estado:** Guardado, no destruido, listo para futuro

3. ✅ **SecureRanchLinkTag.sol** - **EXPERIMENTAL (Futuro)**
   - ERC-721 con features de seguridad avanzadas
   - Pausable, ReentrancyGuard
   - Tamper-proof, flexible security
   - **Estado:** Guardado, no destruido, listo para futuro

4. ✅ **SolanaBridge.sol** - **EXPERIMENTAL (Futuro)**
   - Cross-chain bridge a Solana
   - Revenue distribution a Solana address
   - Integración con Wormhole/LayerZero
   - **Estado:** Guardado, no destruido, listo para futuro

5. ✅ **Registry.sol** - **EXPERIMENTAL (Futuro)**
   - Data anchoring registry
   - **Estado:** Guardado, no destruido

6. ✅ **SecureRegistry.sol** - **EXPERIMENTAL (Futuro)**
   - Secure data anchoring
   - **Estado:** Guardado, no destruido

---

## 📁 ESTRUCTURA RECOMENDADA (Organización Futura)

### **Opción 1: Mantener Estructura Actual (Recomendada)**

```
packages/contracts/
├── contracts/
│   ├── RanchLinkTag.sol          # ✅ PRODUCCIÓN (v1.0)
│   ├── RanchLinkRWA.sol          # 🔬 EXPERIMENTAL
│   ├── SecureRanchLinkTag.sol    # 🔬 EXPERIMENTAL
│   ├── SolanaBridge.sol          # 🔬 EXPERIMENTAL
│   ├── Registry.sol              # 🔬 EXPERIMENTAL
│   └── SecureRegistry.sol         # 🔬 EXPERIMENTAL
├── experimental/                 # 📁 NUEVA CARPETA (opcional)
│   ├── RanchLinkRWA.sol
│   ├── SecureRanchLinkTag.sol
│   ├── SolanaBridge.sol
│   ├── Registry.sol
│   └── SecureRegistry.sol
└── scripts/
    ├── deploy.ts                 # Deploy RanchLinkTag (producción)
    ├── deploy-rwa.ts             # Deploy RanchLinkRWA (experimental)
    └── secure-deploy.ts           # Deploy SecureRanchLinkTag (experimental)
```

**Ventaja:** Mantiene todo en un lugar, fácil de encontrar

---

## 🔌 CÓMO CONECTAR EN EL FUTURO

### **1. RanchLinkRWA (ERC-7518) - Real World Assets**

**Cuándo usar:**
- Cuando necesites compliance avanzado
- Revenue sharing entre múltiples partes
- Múltiples tipos de activos (tags, licencias, trademarks)
- Distribución de ingresos automática

**Cómo conectar:**
```typescript
// apps/web/lib/blockchain/ranchLinkRWA.ts (crear nuevo archivo)

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { currentChain, publicClient } from './config'

const RANCHLINK_RWA_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'partition', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'cid', type: 'string' },
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ... más funciones
] as const

export async function mintRWA(
  to: `0x${string}`,
  partition: 'ANIMAL_TAGS' | 'SOFTWARE_LICENSE' | 'TRADEMARKS' | 'REVENUE_SHARE',
  amount: bigint,
  cid: string
): Promise<{ tokenId: bigint; txHash: `0x${string}` }> {
  const contractAddress = process.env.RANCHLINKRWA_ADDRESS as `0x${string}`
  const walletClient = getWalletClient()
  
  const partitionHash = keccak256(toBytes(partition))
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: RANCHLINK_RWA_ABI,
    functionName: 'mint',
    args: [to, partitionHash, amount, cid],
  })
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  return { tokenId: BigInt(0), txHash: hash } // Parsear de eventos
}
```

**Variables de entorno necesarias:**
```bash
RANCHLINKRWA_ADDRESS=0x...  # Dirección del contrato deployado
```

---

### **2. SecureRanchLinkTag - Versión Segura**

**Cuándo usar:**
- Cuando necesites pausar contratos en emergencias
- Protección contra reentrancy attacks
- Control más granular de transfers
- Features de seguridad avanzadas

**Cómo conectar:**
```typescript
// apps/web/lib/blockchain/secureRanchLinkTag.ts (crear nuevo archivo)

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { currentChain, publicClient } from './config'

const SECURE_RANCHLINK_TAG_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tagId', type: 'string' },
      { name: 'cid', type: 'string' },
    ],
    name: 'mintTag',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ... más funciones
] as const

export async function mintSecureTag(
  to: `0x${string}`,
  tagId: string,
  cid: string
): Promise<{ tokenId: bigint; txHash: `0x${string}` }> {
  const contractAddress = process.env.SECURE_RANCHLINKTAG_ADDRESS as `0x${string}`
  const walletClient = getWalletClient()
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: SECURE_RANCHLINK_TAG_ABI,
    functionName: 'mintTag',
    args: [to, tagId, cid],
  })
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  return { tokenId: BigInt(0), txHash: hash }
}

export async function pauseContract(): Promise<`0x${string}`> {
  const contractAddress = process.env.SECURE_RANCHLINKTAG_ADDRESS as `0x${string}`
  const walletClient = getWalletClient()
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: SECURE_RANCHLINK_TAG_ABI,
    functionName: 'pause',
    args: [],
  })
  
  return hash
}
```

**Variables de entorno necesarias:**
```bash
SECURE_RANCHLINKTAG_ADDRESS=0x...  # Dirección del contrato deployado
```

---

### **3. SolanaBridge - Cross-Chain**

**Cuándo usar:**
- Cuando necesites enviar revenue a Solana
- Integración con ecosistema Solana
- Cross-chain operations

**Cómo conectar:**
```typescript
// apps/web/lib/blockchain/solanaBridge.ts (crear nuevo archivo)

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { currentChain, publicClient } from './config'

const SOLANA_BRIDGE_ABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'solanaAddress', type: 'bytes' },
    ],
    name: 'bridgeRevenue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ... más funciones
] as const

export async function bridgeToSolana(
  tokenAddress: `0x${string}`,
  amount: bigint,
  solanaAddress: string  // Base58 encoded
): Promise<`0x${string}`> {
  const contractAddress = process.env.SOLANA_BRIDGE_ADDRESS as `0x${string}`
  const walletClient = getWalletClient()
  
  // Convertir Solana address a bytes
  const solanaBytes = base58ToBytes(solanaAddress)
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: SOLANA_BRIDGE_ABI,
    functionName: 'bridgeRevenue',
    args: [tokenAddress, amount, solanaBytes],
  })
  
  return hash
}
```

**Variables de entorno necesarias:**
```bash
SOLANA_BRIDGE_ADDRESS=0x...           # Dirección del contrato
SOLANA_TREASURY_ADDRESS=...          # Solana address (base58)
BRIDGE_PROVIDER=wormhole|layerzero    # Proveedor de bridge
```

---

### **4. Registry / SecureRegistry - Data Anchoring**

**Cuándo usar:**
- Cuando necesites anclar datos a blockchain
- Verificación de integridad de datos
- Timestamping de eventos

**Cómo conectar:**
```typescript
// apps/web/lib/blockchain/registry.ts (crear nuevo archivo)

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { currentChain, publicClient } from './config'

const REGISTRY_ABI = [
  {
    inputs: [
      { name: 'cid', type: 'string' },
      { name: 'hash', type: 'bytes32' },
    ],
    name: 'anchor',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ... más funciones
] as const

export async function anchorData(
  cid: string,
  dataHash: `0x${string}`
): Promise<{ anchorId: bigint; txHash: `0x${string}` }> {
  const contractAddress = process.env.REGISTRY_ADDRESS as `0x${string}`
  const walletClient = getWalletClient()
  
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: REGISTRY_ABI,
    functionName: 'anchor',
    args: [cid, dataHash],
  })
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  return { anchorId: BigInt(0), txHash: hash } // Parsear de eventos
}
```

**Variables de entorno necesarias:**
```bash
REGISTRY_ADDRESS=0x...                # Dirección del contrato
SECURE_REGISTRY_ADDRESS=0x...         # Si usas SecureRegistry
```

---

## 📋 CHECKLIST PARA ACTIVAR EN EL FUTURO

### **Paso 1: Deploy del Contrato**
```bash
cd packages/contracts

# Deploy RanchLinkRWA
npx hardhat run scripts/deploy-rwa.ts --network base

# Deploy SecureRanchLinkTag
npx hardhat run scripts/secure-deploy.ts --network base

# Deploy SolanaBridge
npx hardhat run scripts/deploy-bridge.ts --network base
```

### **Paso 2: Crear Wrapper TypeScript**
- Crear archivo en `apps/web/lib/blockchain/[nombre].ts`
- Copiar estructura de `ranchLinkTag.ts`
- Adaptar ABI y funciones

### **Paso 3: Agregar Variables de Entorno**
- Agregar dirección del contrato a Vercel
- Agregar a `turbo.json` si es necesario

### **Paso 4: Actualizar API Routes**
- Crear nuevos endpoints si es necesario
- O actualizar endpoints existentes

### **Paso 5: Testing**
- Test en Base Sepolia primero
- Verificar funciones principales
- Test de integración

---

## 🎯 RESUMEN

### **✅ Estado Actual:**
- ✅ Todos los contratos están guardados
- ✅ Ningún contrato fue destruido
- ✅ Estructura lista para futuro uso
- ✅ Scripts de deploy disponibles

### **📁 Ubicación:**
```
packages/contracts/contracts/
├── RanchLinkTag.sol          # ✅ PRODUCCIÓN
├── RanchLinkRWA.sol          # 🔬 EXPERIMENTAL
├── SecureRanchLinkTag.sol    # 🔬 EXPERIMENTAL
├── SolanaBridge.sol          # 🔬 EXPERIMENTAL
├── Registry.sol              # 🔬 EXPERIMENTAL
└── SecureRegistry.sol         # 🔬 EXPERIMENTAL
```

### **🔌 Para Conectar en el Futuro:**
1. Deploy contrato a Base
2. Crear wrapper TypeScript (copiar estructura de `ranchLinkTag.ts`)
3. Agregar variables de entorno
4. Actualizar API routes si es necesario
5. Test y deploy

---

## 📝 NOTAS IMPORTANTES

1. **No se destruyó nada** - Todos los contratos están intactos
2. **Fácil de conectar** - Misma estructura que `RanchLinkTag`
3. **Documentado** - Este documento explica cómo conectarlos
4. **Listo para futuro** - Solo necesitas deploy y wrapper

---

**Última Actualización:** 2024-01-XX
**Estado:** ✅ Todos los contratos guardados y organizados
**Listo para:** Futuro uso cuando necesites features avanzadas

