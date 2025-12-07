# 🔗 RanchLink v1.0 - Links y Flujos Completos

**Base URL:** `https://ranch-link.vercel.app`  
**Local Development:** `http://localhost:3000`

---

## 📋 Páginas Públicas

### Home / Landing
- **URL:** `https://ranch-link.vercel.app/`
- **Descripción:** Página principal con hero section y "How It Works"
- **Links:**
  - Get Started → `/start`
  - View Models → `/models`
  - Browse Tags → `/market`

### Get Started / Claim Tag (Legacy Redirect)
- **URL:** `https://ranch-link.vercel.app/start`
- **Descripción:** Página de claim legacy que detecta `tag_code` y redirige a v1.0
- **Flujo:**
  - Si input es `RL-XXX` → Redirige a `/t/RL-XXX`
  - Si no, usa flujo legacy con `claim_token`

### Models
- **URL:** `https://ranch-link.vercel.app/models`
- **Descripción:** Catálogo de modelos de tags disponibles

### Marketplace
- **URL:** `https://ranch-link.vercel.app/market`
- **Descripción:** Marketplace de tags (futuro)

---

## 🏭 Admin y Factory

### Super Admin (Factory)
- **URL:** `https://ranch-link.vercel.app/superadmin`
- **Descripción:** Factory para generar batches de tags con pre-minting
- **Tabs:**
  - **🏭 Factory (QR Generator):** Crear batches, ver QR codes
  - **📊 Dashboard:** Stats de factory
  - **📦 Inventory:** Tabla de todos los tags

**Flujo Factory:**
1. Ir a `/superadmin` → Tab "Factory"
2. Configurar batch:
   - Batch Size (ej: 3)
   - Material (PETG, PLA, ABS, etc.)
   - Model (BASIC_QR, BOOTS_ON, etc.)
   - Chain (BASE - fijo en v1.0)
   - Color (ej: Mesquite)
   - Batch Name (ej: "Test Batch 1")
   - Batch Date
3. Click "🚀 Generate & Mint Tags"
4. Sistema:
   - Crea batch en Supabase
   - Crea tags en `tags` table
   - Mints NFTs en Base Mainnet (pre-mint)
   - Actualiza tags con `token_id` y `contract_address`
5. Resultado:
   - Mensaje de éxito con status on-chain
   - Tabla de batch results con:
     - Tag Code (RL-001, RL-002, etc.)
     - Token ID (#1, #2, etc. o "Pending")
     - Contract Address (con link a Basescan)
     - Chain (BASE)
     - Status (in_inventory, assigned, attached, retired)
     - On-Chain Status (✅ ON-CHAIN / ⚪ OFF-CHAIN / 🔴 ERROR)
   - QR stickers listos para imprimir con:
     - Tag ID (grande)
     - Token ID (prominente)
     - Animal ID (o "Not attached")
     - On-chain status badge

### QR Generator (Legacy)
- **URL:** `https://ranch-link.vercel.app/superadmin/qr-generator`
- **Descripción:** QR generator legacy (redirige a Factory tab)

---

## 🏷️ Tag y Animales (v1.0)

### Tag Scan (v1.0)
- **URL:** `https://ranch-link.vercel.app/t/[tag_code]`
- **Ejemplo:** `https://ranch-link.vercel.app/t/RL-001`
- **Descripción:** Página cuando se escanea el QR code del tag físico

**Flujo Tag Scan:**
1. Usuario escanea QR code → Llega a `/t/RL-001`
2. Sistema carga tag desde `/api/tags/RL-001`
3. **Si tag NO está attached a animal:**
   - Muestra información del tag:
     - Tag Code
     - Status
     - Activation State
     - Token ID (si existe)
     - Chain
     - On-Chain Status (✅ ON-CHAIN / ⚪ OFF-CHAIN)
     - Basescan link (si on-chain)
   - Muestra formulario "Attach Animal":
     - Animal Name *
     - Species * (Cattle, Sheep, Goat, etc.)
     - Breed (optional)
     - Birth Year (optional)
     - Sex (optional: Male, Female, Castrated)
   - Usuario llena formulario → Submit
   - Sistema:
     - POST `/api/attach-tag`
     - Crea animal en `animals` table
     - Genera `public_id` (AUS0001, AUS0002, etc.)
     - Actualiza tag: `animal_id`, `status = 'attached'`
   - Redirige a `/a/[public_id]`
4. **Si tag YA está attached:**
   - Muestra resumen del animal
   - Botón "View full animal record" → `/a/[public_id]`
   - O redirige automáticamente

### Animal Card (v1.0 - Dynamic Route)
- **URL:** `https://ranch-link.vercel.app/a/[public_id]`
- **Ejemplo:** `https://ranch-link.vercel.app/a/AUS0001`
- **Descripción:** Página pública del animal con información blockchain

**Contenido:**
- **Animal Information:**
  - Name (grande)
  - Public ID (AUS0001)
  - Species, Breed, Sex, Age, Status
- **Blockchain & Tag:**
  - Tag Code (RL-001)
  - Tag Status
  - Token ID (#1)
  - On-Chain Status (✅ ON-CHAIN / ⚪ OFF-CHAIN)
  - Chain (BASE)
  - Basescan Link (botón prominente)
- **Ranch Information:**
  - Ranch Name
  - Contact Email
- **Navigation:**
  - "← Back to Dashboard"
  - "View Tag Details" → `/t/[tag_code]`

### Animal Card (Legacy - Query Param)
- **URL:** `https://ranch-link.vercel.app/a?id=[public_id]`
- **Ejemplo:** `https://ranch-link.vercel.app/a?id=AUS0001`
- **Descripción:** Versión legacy con query param (funciona, pero mejor usar `/a/[public_id]`)

---

## 📊 Dashboard

### My Ranch Dashboard
- **URL:** `https://ranch-link.vercel.app/dashboard`
- **Descripción:** Dashboard ejecutivo para gestión de rancho

**Contenido:**

1. **High-Level Stats:**
   - Total Animals
   - Active Animals
   - Total Tags
   - On-Chain Tags (con count de off-chain)

2. **Tags Status Breakdown:**
   - In Inventory
   - Assigned
   - Attached
   - Retired

3. **View Tabs:**
   - **Animals View:**
     - Cards de cada animal
     - Cada card muestra:
       - Animal name y public_id
       - Species, breed, sex, status
       - Tag code (si attached)
       - Token ID (si existe)
       - On-Chain Status badge
       - Basescan link (si on-chain)
     - Click en card → `/a/[public_id]`
   
   - **Tags Inventory:**
     - Tabla completa de todos los tags
     - Columnas:
       - Tag Code
       - Token ID
       - Chain
       - Contract Address (con Basescan link)
       - Status
       - Activation
       - Attached Animal (link si attached)
       - On-Chain Status
       - Actions (View tag, Basescan)
     - **Filtros:**
       - Status (all, in_inventory, assigned, attached, retired)
       - Activation (all, active, inactive)
       - On-Chain Status (all, on-chain, off-chain, error)

---

## 📦 Retail Kits

### Claim Kit
- **URL:** `https://ranch-link.vercel.app/claim-kit`
- **Descripción:** Página para reclamar kits retail

**Flujo:**
1. Usuario recibe kit con `kit_code` (ej: RLKIT-8F3K72)
2. Va a `/claim-kit`
3. Llena formulario:
   - Kit Code * (RLKIT-XXXXX)
   - Ranch Name *
   - Contact Email *
   - Phone (optional)
4. Submit → POST `/api/claim-kit`
5. Sistema:
   - Valida `kit_code`
   - Crea ranch en `ranches` table
   - Actualiza `kits.claimed_ranch_id`
   - Actualiza todos los tags en `kit_tags` con `ranch_id`
6. Success → Muestra mensaje y redirige a `/dashboard`

---

## 🔌 API Endpoints

### Health Check
- **URL:** `https://ranch-link.vercel.app/api/health`
- **Method:** GET
- **Descripción:** Verifica que el sistema esté funcionando

### Factory Batches
- **URL:** `https://ranch-link.vercel.app/api/factory/batches`
- **Method:** POST
- **Body:**
  ```json
  {
    "batchName": "Test Batch 1",
    "batchSize": 3,
    "model": "BASIC_QR",
    "material": "PETG",
    "color": "Mesquite",
    "chain": "BASE",
    "targetRanchId": null,
    "kitMode": false,
    "kitSize": null
  }
  ```
- **Response:**
  ```json
  {
    "batch": { "id": "...", "name": "..." },
    "tags": [
      {
        "id": "...",
        "tag_code": "RL-001",
        "token_id": "1",
        "mint_tx_hash": "0x...",
        "contract_address": "0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242",
        "chain": "BASE",
        "status": "in_inventory",
        "activation_state": "active",
        "base_qr_url": "https://ranch-link.vercel.app/t/RL-001"
      },
      ...
    ]
  }
  ```

### Get Tag by Code
- **URL:** `https://ranch-link.vercel.app/api/tags/[tag_code]`
- **Ejemplo:** `https://ranch-link.vercel.app/api/tags/RL-001`
- **Method:** GET
- **Response:**
  ```json
  {
    "tag": {
      "id": "...",
      "tag_code": "RL-001",
      "token_id": "1",
      "contract_address": "0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242",
      "chain": "BASE",
      "status": "in_inventory",
      "activation_state": "active",
      "animal_id": null,
      "animals": null,
      "ranches": { "id": "...", "name": "..." }
    }
  }
  ```

### Attach Tag to Animal
- **URL:** `https://ranch-link.vercel.app/api/attach-tag`
- **Method:** POST
- **Body:**
  ```json
  {
    "tagCode": "RL-001",
    "animalData": {
      "name": "Bessie",
      "species": "Cattle",
      "breed": "Angus",
      "birth_year": 2023,
      "sex": "Female"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "public_id": "AUS0001",
    "tag_code": "RL-001",
    "message": "Tag attached successfully"
  }
  ```

### Get Animal by Public ID
- **URL:** `https://ranch-link.vercel.app/api/animals/[public_id]`
- **Ejemplo:** `https://ranch-link.vercel.app/api/animals/AUS0001`
- **Method:** GET
- **Response:**
  ```json
  {
    "animal": {
      "id": "...",
      "public_id": "AUS0001",
      "name": "Bessie",
      "species": "Cattle",
      "breed": "Angus",
      "sex": "Female",
      "birth_year": 2023,
      "status": "active",
      "tags": [
        {
          "tag_code": "RL-001",
          "token_id": "1",
          "contract_address": "0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242",
          "chain": "BASE",
          "status": "attached",
          "activation_state": "active"
        }
      ],
      "ranches": {
        "id": "...",
        "name": "My Ranch",
        "contact_email": "ranch@example.com"
      }
    },
    "events": [],
    "anchors": []
  }
  ```

### Dashboard Animals
- **URL:** `https://ranch-link.vercel.app/api/dashboard/animals`
- **Method:** GET
- **Response:**
  ```json
  {
    "animals": [
      {
        "id": "...",
        "public_id": "AUS0001",
        "name": "Bessie",
        "species": "Cattle",
        "breed": "Angus",
        "status": "active",
        "tags": [...]
      },
      ...
    ]
  }
  ```

### Dashboard Tags
- **URL:** `https://ranch-link.vercel.app/api/dashboard/tags`
- **Method:** GET
- **Response:**
  ```json
  {
    "tags": [
      {
        "tag_code": "RL-001",
        "token_id": "1",
        "chain": "BASE",
        "contract_address": "0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242",
        "status": "attached",
        "activation_state": "active",
        "animal_id": "...",
        "animals": {
          "public_id": "AUS0001",
          "name": "Bessie"
        }
      },
      ...
    ]
  }
  ```

### Claim Kit
- **URL:** `https://ranch-link.vercel.app/api/claim-kit`
- **Method:** POST
- **Body:**
  ```json
  {
    "kitCode": "RLKIT-8F3K72",
    "ranch": {
      "name": "My Ranch",
      "contact_email": "ranch@example.com",
      "phone": "+1 (555) 123-4567"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "ranch": { "id": "...", "name": "My Ranch" },
    "tagsAssigned": 10,
    "message": "Kit claimed successfully"
  }
  ```

---

## 🔗 Blockchain Links

### Contract on Basescan
- **URL:** `https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- **Descripción:** Contract RanchLinkTagUpgradeable (PROXY) en Base Mainnet

### Token on Basescan
- **URL:** `https://basescan.org/token/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242?a=[token_id]`
- **Ejemplo:** `https://basescan.org/token/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242?a=1`
- **Descripción:** Token individual en Basescan

### Server Wallet
- **URL:** `https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- **Descripción:** Wallet del servidor que posee los NFTs (custodial model)

---

## 🔄 Flujos Completos

### Flujo 1: Factory → Tags → QR → Print
```
1. Admin → /superadmin
2. Configurar batch (size, material, model, color, name)
3. Click "Generate & Mint Tags"
4. Sistema:
   - Crea batch en Supabase
   - Crea tags en tags table
   - Mints NFTs en Base Mainnet
   - Actualiza tags con token_id y contract_address
5. Resultado:
   - Tabla de batch results
   - QR stickers con tag_code + token_id
6. Print stickers
```

### Flujo 2: QR Scan → Attach → Animal Card
```
1. Usuario escanea QR → /t/RL-001
2. Sistema carga tag info
3. Si tag no attached:
   - Muestra formulario "Attach Animal"
   - Usuario llena: name, species, breed, etc.
   - Submit → POST /api/attach-tag
   - Sistema crea animal, actualiza tag
   - Redirect → /a/AUS0001
4. Si tag ya attached:
   - Muestra resumen animal
   - Link → /a/[public_id]
```

### Flujo 3: Animal Card → Dashboard
```
1. Usuario en /a/AUS0001
2. Ve:
   - Animal info
   - Tag info
   - Blockchain info (token_id, Basescan link)
3. Click "Back to Dashboard" → /dashboard
4. Ve:
   - Stats
   - Animals view (cards)
   - Inventory view (table)
```

### Flujo 4: Dashboard Overview
```
1. Usuario → /dashboard
2. Ve high-level stats:
   - Total Animals
   - Active Animals
   - Total Tags
   - On-Chain Tags
3. Ve tags breakdown:
   - In Inventory
   - Assigned
   - Attached
   - Retired
4. Animals View:
   - Cards con animal + tag + blockchain
   - Click card → /a/[public_id]
5. Inventory View:
   - Tabla con todos los tags
   - Filtros (status, activation, on-chain)
   - Links a /t/[tag_code] y Basescan
```

### Flujo 5: Claim Kit
```
1. Usuario recibe kit con kit_code
2. Va a /claim-kit
3. Llena formulario:
   - Kit Code
   - Ranch Name
   - Contact Email
   - Phone (optional)
4. Submit → POST /api/claim-kit
5. Sistema:
   - Valida kit_code
   - Crea ranch
   - Asigna tags a ranch
6. Success → Redirect a /dashboard
```

---

## 🎯 Quick Links Reference

### Production (Vercel):
- Home: `https://ranch-link.vercel.app/`
- Factory: `https://ranch-link.vercel.app/superadmin`
- Dashboard: `https://ranch-link.vercel.app/dashboard`
- Claim Tag: `https://ranch-link.vercel.app/start`
- Claim Kit: `https://ranch-link.vercel.app/claim-kit`

### Example Tag:
- Tag Scan: `https://ranch-link.vercel.app/t/RL-001`
- API: `https://ranch-link.vercel.app/api/tags/RL-001`

### Example Animal:
- Animal Card: `https://ranch-link.vercel.app/a/AUS0001`
- API: `https://ranch-link.vercel.app/api/animals/AUS0001`

### Blockchain:
- Contract: `https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- Token #1: `https://basescan.org/token/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242?a=1`
- Server Wallet: `https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`

---

## ✅ Verificación de Flujos

### Para verificar que todo funciona:

1. **Factory:**
   - Ir a `/superadmin`
   - Crear batch de 3 tags
   - Verificar que aparecen QR codes con token_id
   - Verificar tabla de batch results

2. **Tag Scan:**
   - Ir a `/t/RL-001` (o cualquier tag_code generado)
   - Verificar que muestra info del tag
   - Verificar on-chain status
   - Si no attached, verificar formulario de attach

3. **Animal Card:**
   - Después de attach, ir a `/a/AUS0001`
   - Verificar que muestra animal + blockchain info
   - Verificar Basescan link

4. **Dashboard:**
   - Ir a `/dashboard`
   - Verificar stats
   - Verificar animals view
   - Verificar inventory view con filtros

---

**Todos los links y flujos están documentados y listos para usar.** 🚀

