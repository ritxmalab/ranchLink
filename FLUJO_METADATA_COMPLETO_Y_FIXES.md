# 🔧 Flujo de Metadata Completo - Estado Actual y Fixes Necesarios

## ⚠️ PROBLEMA IDENTIFICADO

**El flujo de metadata NO está completo:**
- ✅ Tags se mintean con metadata básica
- ❌ Cuando cliente attach animal, metadata NO se actualiza en blockchain
- ❌ Metadata NO incluye datos del rancho
- ❌ Metadata NO incluye eventos/historial

---

## ✅ Wallet Correcta (Confirmado)

**Solo usamos esta wallet:**
```
0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
```

**La otra dirección (`0x680c...`) NO aparece en el código** - probablemente es una wallet personal tuya o de prueba.

---

## 📊 Flujo Actual (Incompleto)

### 1. Factory Genera Tag ✅
- Tag se mintea con metadata básica en IPFS
- `tokenURI` apunta a IPFS con datos básicos (tag_code, public_id)

### 2. Cliente Attach Animal ❌ (INCOMPLETO)
- Animal se crea en DB ✅
- Tag se vincula a animal en DB ✅
- **Metadata NO se actualiza en IPFS** ❌
- **`tokenURI` del NFT NO se actualiza** ❌

### 3. Visualización ❌ (INCOMPLETO)
- NFT muestra metadata básica (solo tag info)
- NO muestra datos del animal
- NO muestra datos del rancho
- NO muestra eventos

---

## 🔧 Fixes Necesarios

### Fix 1: Mejorar `pinAnimalMetadata` para incluir datos completos

**Archivo:** `apps/web/lib/ipfs/client.ts`

**Cambio necesario:**
```typescript
export async function pinAnimalMetadata(animal: any, ranch?: any): Promise<string> {
  const metadata = {
    name: `${animal.name || animal.animal_name} - ${animal.public_id}`,
    description: `RanchLink RWA Tag - Full traceability record for ${animal.name || animal.animal_name}`,
    image: animal.photo_url || '',
    attributes: [
      { trait_type: 'Tag Code', value: animal.tag_code || '' },
      { trait_type: 'Public ID', value: animal.public_id },
      { trait_type: 'Species', value: animal.species || 'Cattle' },
      { trait_type: 'Breed', value: animal.breed || 'Unknown' },
      { trait_type: 'Sex', value: animal.sex || 'Unknown' },
      { trait_type: 'Birth Year', value: animal.birth_year?.toString() || 'Unknown' },
      { trait_type: 'Status', value: animal.status || 'active' },
      ...(ranch ? [
        { trait_type: 'Ranch Name', value: ranch.name || '' },
        { trait_type: 'Ranch Contact', value: ranch.contact_email || '' },
      ] : []),
    ],
    properties: {
      animal: {
        name: animal.name || animal.animal_name,
        species: animal.species,
        breed: animal.breed,
        sex: animal.sex,
        birth_year: animal.birth_year,
        status: animal.status,
      },
      ...(ranch ? {
        ranch: {
          name: ranch.name,
          contact_email: ranch.contact_email,
          contact_phone: ranch.phone,
        },
      } : {}),
    },
    external_url: `${process.env.NEXT_PUBLIC_APP_URL}/a/${animal.public_id}`,
  }
  return pinJSON(metadata)
}
```

### Fix 2: Agregar función `setCID` al wrapper de blockchain

**Archivo:** `apps/web/lib/blockchain/ranchLinkTag.ts`

**Agregar:**
```typescript
/**
 * Update token URI (CID) for an existing NFT
 * @param tokenId - Token ID
 * @param cid - New IPFS CID
 * @returns Transaction hash
 */
export async function setCID(tokenId: bigint, cid: string): Promise<`0x${string}`> {
  const contractAddress = getContractAddress()
  const serverWalletPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY
  
  if (!serverWalletPrivateKey) {
    throw new Error('Missing SERVER_WALLET_PRIVATE_KEY')
  }

  const walletClient = createWalletClient({
    account: privateKeyToAccount(serverWalletPrivateKey as `0x${string}`),
    chain: baseMainnet,
    transport: http(process.env.ALCHEMY_BASE_RPC || process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || ''),
  })

  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: RANCHLINK_TAG_ABI,
      functionName: 'setCID',
      args: [tokenId, cid],
    })

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 120000,
      confirmations: 1,
    })

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted')
    }

    return hash
  } catch (error: any) {
    throw new Error(`Failed to update CID: ${error.message}`)
  }
}
```

### Fix 3: Actualizar `/api/attach-tag` para actualizar metadata

**Archivo:** `apps/web/app/api/attach-tag/route.ts`

**Agregar después de crear/actualizar animal:**
```typescript
// 6. Pin complete metadata to IPFS and update NFT tokenURI
let cid: string | null = null
try {
  // Load ranch data if available
  let ranchData = null
  if (tag.ranch_id) {
    const { data: ranch } = await supabase
      .from('ranches')
      .select('name, contact_email, phone')
      .eq('id', tag.ranch_id)
      .single()
    ranchData = ranch
  }

  // Load complete animal data
  const { data: completeAnimal } = await supabase
    .from('animals')
    .select('*, tags(tag_code)')
    .eq('id', animalId)
    .single()

  // Pin metadata to IPFS
  const { pinAnimalMetadata } = await import('@/lib/ipfs/client')
  cid = await pinAnimalMetadata(completeAnimal, ranchData)

  // Update NFT tokenURI on-chain
  if (tag.token_id && cid) {
    const { setCID } = await import('@/lib/blockchain/ranchLinkTag')
    const tokenId = BigInt(tag.token_id)
    const txHash = await setCID(tokenId, cid)
    
    // Update tag with new CID
    await supabase
      .from('tags')
      .update({ 
        metadata_cid: cid,
        metadata_tx_hash: txHash,
      })
      .eq('id', tag.id)
  }
} catch (error: any) {
  console.error('[ATTACH-TAG] Failed to update metadata:', error)
  // Don't fail the attach - metadata update can be retried
}
```

---

## 🚀 Optimización para Batches Grandes

### Problema Actual:
- Mint uno por uno = 100 transacciones = caro

### Solución: Batch Minting

**Necesitamos agregar al contrato:**
```solidity
function mintBatch(
    address to,
    bytes32[] calldata publicIdHashes,
    string[] calldata cids
) external onlyRole(MINTER_ROLE) returns (uint256[] memory) {
    require(publicIdHashes.length == cids.length, "Arrays length mismatch");
    require(publicIdHashes.length <= 50, "Batch too large"); // Gas limit safety
    
    uint256[] memory tokenIds = new uint256[](publicIdHashes.length);
    
    for (uint256 i = 0; i < publicIdHashes.length; i++) {
        require(publicIdToToken[publicIdHashes[i]] == 0, "Public ID already minted");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", cids[i])));
        isSoulbound[tokenId] = true;
        tokenToPublicId[tokenId] = publicIdHashes[i];
        publicIdToToken[publicIdHashes[i]] = tokenId;
        tokenIds[i] = tokenId;
        emit TagMinted(tokenId, publicIdHashes[i], to, cids[i]);
    }
    return tokenIds;
}
```

**Luego actualizar factory para usar batch minting:**
- Agrupar tags en batches de 10-50
- Mint en una sola transacción
- Reducir gas significativamente

---

## ✅ Resumen

### Estado Actual:
- ✅ Tags se mintean correctamente
- ❌ Metadata NO se actualiza después de attach
- ❌ Metadata NO incluye datos completos
- ❌ Batch minting NO implementado

### Lo que falta:
1. Mejorar `pinAnimalMetadata` para incluir ranch data
2. Agregar función `setCID` al wrapper
3. Actualizar `/api/attach-tag` para actualizar metadata
4. Implementar batch minting en contrato y factory

### Prioridad:
1. **ALTA:** Fix metadata update (Fix 1, 2, 3)
2. **MEDIA:** Batch minting (optimización)

---

**¿Quieres que implemente estos fixes ahora?**


