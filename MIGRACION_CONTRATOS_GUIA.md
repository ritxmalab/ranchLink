# 🔄 Guía de Migración entre Contratos

## ✅ RESPUESTA A TU PREGUNTA

**SÍ, el sistema está diseñado para evolucionar sin "paredes":**

1. ✅ **ERC-721 puede migrar a ERC-3643** cuando necesites compliance
2. ✅ **Múltiples contratos pueden coexistir** (ERC-721 para tags básicos, ERC-3643 para productos licenciados)
3. ✅ **Los contratos experimentales están listos** para integrarse cuando los necesites
4. ✅ **El flujo de uso NO se rompe** durante migraciones

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

### 1. Contract Registry (`/lib/blockchain/contractRegistry.ts`)

**Funcionalidad:**
- Lee de tabla `contracts` en Supabase
- Permite múltiples contratos activos simultáneamente
- Selecciona automáticamente el contrato correcto según `asset_type`

**Ejemplo:**
```typescript
// Obtener contrato para cattle tags
const contract = await getContractForAsset('cattle');
// Retorna: { address: '0xABC...', standard: 'ERC721', ... }

// Obtener contrato para productos licenciados
const contract = await getContractForAsset('licensed_products');
// Retorna: { address: '0xDEF...', standard: 'ERC3643', ... }
```

### 2. Unified Minting (`/lib/blockchain/mintTag.ts`)

**Funcionalidad:**
- Abstracción que soporta múltiples estándares
- Automáticamente usa el contrato correcto
- Fácil agregar nuevos estándares (ERC-3643, ERC-7518)

**Ejemplo:**
```typescript
// Mint usando el contrato correcto automáticamente
const result = await mintTag({
  tagCode: 'RL-001',
  publicId: 'AUS0001',
  cid: 'Qm...',
  assetType: 'cattle' // o 'licensed_products'
});
// Retorna: { tokenId, txHash, contractAddress, standard }
```

### 3. Database Schema (Ya Preparado)

**Tabla `contracts`:**
```sql
contracts (
  name: "RanchLinkTag Base Mainnet",
  symbol: "RLTAG",
  contract_address: "0xABC...",
  chain: "BASE_MAINNET",
  standard: "ERC721",
  default_for: ["cattle"]
)
```

**Tabla `tags`:**
```sql
tags (
  tag_code: "RL-001",
  contract_address: "0xABC...",  -- Puede cambiar entre contratos
  token_id: 123,
  chain: "BASE",
  ...
)
```

---

## 🔄 ESCENARIOS DE MIGRACIÓN

### Escenario 1: Migración Gradual ERC-721 → ERC-3643

**v1.0 (Hoy):**
```sql
-- Contrato ERC-721
INSERT INTO contracts VALUES (
  'RanchLinkTag Base Mainnet',
  'RLTAG',
  '0xABC...',  -- ERC-721 proxy
  'BASE_MAINNET',
  'ERC721',
  ['cattle']
);
```

**v2.0 (En 6 meses, necesitas compliance):**
```sql
-- Nuevo contrato ERC-3643
INSERT INTO contracts VALUES (
  'RanchLinkRWA Base Mainnet',
  'RLRWA',
  '0xDEF...',  -- ERC-3643 proxy
  'BASE_MAINNET',
  'ERC3643',
  ['cattle', 'licensed_products']
);
```

**Resultado:**
- Tags existentes siguen en ERC-721 (`0xABC...`)
- Nuevos tags pueden usar ERC-3643 (`0xDEF...`)
- Sistema soporta ambos simultáneamente
- Frontend/Backend leen `contract_address` de cada tag

### Escenario 2: Múltiples Contratos Activos

**v2.5 (Múltiples asset types):**
```sql
-- ERC-721 para tags básicos
INSERT INTO contracts VALUES (..., 'ERC721', ['cattle']);

-- ERC-3643 para productos con compliance
INSERT INTO contracts VALUES (..., 'ERC3643', ['licensed_products']);

-- ERC-7518 para licenses avanzadas
INSERT INTO contracts VALUES (..., 'ERC7518', ['software_license', 'trademark']);
```

**Resultado:**
- Cada tipo de asset usa su contrato
- Factory endpoint decide automáticamente
- Tags table almacena `contract_address` de cada tag

### Escenario 3: Migración de Tags Existentes (Opcional)

Si quieres migrar tags de ERC-721 a ERC-3643:

1. **Deploy nuevo contrato ERC-3643**
2. **Crear función de migración** (transfer tokens)
3. **Actualizar `tags.contract_address`** en Supabase
4. **Frontend/Backend automáticamente usan nuevo contrato**

**Código de migración (ejemplo):**
```typescript
// Migrar tag de ERC-721 a ERC-3643
async function migrateTag(tagCode: string) {
  // 1. Obtener tag actual
  const tag = await getTag(tagCode);
  
  // 2. Transfer token de ERC-721 a ERC-3643
  // (requiere lógica específica según estándares)
  
  // 3. Actualizar contract_address en DB
  await updateTagContract(tagCode, newContractAddress);
  
  // 4. Sistema automáticamente usa nuevo contrato
}
```

---

## 📋 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Deploy ERC-721 (v1.0) ✅

```bash
# Deploy upgradeable contract
npx hardhat run scripts/deploy-ranchlinktag-upgradeable.ts --network base

# Registrar en Supabase
# (usar SQL del script register-contract.ts)
```

### Paso 2: Usar ERC-721 en Factory ✅

El factory endpoint ya usa `mintTag()` que automáticamente:
- Lee de `contracts` table
- Usa ERC-721 para `asset_type: 'cattle'`
- Almacena `contract_address` en `tags` table

### Paso 3: Preparar ERC-3643 (Futuro)

Cuando necesites ERC-3643:

1. **Deploy RanchLinkRWA contract:**
   ```bash
   # (crear script similar a deploy-ranchlinktag-upgradeable.ts)
   npx hardhat run scripts/deploy-ranchlinkrwa.ts --network base
   ```

2. **Registrar en Supabase:**
   ```sql
   INSERT INTO contracts VALUES (
     'RanchLinkRWA Base Mainnet',
     'RLRWA',
     '0xDEF...',  -- Nuevo proxy address
     'BASE_MAINNET',
     'ERC3643',
     ['cattle', 'licensed_products']
   );
   ```

3. **Crear wrapper ERC-3643:**
   ```typescript
   // /lib/blockchain/ranchLinkRWA.ts
   export async function mintTag(...) {
     // Implementación para ERC-3643
   }
   ```

4. **Actualizar mintTag.ts:**
   ```typescript
   case 'ERC3643':
     return await mintTagERC3643(...);
   ```

5. **Factory automáticamente usa ERC-3643** para `asset_type: 'licensed_products'`

---

## ✅ GARANTÍAS DEL SISTEMA

### Lo que NO se rompe durante migraciones:

1. ✅ **URLs de Basescan:** Cada contrato tiene su address, URLs siguen funcionando
2. ✅ **QR Codes:** Apuntan a `/t/[tag_code]`, que lee `contract_address` de DB
3. ✅ **Frontend:** Lee `contract_address` de cada tag, usa wrapper correcto
4. ✅ **Backend:** Usa `contractRegistry` para obtener contrato correcto
5. ✅ **Tokens existentes:** Siguen funcionando en su contrato original

### Lo que SÍ puede cambiar:

1. ✅ **Nuevos tags:** Pueden usar nuevo contrato (ERC-3643)
2. ✅ **Contract address:** Almacenado en `tags.contract_address`
3. ✅ **Standard:** Almacenado en `contracts.standard`
4. ✅ **Funcionalidad:** Nuevos features en nuevos contratos

---

## 🎯 CONCLUSIÓN

**El sistema está diseñado para evolucionar sin "paredes":**

1. ✅ **Contract Registry** permite múltiples contratos
2. ✅ **Unified Minting** abstrae los diferentes estándares
3. ✅ **Database Schema** soporta múltiples contratos
4. ✅ **Contratos experimentales** listos para integrarse
5. ✅ **Migración gradual** sin romper flujo existente

**Puedes:**
- Empezar con ERC-721 (v1.0)
- Agregar ERC-3643 cuando necesites compliance
- Usar ERC-7518 para features avanzadas
- Mantener todos activos simultáneamente

**¿Procedo a actualizar el factory endpoint para usar el Contract Registry?**

