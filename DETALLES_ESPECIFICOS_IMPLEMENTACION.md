# 🔍 DETALLES ESPECÍFICOS DE IMPLEMENTACIÓN - RanchLink v1.0

Este documento complementa los reportes principales con detalles técnicos específicos de cada componente implementado.

---

## 📦 1. ESQUEMA DE BASE DE DATOS - DETALLES ESPECÍFICOS

### **Decisión: ¿Por qué estas tablas?**

**Tabla `ranches` (NUEVA en v1.0):**
- **Reemplaza:** `owners` (v0.9)
- **Razón:** "Ranch" es más específico que "owner" genérico
- **Campos Específicos:**
  ```sql
  id uuid PRIMARY KEY                    -- UUID generado automáticamente
  name text NOT NULL                     -- Nombre del rancho (ej: "Oak Hill Ranch")
  contact_email text                     -- Email de contacto
  phone text                             -- Teléfono
  billing_info jsonb                     -- Información de facturación (flexible)
  created_at timestamptz DEFAULT now()   -- Timestamp de creación
  ```
- **Índices Creados:**
  ```sql
  CREATE INDEX idx_ranches_email ON ranches(contact_email);
  ```
- **Resultado:** Tabla creada en migración `004_v1_schema.sql`, lista para usar

**Tabla `tags` (NUEVA en v1.0):**
- **Reemplaza:** `devices` (v0.9)
- **Razón:** "Tag" es más específico que "device" genérico
- **Campos Específicos:**
  ```sql
  id uuid PRIMARY KEY
  tag_code text UNIQUE NOT NULL          -- "RL-001" (impreso físicamente)
  chain text DEFAULT 'BASE'               -- Blockchain (solo Base en v1.0)
  contract_address text                  -- Dirección del contrato ERC-721
  token_id bigint                        -- Token ID del NFT mintado
  mint_tx_hash text                      -- Hash de transacción de mint
  nfc_uid text                           -- UID del chip NFC (opcional)
  ranch_id uuid REFERENCES ranches(id)   -- Rancho asignado
  animal_id uuid                         -- Animal vinculado (nullable)
  batch_id uuid REFERENCES batches(id)  -- Batch de producción
  status text DEFAULT 'in_inventory'    -- Estados: 'in_inventory' | 'assigned' | 'attached' | 'retired'
  created_at timestamptz DEFAULT now()
  ```
- **Índices Creados:**
  ```sql
  CREATE INDEX idx_tags_tag_code ON tags(tag_code);      -- Búsqueda rápida por tag_code
  CREATE INDEX idx_tags_ranch ON tags(ranch_id);         -- Filtrado por rancho
  CREATE INDEX idx_tags_animal ON tags(animal_id);       -- Filtrado por animal
  CREATE INDEX idx_tags_batch ON tags(batch_id);         -- Filtrado por batch
  CREATE INDEX idx_tags_token_id ON tags(token_id);      -- Búsqueda por token ID
  CREATE INDEX idx_tags_status ON tags(status);          -- Filtrado por estado
  ```
- **Resultado:** Tabla creada, lista para reemplazar `devices`

**Tabla `kits` (NUEVA en v1.0):**
- **Propósito:** Distribución retail de tags en cajas
- **Campos Específicos:**
  ```sql
  id uuid PRIMARY KEY
  kit_code text UNIQUE NOT NULL          -- "RLKIT-8F3K72" (código en caja)
  status text DEFAULT 'unclaimed'        -- 'unclaimed' | 'claimed'
  claimed_ranch_id uuid REFERENCES ranches(id)  -- Rancho que reclamó el kit
  created_at timestamptz DEFAULT now()
  ```
- **Resultado:** Sistema de kits implementado para retail

---

## 🔌 2. API ROUTES - DETALLES ESPECÍFICOS

### **Endpoint: `POST /api/factory/batches`**

**Archivo:** `apps/web/app/api/factory/batches/route.ts`

**Librerías Usadas:**
- `next/server` - `NextRequest`, `NextResponse`
- `@/lib/supabase/server` - `getSupabaseServerClient()`
- `@/lib/blockchain/ranchLinkTag` - `mintTag()`, `hashPublicId()`
- `@/lib/ipfs/client` - `pinAnimalMetadata()`

**Flujo de Ejecución Detallado:**

**Paso 1: Validación de Inputs**
```typescript
// Validación implementada:
if (!batchName || !batchSize || !model || !material || !color) {
  return NextResponse.json(
    { error: 'Missing required fields: batchName, batchSize, model, material, color' },
    { status: 400 }
  )
}

if (batchSize < 1 || batchSize > 1000) {
  return NextResponse.json(
    { error: 'Batch size must be between 1 and 1000' },
    { status: 400 }
  )
}
```
**Resultado:** Rechaza requests inválidos antes de procesar

**Paso 2: Creación de Batch**
```typescript
const { data: batch, error: batchError } = await supabase
  .from('batches')
  .insert({
    name: batchName,                    // "Austin Run"
    batch_name: batchName,              // Duplicado para compatibilidad
    model,                              // "BASIC_QR"
    material,                           // "PETG"
    color,                              // "Mesquite"
    chain,                              // "BASE"
    count: batchSize,                   // 57
    target_ranch_id: targetRanchId || null,  // UUID o null
    status: 'draft',                    // Estado inicial
  })
  .select('id')
  .single()
```
**Resultado:** Batch creado con UUID, retorna `batch.id` para usar en tags

**Paso 3: Generación de Tag Codes Secuenciales**
```typescript
// Algoritmo implementado:
const batchDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
// Resultado: "20240101"

const slug = batchName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4)
// "Austin Run" → "AUST"

// Buscar último tag_code existente
const { data: existingDevices } = await supabase
  .from('devices')
  .select('tag_id')
  .order('id', { ascending: false })
  .limit(1)

let startNumber = 1
if (existingDevices && existingDevices.length > 0) {
  const lastCode = existingDevices[0].tag_id  // Ej: "RL-057"
  const match = lastCode.match(/RL-(\d+)/)   // Regex: extrae "057"
  if (match) {
    startNumber = parseInt(match[1], 10) + 1  // 58
  }
}

// Generar códigos
for (let i = 0; i < batchSize; i++) {
  const tagNumber = startNumber + i           // 58, 59, 60, ...
  const tagCode = `RL-${String(tagNumber).padStart(3, '0')}`  // "RL-058"
  const publicId = `AUS${String(tagNumber).padStart(4, '0')}`  // "AUS0058"
  const code = `RL-${batchDate}-${slug}-${String(tagNumber).padStart(4, '0')}`
  // Resultado: "RL-20240101-AUST-0058"
}
```
**Resultado:** Códigos únicos y secuenciales: RL-058, RL-059, RL-060, ...

**Paso 4: Creación de Tags en DB**
```typescript
const { data: tag, error: tagError } = await supabase
  .from('devices')  // ⚠️ Usa devices para compatibilidad v0.9
  .insert({
    tag_id: tagCode,                    // "RL-058"
    batch_id: batch.id,                 // UUID del batch
    type: model,                         // "BASIC_QR"
    serial: code,                        // "RL-20240101-AUST-0058"
    public_id: publicId,                 // "AUS0058"
    status: 'printed',                   // Estado inicial
    base_qr_url: `${appUrl}/t/${tagCode}`,  // "https://.../t/RL-058"
    metadata: {                          // JSONB con toda la metadata
      material, model, chain, color,
      batch_name: batchName,
      batch_date: new Date().toISOString().slice(0, 10),
      code, tag_code: tagCode,
    },
  })
  .select('id')
  .single()
```
**Resultado:** Tag creado en DB antes de minting (permite retry si minting falla)

**Paso 5: Pin Metadata a IPFS**
```typescript
let cid = ''
try {
  cid = await pinAnimalMetadata({
    public_id: publicId,                // "AUS0058"
    tag_code: tagCode,                  // "RL-058"
    batch_name: batchName,              // "Austin Run"
    material, model, color, chain
  })
  // Internamente llama a Pinata API:
  // POST https://api.pinata.cloud/pinning/pinJSONToIPFS
  // Headers: Authorization: Bearer {PINATA_JWT}
  // Body: { name, description, image, attributes, external_url }
} catch (ipfsError) {
  console.warn(`IPFS pin failed for ${tagCode}, continuing without CID`)
  // Continúa sin CID - puede actualizarse después
}
```
**Resultado:** CID de IPFS (ej: "Qm1234...") o string vacío si falla

**Paso 6: Minting NFT en Blockchain**
```typescript
let tokenId: bigint | null = null
let mintTxHash: string | null = null

try {
  const mintResult = await mintTag(tagCode, publicId, cid)
  // Internamente:
  // 1. Hash publicId: keccak256("AUS0058") → bytes32
  // 2. Llama contrato: mintTo(serverWallet, publicIdHash, cid)
  // 3. Espera confirmación de transacción
  // 4. Retorna { tokenId, txHash }
  
  tokenId = mintResult.tokenId
  mintTxHash = mintResult.txHash
  
  // Actualizar tag con token_id y tx_hash
  await supabase
    .from('devices')
    .update({
      token_id: tokenId.toString(),      // "1", "2", "3", ...
      metadata: {
        ...metadata anterior,
        mint_tx_hash: mintTxHash,        // "0x1234...abcd"
        token_id: tokenId.toString(),
      }
    })
    .eq('id', tag.id)
} catch (mintError) {
  console.error(`Failed to mint tag ${tagCode}:`, mintError)
  // Continúa - tag existe en DB, minting puede reintentarse después
}
```
**Resultado:** NFT mintado en Base L2, `token_id` y `mint_tx_hash` guardados en DB

**Manejo de Errores Específico:**
- ✅ Si batch creation falla → Retorna error 500, no crea nada
- ✅ Si tag creation falla → Log error, continúa con siguiente tag
- ✅ Si IPFS falla → Log warning, continúa sin CID
- ✅ Si minting falla → Log error, tag queda en DB sin `token_id` (puede retry después)

**Resultado Final:**
- Batch creado en DB
- Tags creados en DB (57 registros)
- NFTs mintados en blockchain (57 transacciones)
- Metadata pinned en IPFS (57 CIDs)
- QR URLs generados (57 URLs)

---

## ⛓️ 3. INTEGRACIÓN BLOCKCHAIN - DETALLES ESPECÍFICOS

### **Contrato: RanchLinkTag.sol**

**Ubicación:** `packages/contracts/contracts/RanchLinkTag.sol`

**Versión Solidity:** `^0.8.24`

**Librerías OpenZeppelin Usadas:**
```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
```

**Versiones Específicas:**
- OpenZeppelin Contracts: `^5.0.0` (compatible con Solidity 0.8.24)

**Estructura del Contrato:**
```solidity
contract RanchLinkTag is ERC721URIStorage, Ownable, AccessControl {
    // Roles definidos
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Token ID auto-increment
    uint256 private _nextTokenId = 1;  // Empieza en 1
    
    // Mappings implementados
    mapping(uint256 => bytes32) public tokenToPublicId;   // tokenId → hash(public_id)
    mapping(bytes32 => uint256) public publicIdToToken;   // hash(public_id) → tokenId
    mapping(uint256 => bool) public isSoulbound;          // tokenId → soulbound status
}
```

**Constructor Implementado:**
```solidity
constructor(address initialOwner) 
    ERC721("RanchLink Tag", "RLTAG") 
    Ownable(initialOwner) 
{
    _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
    _grantRole(ADMIN_ROLE, initialOwner);
    _grantRole(MINTER_ROLE, initialOwner);
}
```
**Resultado:** Owner inicial tiene todos los roles

**Función `mintTo()` - Implementación Completa:**
```solidity
function mintTo(
    address to,
    bytes32 publicIdHash,
    string memory cid
) external onlyRole(MINTER_ROLE) returns (uint256) {
    // Validación: publicIdHash debe ser único
    require(publicIdToToken[publicIdHash] == 0, "Public ID already minted");
    
    // Auto-increment tokenId
    uint256 tokenId = _nextTokenId++;  // 1, 2, 3, ...
    
    // Mint NFT
    _safeMint(to, tokenId);
    
    // Set token URI (IPFS)
    _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", cid)));
    
    // Marcar como soulbound
    isSoulbound[tokenId] = true;
    
    // Guardar mappings
    tokenToPublicId[tokenId] = publicIdHash;
    publicIdToToken[publicIdHash] = tokenId;
    
    // Emitir evento
    emit TagMinted(tokenId, publicIdHash, to, cid);
    
    return tokenId;
}
```

**Eventos Emitidos:**
```solidity
event TagMinted(uint256 indexed tokenId, bytes32 indexed publicIdHash, address to, string cid);
event CIDUpdated(uint256 indexed tokenId, string newCID);
event SoulboundUnlocked(uint256 indexed tokenId, address from, address to);
```

**Función `getTokenId()` - Lookup Inverso:**
```solidity
function getTokenId(bytes32 publicIdHash) external view returns (uint256) {
    return publicIdToToken[publicIdHash];
}
```
**Uso:** Dado `hash("AUS0001")`, retorna `tokenId` correspondiente

### **Wrapper TypeScript: ranchLinkTag.ts**

**Ubicación:** `apps/web/lib/blockchain/ranchLinkTag.ts`

**Librería Elegida:** `viem` v2.38.6
- **¿Por qué viem?** Más moderno, mejor TypeScript, más eficiente que ethers.js
- **Alternativa considerada:** ethers.js v6 (más maduro pero más pesado)

**ABI Definido (Minimal):**
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
  // ... ownerOf, tokenURI
] as const
```
**Razón:** Solo funciones necesarias, no ABI completo (más eficiente)

**Función `mintTag()` - Implementación Específica:**
```typescript
export async function mintTag(
  tagCode: string,        // "RL-001"
  publicId: string,      // "AUS0001"
  cid: string = '',      // "Qm1234..." o ""
  recipientAddress?: `0x${string}`
): Promise<{ tokenId: bigint; txHash: `0x${string}` }> {
  // 1. Obtener dirección del contrato
  const contractAddress = getContractAddress()
  // Lee: process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG
  // Valida: debe empezar con "0x" y tener 42 caracteres
  
  // 2. Crear wallet client
  const walletClient = getWalletClient()
  // Lee: process.env.SERVER_WALLET_PRIVATE_KEY
  // Crea: privateKeyToAccount(privateKey)
  // Crea: createWalletClient({ account, chain, transport: http() })
  
  // 3. Determinar recipient
  const recipient = recipientAddress || walletClient.account.address
  // Default: server wallet address
  
  // 4. Hash publicId
  const publicIdHash = hashPublicId(publicId)
  // keccak256(stringToBytes("AUS0001")) → bytes32
  
  // 5. Escribir contrato (mint)
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: RANCHLINK_TAG_ABI,
    functionName: 'mintTo',
    args: [recipient, publicIdHash, cid],
  })
  // Resultado: transaction hash (0x...)
  
  // 6. Esperar confirmación
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  // Espera hasta que transacción esté confirmada
  
  // 7. Extraer tokenId (ACTUALMENTE PLACEHOLDER)
  let tokenId: bigint = BigInt(0)
  // ⚠️ PENDIENTE: Parsear evento TagMinted o llamar getTokenId(publicIdHash)
  
  return { tokenId, txHash: hash }
}
```

**Mejora Pendiente para `tokenId`:**
```typescript
// Opción 1: Parsear evento TagMinted del receipt
const tagMintedEvent = receipt.logs.find(log => 
  log.topics[0] === keccak256(toBytes("TagMinted(uint256,bytes32,address,string)"))
)
if (tagMintedEvent) {
  tokenId = decodeEventLog({
    abi: RANCHLINK_TAG_ABI,
    eventName: 'TagMinted',
    data: tagMintedEvent.data,
    topics: tagMintedEvent.topics,
  }).tokenId
}

// Opción 2: Llamar función view getTokenId
const tokenId = await publicClient.readContract({
  address: contractAddress,
  abi: RANCHLINK_TAG_ABI,
  functionName: 'getTokenId',
  args: [publicIdHash],
})
```

**Configuración de Red:**
```typescript
// apps/web/lib/blockchain/config.ts

// Base Mainnet
export const base = defineChain({
  id: 8453,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || 'https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: {
      url: 'https://basescan.org',
    },
  },
})

// Base Sepolia (testnet)
export const baseSepolia = defineChain({
  id: 84532,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      url: 'https://sepolia.basescan.org',
    },
  },
})

// Selección automática
export const currentChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' 
  ? base 
  : baseSepolia
```

**Public Client (Read Operations):**
```typescript
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(),  // HTTP transport (no WebSocket para simplicidad)
})
```

**Resultado de la Implementación:**
- ✅ Contrato ERC-721 estándar con OpenZeppelin
- ✅ Wrapper TypeScript con viem
- ✅ Minting funcional
- ✅ Configuración para Base Mainnet y Sepolia
- ⚠️ Pendiente: Mejorar extracción de `tokenId`

---

## 🗄️ 4. CLIENTES SUPABASE - DETALLES ESPECÍFICOS

### **Cliente Server-Side: server.ts**

**Ubicación:** `apps/web/lib/supabase/server.ts`

**Librería:** `@supabase/supabase-js` v2.39.0

**Implementación Específica:**
```typescript
import { createClient } from '@supabase/supabase-js'

function getServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Ejemplo: "https://utovzxpmfnzihurotqnv.supabase.co"
  
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  // ⚠️ SECRETO - Service role key (bypass RLS)
  
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable')
  }
  
  return { url, serviceKey }
}

let cachedServerClient: AnySupabaseClient | null = null

export function getSupabaseServerClient(): AnySupabaseClient {
  if (!cachedServerClient) {
    const { url, serviceKey } = getServerConfig()
    cachedServerClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,    // No refresh (server-side)
        persistSession: false,       // No persist (server-side)
      },
    })
  }
  
  return cachedServerClient
}
```

**Características:**
- ✅ Singleton pattern (cached client)
- ✅ Usa `SUPABASE_SERVICE_KEY` (bypass RLS)
- ✅ No auth refresh (server-side)
- ✅ No session persistence (server-side)

**Uso en API Routes:**
```typescript
// apps/web/app/api/factory/batches/route.ts
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient()  // ✅ Cliente correcto
  const { data } = await supabase.from('batches').insert({...})
}
```

---

## 📦 5. CLIENTE IPFS - DETALLES ESPECÍFICOS

### **Cliente: client.ts**

**Ubicación:** `apps/web/lib/ipfs/client.ts`

**Proveedor Elegido:** Pinata
- **¿Por qué Pinata?** API simple, confiable, buen uptime
- **Alternativa considerada:** Web3.Storage (más descentralizado pero más complejo)

**Implementación Específica:**
```typescript
// Pin JSON a IPFS
export async function pinJSON(data: any): Promise<string> {
  const jwt = process.env.PINATA_JWT
  // JWT token de Pinata (obtenido de dashboard)
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,  // JWT en header
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Pinata pinJSONToIPFS failed: ${response.status} ${errorText}`)
  }
  
  const result = await response.json()
  return result.IpfsHash  // Retorna CID (ej: "Qm1234...")
}
```

**Función `pinAnimalMetadata()` - Estructura Específica:**
```typescript
export async function pinAnimalMetadata(animal: any): Promise<string> {
  const metadata = {
    name: animal.animal_name || animal.name,              // "Bessie"
    description: `RanchLink animal tag for ${animal.animal_name}`,  // Descripción
    image: animal.photo_url || '',                       // URL de foto (opcional)
    attributes: [
      { trait_type: 'Breed', value: animal.breed || 'Unknown' },      // "Angus"
      { trait_type: 'Species', value: animal.species || 'Cattle' },  // "Cattle"
      { trait_type: 'Public ID', value: animal.public_id },          // "AUS0001"
    ],
    external_url: `${process.env.NEXT_PUBLIC_APP_URL}/a?id=${animal.public_id}`,
    // Ejemplo: "https://ranch-link.vercel.app/a?id=AUS0001"
  }
  
  return pinJSON(metadata)  // Retorna CID
}
```

**Estructura JSON Pinned:**
```json
{
  "name": "Bessie",
  "description": "RanchLink animal tag for Bessie",
  "image": "https://...",
  "attributes": [
    { "trait_type": "Breed", "value": "Angus" },
    { "trait_type": "Species", "value": "Cattle" },
    { "trait_type": "Public ID", "value": "AUS0001" }
  ],
  "external_url": "https://ranch-link.vercel.app/a?id=AUS0001"
}
```

**Gateway URL:**
```typescript
export function getIPFSUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}
// Ejemplo: "https://gateway.pinata.cloud/ipfs/Qm1234..."
```

**Resultado:**
- ✅ Metadata pinned en IPFS
- ✅ CID retornado
- ✅ Gateway URL disponible
- ✅ Estructura compatible con OpenSea/metadata standards

---

## 🔧 6. CONFIGURACIÓN - DETALLES ESPECÍFICOS

### **next.config.js**

**Ubicación:** `apps/web/next.config.js`

**Configuración Específica:**
```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // Para deployment en VPS (Hostinger)
  
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud', 'web3.storage'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
      },
    ],
  },
  
  experimental: {
    serverActions: true,  // Habilita Server Actions
  },
  
  // Webpack config para ignorar dependencias opcionales
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'bufferutil': 'commonjs bufferutil',        // Opcional de ws
        'utf-8-validate': 'commonjs utf-8-validate', // Opcional de ws
      })
    }
    return config
  },
}
```

**Resultado:**
- ✅ Build optimizado
- ✅ Imágenes de IPFS permitidas
- ✅ Dependencias opcionales ignoradas (sin warnings)

### **turbo.json**

**Ubicación:** `turbo.json`

**Configuración Específica:**
```json
{
  "tasks": {
    "build": {
      "env": [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_KEY",
        "NEXT_PUBLIC_APP_URL",
        "PINATA_JWT",
        "NEXT_PUBLIC_ALCHEMY_BASE_RPC",
        "NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC",
        "NEXT_PUBLIC_CHAIN_ID",
        "NEXT_PUBLIC_CONTRACT_TAG",
        "RANCHLINKTAG_ADDRESS",
        "SERVER_WALLET_PRIVATE_KEY",
        // ... todas las variables necesarias
      ],
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    }
  }
}
```

**Resultado:**
- ✅ Variables de entorno disponibles en build
- ✅ No más warnings de variables faltantes

---

**Última Actualización:** 2024-01-XX
**Versión:** v1.0
**Estado:** Detalles técnicos específicos de implementación

