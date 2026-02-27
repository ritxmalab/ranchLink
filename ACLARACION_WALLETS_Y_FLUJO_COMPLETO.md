# 🔐 Aclaración: Wallets y Flujo Completo

## ⚠️ IMPORTANTE: Dos Direcciones Diferentes

### ✅ Wallet del Servidor (CORRECTO - La que estamos usando):
```
0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
```
- ✅ Esta es la que está en TODO el código
- ✅ Esta es la que tiene MINTER_ROLE en el contrato
- ✅ Esta es la que debe tener ETH para hacer mints
- ✅ Esta es la que está configurada en Vercel como `SERVER_WALLET_ADDRESS`

### ❓ Otra Dirección (NO la estamos usando):
```
0x680c555ef8D207CFD700434603aE1Af3e89F8d83
```
- ❌ Esta dirección NO aparece en el código
- ❌ Esta NO es la server wallet
- ⚠️ Si Base la marcó como "fraudulent activity", puede ser:
  - Una wallet personal tuya
  - Una wallet de prueba
  - Una wallet que usaste antes
  - **NO es la wallet del servidor que estamos usando**

---

## 🔍 Verificación de Seguridad

### 1. Verifica en el Código:
He buscado en TODO el código y **SOLO** encontramos `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83` como server wallet.

### 2. Verifica en Vercel:
Ve a Vercel → Settings → Environment Variables
- `SERVER_WALLET_ADDRESS` debe ser: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- Si ves la otra dirección (`0x680c...`), **cámbiala inmediatamente**

### 3. Verifica en Basescan:
- Server wallet (la correcta): https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
- Otra dirección: https://basescan.org/address/0x680c555ef8D207CFD700434603aE1Af3e89F8d83

---

## ✅ Flujo Completo: QR → Blockchain → Metadata → Traceabilidad

### Paso 1: Factory Genera Tag
1. Superadmin crea batch en `/superadmin`
2. Sistema crea tag en DB (`tags` table)
3. Sistema mintea NFT en Base Mainnet
4. NFT se mintea con `tokenURI` apuntando a IPFS
5. **Inicialmente:** Metadata básica (tag_code, public_id, batch info)

### Paso 2: Cliente Escanea QR y Attach Animal
1. Cliente escanea QR → `/t/[tag_code]`
2. Cliente llena formulario con datos del animal:
   - Nombre del animal
   - Especie, raza, sexo
   - Año de nacimiento
   - **Datos del rancho** (nombre, contacto)
3. Sistema crea animal en DB (`animals` table)
4. Sistema vincula tag → animal (`tags.animal_id = animals.id`)
5. **CRÍTICO:** Sistema actualiza metadata en IPFS con:
   - Datos del animal (nombre, especie, raza, etc.)
   - Datos del rancho (nombre, contacto)
   - Fotos del animal (si se suben)
   - Historial de eventos (vacunaciones, movimientos, etc.)
6. Sistema actualiza `tokenURI` del NFT con nuevo CID de IPFS

### Paso 3: Visualización y Traceabilidad
1. Cualquiera puede ver el NFT en Basescan
2. Basescan muestra el `tokenURI` (IPFS link)
3. IPFS contiene metadata completa con:
   - Información del animal
   - Información del rancho
   - Fotos
   - Historial de eventos
   - Links a la app (`/a/[public_id]`)

---

## 📊 Metadata Completa en IPFS

### Estructura Actual (básica):
```json
{
  "name": "Animal Name",
  "description": "RanchLink animal tag for Animal Name",
  "image": "photo_url",
  "attributes": [
    { "trait_type": "Breed", "value": "Angus" },
    { "trait_type": "Species", "value": "Cattle" },
    { "trait_type": "Public ID", "value": "AUS0001" }
  ],
  "external_url": "https://ranch-link.vercel.app/a/AUS0001"
}
```

### Estructura que DEBERÍA tener (completa):
```json
{
  "name": "Bessie - AUS0001",
  "description": "RanchLink RWA Tag - Full traceability record",
  "image": "ipfs://Qm.../animal-photo.jpg",
  "attributes": [
    { "trait_type": "Tag Code", "value": "RL-001" },
    { "trait_type": "Public ID", "value": "AUS0001" },
    { "trait_type": "Species", "value": "Cattle" },
    { "trait_type": "Breed", "value": "Angus" },
    { "trait_type": "Sex", "value": "Female" },
    { "trait_type": "Birth Year", "value": "2020" },
    { "trait_type": "Ranch Name", "value": "Oak Hill Ranch" },
    { "trait_type": "Ranch Contact", "value": "contact@oakhill.com" },
    { "trait_type": "Status", "value": "Active" }
  ],
  "properties": {
    "ranch": {
      "name": "Oak Hill Ranch",
      "contact_email": "contact@oakhill.com",
      "contact_phone": "+1-555-0123"
    },
    "animal": {
      "name": "Bessie",
      "species": "Cattle",
      "breed": "Angus",
      "sex": "Female",
      "birth_year": 2020
    },
    "events": [
      {
        "type": "vaccination",
        "date": "2024-01-15",
        "details": "Annual vaccination"
      }
    ]
  },
  "external_url": "https://ranch-link.vercel.app/a/AUS0001",
  "animation_url": "https://ranch-link.vercel.app/a/AUS0001?view=3d"
}
```

---

## 🔧 Optimización para Batches Grandes

### Problema Actual:
- Mint uno por uno = mucho gas
- Para 100 tags = 100 transacciones = caro

### Solución: Batch Minting

Necesitamos agregar una función `mintBatch` al contrato que:
- Mintea múltiples NFTs en una sola transacción
- Reduce gas significativamente
- Permite mint 10-50 tags por transacción

### Implementación Futura:

```solidity
function mintBatch(
    address to,
    bytes32[] calldata publicIdHashes,
    string[] calldata cids
) external onlyRole(MINTER_ROLE) returns (uint256[] memory) {
    require(publicIdHashes.length == cids.length, "Arrays length mismatch");
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

---

## ✅ Confirmación del Flujo

### Sí, estamos en la misma página:

1. ✅ **QR → Tag en Blockchain:**
   - Tag se mintea como NFT en Base
   - Token ID asignado
   - `tokenURI` apunta a IPFS

2. ✅ **Cliente Claim → Metadata Actualizada:**
   - Cuando cliente attach animal, metadata se actualiza en IPFS
   - `tokenURI` del NFT se actualiza con nuevo CID
   - Metadata incluye: animal info + ranch info + fotos + eventos

3. ✅ **Traceabilidad Visual:**
   - Basescan muestra NFT
   - NFT muestra `tokenURI` → IPFS
   - IPFS contiene metadata completa
   - Metadata tiene link a app (`/a/[public_id]`)
   - App muestra visualización completa con fotos, eventos, etc.

4. ⚠️ **Optimización Batches:**
   - Actualmente: uno por uno (caro para muchos)
   - Futuro: batch minting (10-50 por transacción)

---

## 🚨 Acción Inmediata: Verificar Wallets

1. **Verifica en Vercel:**
   - `SERVER_WALLET_ADDRESS` debe ser: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
   - Si es diferente, **cámbiala inmediatamente**

2. **Verifica la otra dirección:**
   - `0x680c555ef8D207CFD700434603aE1Af3e89F8d83`
   - ¿Es tuya? ¿La usaste antes?
   - Si Base la marcó como fraudulenta, puede ser spam o actividad sospechosa

3. **Si no reconoces la otra dirección:**
   - Puede ser una wallet que creaste antes
   - O puede ser spam/fraude (pero no afecta nuestro sistema)

---

## 📋 Resumen

- ✅ **Server wallet correcta:** `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- ❓ **Otra dirección:** `0x680c...` - NO la estamos usando
- ✅ **Flujo completo:** QR → Blockchain → Metadata → Traceabilidad
- ⚠️ **Optimización batches:** Necesita implementación futura

**¿Quieres que verifique si la otra dirección aparece en algún lugar del código o configuraciones?**


