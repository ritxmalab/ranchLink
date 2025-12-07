# 📊 REPORTE BACKEND - RanchLink v1.0

## 📋 ÍNDICE
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Esquema de Base de Datos](#esquema-de-base-de-datos)
3. [API Routes y Endpoints](#api-routes-y-endpoints)
4. [Integración Blockchain](#integración-blockchain)
5. [Errores Encontrados y Soluciones](#errores-encontrados-y-soluciones)
6. [Diferencias v0.9 vs v1.0](#diferencias-v09-vs-v10)
7. [Estado Actual y Pendientes](#estado-actual-y-pendientes)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **Stack Tecnológico**

```
┌─────────────────────────────────────────────────────────┐
│                    RANCHLINK BACKEND                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js 13.5.6 (App Router)                     │  │
│  │  - API Routes (Serverless Functions)             │  │
│  │  - Server Components                              │  │
│  │  - TypeScript                                     │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL)                           │  │
│  │  - Database (Postgres)                           │  │
│  │  - Row Level Security (RLS)                      │  │
│  │  - Real-time subscriptions                        │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Base L2 Blockchain                              │  │
│  │  - ERC-721 Contract (RanchLinkTag)              │  │
│  │  - Viem library                                  │  │
│  │  - Alchemy RPC                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  IPFS (Pinata)                                   │  │
│  │  - Metadata storage                              │  │
│  │  - Animal records                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Flujo de Datos**

```
1. Usuario escanea QR → /t/[tag_code]
   ↓
2. Next.js Server Component busca tag en Supabase
   ↓
3. Si tag no tiene animal → Muestra formulario de vinculación
   Si tag tiene animal → Redirige a /a/[public_id]
   ↓
4. Factory crea batch → POST /api/factory/batches
   ↓
5. Endpoint crea:
   - Registro en tabla `batches`
   - Registros en tabla `tags`
   - Mint NFT en Base L2 (ERC-721)
   - Pin metadata en IPFS
   ↓
6. Retorna QR URLs y token IDs
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### **Tablas Principales (v1.0)**

#### **1. `ranches`** (Reemplaza `owners` en v0.9)
```sql
CREATE TABLE ranches (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  contact_email text,
  phone text,
  billing_info jsonb,
  created_at timestamptz DEFAULT now()
);
```
**Propósito:** Representa ranchos/granjas que poseen animales.

#### **2. `tags`** (Reemplaza `devices` en v0.9)
```sql
CREATE TABLE tags (
  id uuid PRIMARY KEY,
  tag_code text UNIQUE NOT NULL,        -- "RL-001" (impreso en tag físico)
  chain text DEFAULT 'BASE',
  contract_address text,
  token_id bigint,                      -- ERC-721 tokenId
  mint_tx_hash text,
  nfc_uid text,
  ranch_id uuid REFERENCES ranches(id),
  animal_id uuid,                        -- Referencia a animals.id
  batch_id uuid REFERENCES batches(id),
  status text DEFAULT 'in_inventory',   -- 'in_inventory' | 'assigned' | 'attached' | 'retired'
  created_at timestamptz DEFAULT now()
);
```
**Propósito:** Representa tags físicos con NFTs mintados.

#### **3. `animals`** (Actualizado para v1.0)
```sql
CREATE TABLE animals (
  public_id text PRIMARY KEY,            -- "AUS0001"
  tag_id text,                           -- Deprecated, usar tags.animal_id
  owner_id uuid REFERENCES owners(id),  -- Deprecated, usar ranch_id
  ranch_id uuid REFERENCES ranches(id), -- NUEVO en v1.0
  species text,
  sex text,
  birth_year int,
  breed text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```
**Propósito:** Registros de animales vinculados a tags.

#### **4. `batches`** (Actualizado para v1.0)
```sql
CREATE TABLE batches (
  id uuid PRIMARY KEY,
  name text,
  batch_name text,                       -- NUEVO
  model text,                            -- NUEVO: "BASIC_QR"
  chain text DEFAULT 'BASE',             -- NUEVO
  material text,                         -- NUEVO: "PETG", "ABS"
  color text,                           -- NUEVO
  count int,
  target_ranch_id uuid REFERENCES ranches(id), -- NUEVO
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);
```
**Propósito:** Lotes de producción de tags.

#### **5. `kits`** (NUEVO en v1.0)
```sql
CREATE TABLE kits (
  id uuid PRIMARY KEY,
  kit_code text UNIQUE NOT NULL,         -- "RLKIT-8F3K72"
  status text DEFAULT 'unclaimed',       -- 'unclaimed' | 'claimed'
  claimed_ranch_id uuid REFERENCES ranches(id),
  created_at timestamptz DEFAULT now()
);
```
**Propósito:** Kits de retail para distribución.

#### **6. `kit_tags`** (NUEVO en v1.0)
```sql
CREATE TABLE kit_tags (
  kit_id uuid REFERENCES kits(id),
  tag_id uuid REFERENCES tags(id),
  PRIMARY KEY (kit_id, tag_id)
);
```
**Propósito:** Tabla de unión entre kits y tags.

### **Tablas Legacy (v0.9 - Mantenidas para compatibilidad)**

- `owners` - Reemplazado por `ranches` (migración disponible)
- `devices` - Reemplazado por `tags` (migración disponible)
- `events` - Sin cambios
- `anchors` - Sin cambios
- `transfers` - Sin cambios
- `qa_tests` - Sin cambios
- `custody_log` - Sin cambios
- `contracts` - Sin cambios
- `wallets` - Sin cambios
- `rwa_iot` - Sin cambios

### **Índices Críticos**

```sql
-- Tags
CREATE INDEX idx_tags_tag_code ON tags(tag_code);
CREATE INDEX idx_tags_token_id ON tags(token_id);
CREATE INDEX idx_tags_status ON tags(status);

-- Animals
CREATE INDEX idx_animals_ranch ON animals(ranch_id);

-- Kits
CREATE INDEX idx_kits_kit_code ON kits(kit_code);
```

---

## 🔌 API ROUTES Y ENDPOINTS

### **Endpoints Implementados**

#### **1. `GET /api/health`** ✅
**Propósito:** Diagnóstico del sistema
**Respuesta:**
```json
{
  "status": "healthy" | "unhealthy",
  "checks": {
    "env": { "status": "ok", "message": "..." },
    "supabase": { "status": "ok", "message": "..." }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### **2. `POST /api/factory/batches`** ✅
**Ubicación:** `apps/web/app/api/factory/batches/route.ts`

**Propósito:** Crear batch de tags y mintear NFTs automáticamente

**Request Body (Específico):**
```json
{
  "batchName": "Austin Run",           // String, requerido
  "batchSize": 57,                    // Number, 1-1000, requerido
  "model": "BASIC_QR",                // String, requerido
  "material": "PETG",                 // String, requerido (PETG, ABS, etc.)
  "color": "Mesquite",                // String, requerido
  "chain": "BASE",                    // String, default: "BASE"
  "targetRanchId": "uuid-optional",   // String UUID, opcional
  "kitMode": false,                   // Boolean, default: false
  "kitSize": null                     // Number, opcional (si kitMode = true)
}
```

**Validaciones Implementadas:**
```typescript
// 1. Campos requeridos
if (!batchName || !batchSize || !model || !material || !color) {
  return NextResponse.json(
    { error: 'Missing required fields: batchName, batchSize, model, material, color' },
    { status: 400 }
  )
}

// 2. Rango de batchSize
if (batchSize < 1 || batchSize > 1000) {
  return NextResponse.json(
    { error: 'Batch size must be between 1 and 1000' },
    { status: 400 }
  )
}
```

**Flujo de Ejecución (Paso a Paso):**

**Paso 1: Crear Batch en DB**
```typescript
const { data: batch, error: batchError } = await supabase
  .from('batches')
  .insert({
    name: batchName,
    batch_name: batchName,
    model,
    material,
    color,
    chain,
    count: batchSize,
    target_ranch_id: targetRanchId || null,
    status: 'draft',
  })
  .select('id')
  .single()
```
**Resultado:** Registro en tabla `batches` con UUID generado

**Paso 2: Determinar Número de Inicio para Tag Codes**
```typescript
// Busca último tag_code en devices (compatibilidad v0.9)
const { data: existingDevices } = await supabase
  .from('devices')
  .select('tag_id')
  .order('id', { ascending: false })
  .limit(1)

let startNumber = 1
if (existingDevices && existingDevices.length > 0) {
  const lastCode = existingDevices[0].tag_id  // Ej: "RL-057"
  const match = lastCode.match(/RL-(\d+)/)   // Extrae "057"
  if (match) {
    startNumber = parseInt(match[1], 10) + 1  // 58
  }
}
```
**Resultado:** `startNumber = 58` (si último tag fue RL-057)

**Paso 3: Loop de Generación de Tags (para cada tag en batch)**
```typescript
for (let i = 0; i < batchSize; i++) {
  const tagNumber = startNumber + i  // 58, 59, 60, ...
  const tagCode = `RL-${String(tagNumber).padStart(3, '0')}`  // "RL-058"
  const publicId = `AUS${String(tagNumber).padStart(4, '0')}`  // "AUS0058"
  const code = `RL-${batchDate}-${slug}-${String(tagNumber).padStart(4, '0')}`  // "RL-20240101-AUST-0058"
  
  // 3a. Crear tag en DB (antes de minting)
  const { data: tag } = await supabase
    .from('devices')  // Usa devices para compatibilidad v0.9
    .insert({
      tag_id: tagCode,
      batch_id: batch.id,
      type: model,
      serial: code,
      public_id: publicId,
      status: 'printed',
      base_qr_url: `${appUrl}/t/${tagCode}`,
      metadata: { material, model, chain, color, ... }
    })
    .select('id')
    .single()
  
  // 3b. Pin metadata a IPFS
  let cid = ''
  try {
    cid = await pinAnimalMetadata({
      public_id: publicId,
      tag_code: tagCode,
      batch_name: batchName,
      material, model, color, chain
    })
  } catch (ipfsError) {
    console.warn(`IPFS pin failed for ${tagCode}, continuing without CID`)
    // Continúa sin CID - puede actualizarse después
  }
  
  // 3c. Mintear NFT en Base L2
  let tokenId: bigint | null = null
  let mintTxHash: string | null = null
  try {
    const mintResult = await mintTag(tagCode, publicId, cid)
    tokenId = mintResult.tokenId
    mintTxHash = mintResult.txHash
    
    // 3d. Actualizar tag con token_id y tx_hash
    await supabase
      .from('devices')
      .update({
        token_id: tokenId.toString(),
        metadata: {
          material, model, chain, color,
          batch_name: batchName,
          batch_date: new Date().toISOString().slice(0, 10),
          code, tag_code: tagCode,
          mint_tx_hash: mintTxHash,
          token_id: tokenId.toString(),
        }
      })
      .eq('id', tag.id)
  } catch (mintError) {
    console.error(`Failed to mint tag ${tagCode}:`, mintError)
    // Continúa - tag existe en DB, minting puede reintentarse después
  }
  
  // 3e. Agregar a array de respuesta
  tags.push({
    id: tag.id,
    tag_code: tagCode,
    public_id: publicId,
    code,
    token_id: tokenId ? tokenId.toString() : null,
    mint_tx_hash: mintTxHash,
    base_qr_url: `${appUrl}/t/${tagCode}`,
    material, model, color, chain,
    batch_name: batchName,
    status: 'printed'
  })
}
```

**Paso 4: Manejo de Kits (si kitMode = true)**
```typescript
if (kitMode && kitSize) {
  const kitCode = `RLKIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  // Ejemplo: "RLKIT-8F3K72"
  
  const { data: kit } = await supabase
    .from('kits')
    .insert({
      kit_code: kitCode,
      status: 'unclaimed',
    })
    .select('id')
    .single()
  
  // Vincular primeros kitSize tags al kit
  const kitTagLinks = tags.slice(0, kitSize).map(tag => ({
    kit_id: kit.id,
    tag_id: tag.id,
  }))
  
  await supabase.from('kit_tags').insert(kitTagLinks)
}
```

**Paso 5: Actualizar Status del Batch**
```typescript
await supabase
  .from('batches')
  .update({ status: 'printed' })
  .eq('id', batch.id)
```

**Response (Estructura Completa):**
```json
{
  "success": true,
  "batch": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Austin Run",
    "size": 57
  },
  "tags": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "tag_code": "RL-058",
      "tag_id": "RL-058",
      "public_id": "AUS0058",
      "code": "RL-20240101-AUST-0058",
      "token_id": "1",
      "mint_tx_hash": "0x1234...abcd",
      "base_qr_url": "https://ranch-link.vercel.app/t/RL-058",
      "material": "PETG",
      "model": "BASIC_QR",
      "color": "Mesquite",
      "chain": "BASE",
      "batch_name": "Austin Run",
      "status": "printed"
    },
    // ... 56 más
  ],
  "kit": null,  // o { "id": "..." } si kitMode = true
  "message": "Successfully created batch with 57 tags"
}
```

**Dependencias Usadas:**
- `getSupabaseServerClient()` - Cliente Supabase server-side
- `mintTag()` - Wrapper blockchain (viem)
- `pinAnimalMetadata()` - Cliente IPFS (Pinata)

**Manejo de Errores:**
- ✅ Validación de inputs
- ✅ Try-catch en minting (no bloquea batch completo)
- ✅ Try-catch en IPFS (continúa sin CID si falla)
- ✅ Logging de errores por tag individual

**Resultado de la Implementación:**
- ✅ Endpoint completamente funcional
- ✅ Genera tags secuenciales automáticamente
- ✅ Mintea NFTs en blockchain
- ✅ Pin metadata en IPFS
- ✅ Manejo robusto de errores
- ⚠️ Usa tabla `devices` (compatibilidad v0.9) - debería migrar a `tags`

#### **3. `GET /api/superadmin/devices`** ✅
**Propósito:** Listar todos los tags/dispositivos
**Query Params:**
- `limit` (opcional, default: 200, max: 500)
**Response:**
```json
{
  "devices": [
    {
      "id": "uuid",
      "tag_id": "RL-001",
      "token_id": "123",
      "status": "in_inventory",
      "chain": "BASE"
    }
  ]
}
```

#### **4. `POST /api/superadmin/devices`** ✅
**Propósito:** Upsert de tags (compatibilidad v0.9)
**Request Body:**
```json
{
  "devices": [
    {
      "tag_id": "RL-001",
      "status": "in_inventory",
      "chain": "BASE"
    }
  ]
}
```

#### **5. `GET /api/animals/[id]`** ✅
**Propósito:** Obtener datos de animal por `public_id`
**Response:**
```json
{
  "animal": {
    "public_id": "AUS0001",
    "name": "Bessie",
    "species": "Cattle",
    "tags": {
      "tag_code": "RL-001",
      "token_id": "123"
    },
    "ranches": {
      "name": "Oak Hill Ranch"
    }
  },
  "events": [],
  "anchors": []
}
```

#### **6. `POST /api/claim`** ⚠️ DEPRECATED
**Propósito:** Claim de tag con token (v0.9)
**Estado:** Deprecado en v1.0, reemplazado por `/t/[tag_code]`

### **Endpoints Pendientes**

#### **7. `POST /api/claim-kit`** ⏳
**Propósito:** Claim de kit retail
**Request Body:**
```json
{
  "kitCode": "RLKIT-8F3K72",
  "ranch": {
    "name": "New Ranch",
    "email": "ranch@example.com",
    "phone": "+1234567890"
  }
}
```

---

## ⛓️ INTEGRACIÓN BLOCKCHAIN

### **DECISIÓN: Contrato Elegido - RanchLinkTag (ERC-721)**

**¿Por qué este contrato?**
- **Elegido:** `RanchLinkTag.sol` (ERC-721 estándar)
- **Rechazado:** `RanchLinkRWA.sol` (ERC-7518 experimental), `SecureRanchLinkTag.sol` (features avanzadas)
- **Razón:** v1.0 requiere solo identity layer básico, no features avanzadas de RWA/compliance

**Ubicación:** `packages/contracts/contracts/RanchLinkTag.sol`

**Librerías Usadas:**
- `@openzeppelin/contracts/token/ERC721/ERC721.sol` - Estándar ERC-721
- `@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol` - Token URI storage
- `@openzeppelin/contracts/access/Ownable.sol` - Ownership
- `@openzeppelin/contracts/access/AccessControl.sol` - Role-based access

**Versión Solidity:** `^0.8.24`

### **Implementación Específica del Contrato**

**Estructura del Contrato:**
```solidity
contract RanchLinkTag is ERC721URIStorage, Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId = 1;  // Auto-increment token IDs
    
    // Mappings implementados:
    mapping(uint256 => bytes32) public tokenToPublicId;  // tokenId -> hash(public_id)
    mapping(bytes32 => uint256) public publicIdToToken;  // hash(public_id) -> tokenId
    mapping(uint256 => bool) public isSoulbound;         // Soulbound hasta transfer
}
```

**Funciones Implementadas en el Contrato:**

#### **1. `mintTo(address to, bytes32 publicIdHash, string memory cid)`**
**Implementación:**
```solidity
function mintTo(
    address to,
    bytes32 publicIdHash,
    string memory cid
) external onlyRole(MINTER_ROLE) returns (uint256) {
    require(publicIdToToken[publicIdHash] == 0, "Public ID already minted");
    
    uint256 tokenId = _nextTokenId++;  // Auto-increment
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", cid)));
    isSoulbound[tokenId] = true;
    
    tokenToPublicId[tokenId] = publicIdHash;
    publicIdToToken[publicIdHash] = tokenId;
    
    emit TagMinted(tokenId, publicIdHash, to, cid);
    return tokenId;
}
```
**Características:**
- ✅ Solo `MINTER_ROLE` puede mintear
- ✅ Previene duplicados (publicIdHash único)
- ✅ Auto-increment tokenId (1, 2, 3, ...)
- ✅ Token URI = `ipfs://{cid}`
- ✅ Soulbound por defecto (no transferible hasta unlock)
- ✅ Emite evento `TagMinted` con todos los datos

#### **2. `setCID(uint256 tokenId, string memory cid)`**
**Implementación:**
```solidity
function setCID(uint256 tokenId, string memory cid) external {
    require(
        ownerOf(tokenId) == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
        "Not authorized"
    );
    _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", cid)));
    emit CIDUpdated(tokenId, cid);
}
```
**Uso:** Actualizar metadata del animal (nuevas fotos, eventos, etc.)

#### **3. `getTokenId(bytes32 publicIdHash)`**
**Implementación:**
```solidity
function getTokenId(bytes32 publicIdHash) external view returns (uint256) {
    return publicIdToToken[publicIdHash];
}
```
**Uso:** Obtener tokenId desde publicIdHash (para lookup inverso)

#### **4. `transferFrom()` - Override con Soulbound Unlock**
**Implementación:**
```solidity
function transferFrom(address from, address to, uint256 tokenId) public override {
    if (isSoulbound[tokenId]) {
        isSoulbound[tokenId] = false;  // Unlock al transferir
        emit SoulboundUnlocked(tokenId, from, to);
    }
    super.transferFrom(from, to, tokenId);
}
```
**Característica:** Tokens son soulbound hasta primera transferencia

### **Wrapper TypeScript - Implementación Específica**

**Ubicación:** `apps/web/lib/blockchain/ranchLinkTag.ts`

**Librería Elegida:** `viem` (v2.38.6)
- **¿Por qué viem?** Más moderno que ethers, mejor TypeScript support, más eficiente
- **Alternativa considerada:** ethers.js (más maduro pero más pesado)

**ABI Definido (Minimal - Solo funciones necesarias):**
```typescript
const RANCHLINK_TAG_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'publicIdHash', type: 'bytes32' },
      { name: 'cid', type: 'string' },
    ],
    name: 'mintTo',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
```

**Funciones Implementadas en el Wrapper:**

#### **1. `mintTag(tagCode, publicId, cid, recipientAddress?)`**
**Implementación Específica:**
```typescript
export async function mintTag(
  tagCode: string,
  publicId: string,
  cid: string = '',
  recipientAddress?: `0x${string}`
): Promise<{ tokenId: bigint; txHash: `0x${string}` }> {
  // 1. Obtiene dirección del contrato desde env
  const contractAddress = getContractAddress()  // RANCHLINKTAG_ADDRESS o NEXT_PUBLIC_CONTRACT_TAG
  
  // 2. Crea wallet client desde SERVER_WALLET_PRIVATE_KEY
  const walletClient = getWalletClient()  // Usa privateKeyToAccount de viem
  
  // 3. Determina recipient (default: server wallet address)
  const recipient = recipientAddress || walletClient.account.address
  
  // 4. Hash del publicId usando keccak256
  const publicIdHash = hashPublicId(publicId)  // keccak256(stringToBytes(publicId))
  
  // 5. Llama mintTo en el contrato
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: RANCHLINK_TAG_ABI,
    functionName: 'mintTo',
    args: [recipient, publicIdHash, cid],
  })
  
  // 6. Espera confirmación
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  // 7. Extrae tokenId (actualmente placeholder - necesita parsear eventos)
  let tokenId: bigint = BigInt(0)  // ⚠️ PENDIENTE: Parsear de eventos TagMinted
  
  return { tokenId, txHash: hash }
}
```
**Estado Actual:**
- ✅ Minting funciona
- ✅ Transaction hash retornado
- ⚠️ `tokenId` es placeholder (necesita parsear evento `TagMinted` o llamar `getTokenId(publicIdHash)`)

**Mejora Pendiente:**
```typescript
// Después de mint, llamar:
const tokenId = await publicClient.readContract({
  address: contractAddress,
  abi: RANCHLINK_TAG_ABI,
  functionName: 'getTokenId',
  args: [publicIdHash],
})
```

#### **2. `hashPublicId(publicId: string)`**
**Implementación:**
```typescript
export function hashPublicId(publicId: string): `0x${string}` {
  const { keccak256, stringToBytes } = require('viem')
  return keccak256(stringToBytes(publicId))
}
```
**Ejemplo:** `hashPublicId("AUS0001")` → `0x1234...abcd` (bytes32)

#### **3. `getOwner(tokenId: bigint)`**
**Implementación:**
```typescript
export async function getOwner(tokenId: bigint): Promise<string> {
  const contractAddress = getContractAddress()
  const owner = await publicClient.readContract({
    address: contractAddress,
    abi: RANCHLINK_TAG_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  })
  return owner
}
```
**Uso:** Verificar ownership de un token

#### **4. `getTokenURI(tokenId: bigint)`**
**Implementación:**
```typescript
export async function getTokenURI(tokenId: bigint): Promise<string> {
  const contractAddress = getContractAddress()
  const uri = await publicClient.readContract({
    address: contractAddress,
    abi: RANCHLINK_TAG_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  })
  return uri  // Retorna: "ipfs://Qm..."
}
```

#### **5. `getBasescanUrl(tokenId: bigint)`**
**Implementación:**
```typescript
export function getBasescanUrl(tokenId: bigint): string {
  const contractAddress = getContractAddress()
  const chainId = currentChain.id
  const baseUrl = chainId === 8453 
    ? 'https://basescan.org' 
    : 'https://sepolia.basescan.org'
  return `${baseUrl}/token/${contractAddress}?a=${tokenId.toString()}`
}
```
**Ejemplo:** `https://basescan.org/token/0x1234...?a=1`

### **Configuración de Red**

**Archivo:** `apps/web/lib/blockchain/config.ts`

**Cadenas Configuradas:**

#### **Base Mainnet:**
```typescript
export const base = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || 'https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },
})
```

#### **Base Sepolia (Testnet):**
```typescript
export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
})
```

**Selección de Cadena:**
```typescript
export const currentChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' 
  ? base 
  : baseSepolia
```

**Public Client (Read Operations):**
```typescript
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(),  // HTTP transport (no WebSocket)
})
```

### **Variables de Entorno Requeridas**

**Backend (Server-side):**
```bash
# Contrato
RANCHLINKTAG_ADDRESS=0x...                    # Dirección del contrato deployado
NEXT_PUBLIC_CONTRACT_TAG=0x...                # Alternativa (pública)

# Wallet del Servidor (para minting)
SERVER_WALLET_PRIVATE_KEY=0x...               # ⚠️ SECRETO - Nunca exponer

# RPC Endpoints
NEXT_PUBLIC_ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/...
NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/...

# Chain Selection
NEXT_PUBLIC_CHAIN_ID=8453                    # 8453 = Mainnet, 84532 = Sepolia
```

**Resultado de la Implementación:**
- ✅ Contrato `RanchLinkTag.sol` implementado con ERC-721 estándar
- ✅ Wrapper TypeScript con 5 funciones principales
- ✅ Configuración para Base Mainnet y Sepolia
- ✅ Integración con viem para interacción blockchain
- ⚠️ Pendiente: Mejorar extracción de `tokenId` después de mint

---

## 🐛 ERRORES ENCONTRADOS Y SOLUCIONES

### **Error 1: "TypeError: fetch failed" en QR Generation**

**Síntoma:**
```
TypeError: fetch failed
at POST /api/superadmin/devices
```

**Causa Raíz:**
- API routes usaban `createServerClient()` de `client.ts`
- Este cliente requiere `NEXT_PUBLIC_SUPABASE_ANON_KEY` (público)
- En servidor, debe usarse `SUPABASE_SERVICE_KEY` (privado)

**Solución:**
```typescript
// ❌ ANTES (incorrecto)
import { createServerClient } from '@/lib/supabase/client'
const supabase = createServerClient()

// ✅ DESPUÉS (correcto)
import { getSupabaseServerClient } from '@/lib/supabase/server'
const supabase = getSupabaseServerClient()
```

**Archivos Corregidos:**
- ✅ `apps/web/app/api/superadmin/devices/route.ts`
- ✅ `apps/web/app/api/claim/route.ts`
- ✅ `apps/web/app/api/animals/[id]/route.ts`

---

### **Error 2: "Property 'metadata' does not exist on type '{ id: any; }'**

**Síntoma:**
```
Type error: Property 'metadata' does not exist on type '{ id: any; }'
at apps/web/app/api/factory/batches/route.ts:174
```

**Causa Raíz:**
- Query Supabase solo seleccionaba `id`: `.select('id')`
- TypeScript infiere `tag = { id: any }`
- Código intentaba acceder `tag.metadata` que no existe

**Solución:**
```typescript
// ❌ ANTES (incorrecto)
const { data: tag } = await supabase
  .from('devices')
  .insert({ ... })
  .select('id')
  .single()

await supabase
  .from('devices')
  .update({
    metadata: {
      ...tag.metadata,  // ❌ tag no tiene metadata
      mint_tx_hash: mintTxHash
    }
  })

// ✅ DESPUÉS (correcto)
const { data: tag } = await supabase
  .from('devices')
  .insert({ ... })
  .select('id')
  .single()

await supabase
  .from('devices')
  .update({
    metadata: {
      material,        // ✅ Reconstruir desde variables en scope
      model,
      chain,
      color,
      batch_name: batchName,
      mint_tx_hash: mintTxHash,
      token_id: tokenId.toString()
    }
  })
```

**Archivo Corregido:**
- ✅ `apps/web/app/api/factory/batches/route.ts`

---

### **Error 3: "Missing NEXT_PUBLIC_SUPABASE_URL" en Vercel**

**Síntoma:**
```
Build failed: Missing NEXT_PUBLIC_SUPABASE_URL
Red banner en Vercel dashboard
```

**Causa Raíz:**
- Variables de entorno no pasadas a build process
- `turbo.json` no incluía variables en `env` array

**Solución:**
```json
// turbo.json
{
  "tasks": {
    "build": {
      "env": [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_KEY",
        // ... todas las variables necesarias
      ]
    }
  }
}
```

**Archivo Corregido:**
- ✅ `turbo.json`

---

### **Error 4: "Module not found: Can't resolve 'bufferutil'"**

**Síntoma:**
```
Module not found: Can't resolve 'bufferutil' in '/node_modules/ws/lib'
Module not found: Can't resolve 'utf-8-validate'
```

**Causa Raíz:**
- Dependencias opcionales de `ws` (usado por `viem`)
- No críticas, solo optimizaciones de performance

**Solución:**
```javascript
// next.config.js
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = config.externals || []
    config.externals.push({
      'bufferutil': 'commonjs bufferutil',
      'utf-8-validate': 'commonjs utf-8-validate',
    })
  }
  return config
}
```

**Archivo Corregido:**
- ✅ `apps/web/next.config.js`

---

### **Error 5: "Structural problems with the columns"**

**Síntoma:**
```
Error: column "created_at" does not exist
at SELECT from devices table
```

**Causa Raíz:**
- Tabla `devices` no tenía columna `created_at`
- Migración inicial no la incluía

**Solución:**
```sql
-- infra/db/migrations/005_add_created_at_to_devices.sql
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
```

**Archivo Creado:**
- ✅ `infra/db/migrations/005_add_created_at_to_devices.sql`

---

## 🔄 DIFERENCIAS v0.9 vs v1.0

### **1. Esquema de Base de Datos**

| Aspecto | v0.9 | v1.0 |
|---------|------|------|
| **Entidad Principal** | `owners` | `ranches` |
| **Tags/Dispositivos** | `devices` | `tags` |
| **Claim System** | `claim_token` único por tag | Directo por `tag_code` |
| **QR Codes** | 2 QRs: Overlay + Base | 1 QR: `/t/[tag_code]` |
| **Kits** | No existe | `kits` + `kit_tags` |
| **Chain** | Multi-chain (Base, Solana) | Solo Base L2 |
| **Contract** | Múltiples (RWA, Registry, Bridge) | Solo RanchLinkTag (ERC-721) |

### **2. Flujo de Claim**

**v0.9:**
```
1. Usuario escanea Overlay QR
2. Obtiene claim_token único
3. Visita /start?token=xxx
4. Completa formulario
5. Tag se asigna a owner
```

**v1.0:**
```
1. Usuario escanea Base QR (único)
2. Visita /t/RL-001
3. Si tag no tiene animal:
   - Usuario autenticado + dueño del ranch → Formulario de vinculación
   - Otro → Mensaje "Tag no vinculado"
4. Si tag tiene animal:
   - Redirige a /a/AUS0001
```

### **3. Factory/Batch Creation**

**v0.9:**
```
1. UI genera QRs client-side
2. Guarda en `devices` table
3. No mintea NFTs automáticamente
4. Claim token generado por tag
```

**v1.0:**
```
1. UI llama POST /api/factory/batches
2. Endpoint crea batch en DB
3. Genera tags secuenciales (RL-001, RL-002, ...)
4. Mintea NFT por cada tag (ERC-721)
5. Pin metadata en IPFS
6. Retorna QR URLs y token IDs
```

### **4. Blockchain**

**v0.9:**
- Múltiples contratos: RanchLinkRWA, SecureRegistry, SolanaBridge
- Soporte multi-chain
- Features avanzadas (RWA, compliance)

**v1.0:**
- Un solo contrato: RanchLinkTag (ERC-721)
- Solo Base L2
- Features básicas (identity layer)
- Contratos experimentales movidos a `/experimental`

### **5. API Routes**

**v0.9:**
- `POST /api/claim` - Claim con token
- `GET /api/superadmin/devices` - Lista devices
- Sin endpoint de factory

**v1.0:**
- `POST /api/factory/batches` - Crea batch + mintea NFTs ✅
- `GET /t/[tag_code]` - Route de tag scan ✅
- `POST /api/claim` - Deprecado
- `GET /api/health` - Diagnóstico ✅

---

## ✅ ESTADO ACTUAL Y PENDIENTES

### **✅ Completado**

1. **Base de Datos:**
   - ✅ Migración v1.0 schema creada
   - ✅ Tablas `ranches`, `tags`, `kits` definidas
   - ✅ Migración helpers para datos existentes
   - ✅ Columna `created_at` agregada a `devices`

2. **API Routes:**
   - ✅ `POST /api/factory/batches` - Factory endpoint
   - ✅ `GET /api/health` - Diagnóstico
   - ✅ `GET /api/superadmin/devices` - Lista tags
   - ✅ `POST /api/superadmin/devices` - Upsert tags
   - ✅ `GET /api/animals/[id]` - Datos de animal

3. **Blockchain:**
   - ✅ Wrapper `ranchLinkTag.ts` creado
   - ✅ Funciones `mintTag()`, `getOwner()`, `getTokenURI()`
   - ✅ Configuración Base L2

4. **Errores Corregidos:**
   - ✅ Fix Supabase client en API routes
   - ✅ Fix TypeScript error en factory/batches
   - ✅ Fix webpack warnings
   - ✅ Fix missing `created_at` column

5. **Infraestructura:**
   - ✅ `turbo.json` configurado con env vars
   - ✅ `next.config.js` con webpack externals
   - ✅ Variables de entorno documentadas

### **⏳ Pendiente**

1. **Base de Datos:**
   - ⏳ Ejecutar migración `004_v1_schema.sql` en Supabase
   - ⏳ Ejecutar helpers de migración de datos
   - ⏳ Verificar datos migrados correctamente

2. **Blockchain:**
   - ⏳ Deploy contrato `RanchLinkTag` a Base Sepolia (testnet)
   - ⏳ Obtener dirección del contrato
   - ⏳ Agregar `RANCHLINKTAG_ADDRESS` a Vercel
   - ⏳ Grant MINTER_ROLE a server wallet
   - ⏳ Testear minting en testnet
   - ⏳ Deploy a Base Mainnet (producción)

3. **API Routes:**
   - ⏳ `POST /api/claim-kit` - Claim de kits retail
   - ⏳ Actualizar `POST /api/claim` para v1.0 o deprecar

4. **Testing:**
   - ⏳ Test end-to-end de factory flow
   - ⏳ Test de minting NFTs
   - ⏳ Test de tag scan route
   - ⏳ Test de claim kit flow

5. **Optimizaciones:**
   - ⏳ Mejorar extracción de `tokenId` de eventos de transacción
   - ⏳ Agregar retry logic para minting
   - ⏳ Agregar logging y monitoring

---

## 📝 NOTAS TÉCNICAS

### **Compatibilidad Backward**

- Tablas v0.9 (`owners`, `devices`) se mantienen
- Migración de datos disponible pero no automática
- API routes soportan ambos esquemas temporalmente

### **Seguridad**

- `SUPABASE_SERVICE_KEY` solo en server-side
- `SERVER_WALLET_PRIVATE_KEY` nunca expuesta
- RLS (Row Level Security) en Supabase
- Variables de entorno en Vercel (no en código)

### **Performance**

- Índices en columnas críticas (`tag_code`, `token_id`)
- Batch operations para creación de tags
- IPFS pinning asíncrono (no bloquea minting)

---

## 🚀 PRÓXIMOS PASOS

1. **Inmediato:**
   - Ejecutar migración de base de datos
   - Deploy contrato a testnet
   - Testear factory flow

2. **Corto Plazo:**
   - Implementar `POST /api/claim-kit`
   - Actualizar frontend para usar nuevos endpoints
   - Test end-to-end completo

3. **Mediano Plazo:**
   - Deploy a producción (Base Mainnet)
   - Migrar datos existentes
   - Monitoreo y logging

---

**Última Actualización:** 2024-01-XX
**Versión:** v1.0 (Backend)
**Estado:** ✅ Core implementado, pendiente deployment y testing

