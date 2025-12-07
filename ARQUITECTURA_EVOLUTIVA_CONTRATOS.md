# 🏗️ Arquitectura Evolutiva - Migración entre Contratos

## 🎯 OBJETIVO

Diseñar un sistema que permita:
1. ✅ Empezar con ERC-721 (RanchLinkTag) en v1.0
2. ✅ Migrar a ERC-3643 (RWA compliance) cuando sea necesario
3. ✅ Usar ERC-7518 (DyCIST) para features avanzadas
4. ✅ Mantener compatibilidad total durante migraciones
5. ✅ Sin "paredes" que bloqueen evolución

---

## 🏛️ ARQUITECTURA PROPUESTA

### Capa 1: Contract Registry (Abstracción)

```
┌─────────────────────────────────────────┐
│  CONTRACT REGISTRY (Nuevo)              │
│  - Mantiene registro de todos los       │
│    contratos activos                     │
│  - Define qué contrato usar por tipo    │
│  - Permite migración sin romper flujo   │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ ERC-721     │   │ ERC-3643    │
│ (v1.0)      │   │ (v2.0)      │
│             │   │             │
│ RanchLinkTag│   │ RanchLinkRWA│
└─────────────┘   └─────────────┘
```

### Capa 2: Database Schema (Ya Preparado)

La tabla `contracts` ya existe y soporta múltiples contratos:

```sql
contracts (
  id uuid,
  name text,                    -- "RanchLinkTag Base Mainnet"
  symbol text,                  -- "RLTAG"
  contract_address text,        -- Dirección del contrato
  chain text,                   -- "BASE_MAINNET"
  standard text,                 -- "ERC721", "ERC3643", "ERC7518"
  default_for text,             -- "cattle", "land", "equipment"
  created_at timestamptz
)
```

La tabla `tags` ya soporta múltiples contratos:

```sql
tags (
  id uuid,
  tag_code text,
  contract_address text,        -- Puede cambiar entre contratos
  chain text,                   -- Puede cambiar entre chains
  token_id bigint,              -- Token ID en el contrato actual
  ...
)
```

---

## 🔄 ESTRATEGIA DE MIGRACIÓN

### Escenario 1: Migración de ERC-721 a ERC-3643

**v1.0 (Hoy):**
- Contrato: `RanchLinkTag` (ERC-721)
- Address: `0xABC...` (proxy)
- Tags minted: 100 tags

**v2.0 (En 6 meses, necesitas compliance):**
- Nuevo contrato: `RanchLinkRWA` (ERC-3643)
- Address: `0xDEF...` (nuevo proxy)
- Migración: Los 100 tags existentes pueden:
  - **Opción A:** Quedarse en ERC-721, nuevos tags en ERC-3643
  - **Opción B:** Migrar todos a ERC-3643 (requiere transfer)

**Cómo funciona:**
1. Deploy `RanchLinkRWA` (ERC-3643)
2. Registrar en tabla `contracts`
3. Actualizar `tags.contract_address` para nuevos tags
4. Frontend/Backend leen `contract_address` de cada tag
5. Sistema soporta ambos contratos simultáneamente

### Escenario 2: Múltiples Contratos Activos

**v2.5 (Múltiples asset types):**
- `RanchLinkTag` (ERC-721) → Cattle tags
- `RanchLinkRWA` (ERC-3643) → Licensed products
- `RanchLinkLicense` (ERC-7518) → Software licenses

**Cómo funciona:**
1. Cada tipo de asset usa su contrato
2. Tabla `contracts` define qué contrato usar
3. Factory endpoint decide qué contrato usar según `asset_type`
4. Tags table almacena `contract_address` de cada tag

---

## 📋 IMPLEMENTACIÓN TÉCNICA

### 1. Contract Registry Module

Crear `/lib/blockchain/contractRegistry.ts`:

```typescript
interface ContractConfig {
  address: string;
  standard: 'ERC721' | 'ERC3643' | 'ERC7518';
  chain: string;
  defaultFor: string[];
}

// Registry de contratos activos
const CONTRACT_REGISTRY: Record<string, ContractConfig> = {
  'cattle_v1': {
    address: process.env.RANCHLINKTAG_ADDRESS, // ERC-721
    standard: 'ERC721',
    chain: 'BASE',
    defaultFor: ['cattle']
  },
  'cattle_v2': {
    address: process.env.RANCHLINKRWA_ADDRESS, // ERC-3643 (futuro)
    standard: 'ERC3643',
    chain: 'BASE',
    defaultFor: ['cattle', 'licensed_products']
  }
};

// Función para obtener contrato según asset type
export function getContractForAsset(assetType: string): ContractConfig {
  // Lógica para decidir qué contrato usar
  // Puede leer de tabla `contracts` en Supabase
}
```

### 2. Factory Endpoint Actualizado

`/api/factory/batches` puede decidir qué contrato usar:

```typescript
// Leer de tabla contracts qué contrato usar
const contract = await getContractForAsset('cattle');

if (contract.standard === 'ERC721') {
  await mintTagERC721(...);
} else if (contract.standard === 'ERC3643') {
  await mintTagERC3643(...);
}
```

### 3. Tags Table como Source of Truth

Cada tag almacena su `contract_address`:

```sql
tags (
  tag_code: "RL-001",
  contract_address: "0xABC...",  -- Puede ser ERC-721 o ERC-3643
  token_id: 123,
  chain: "BASE",
  ...
)
```

Frontend/Backend leen `contract_address` de cada tag y usan el wrapper correcto.

---

## 🔄 FLUJO DE MIGRACIÓN SIN ROMPER

### Migración Gradual (Recomendado):

**Fase 1: Dual Support**
- Nuevos tags → ERC-3643
- Tags existentes → Siguen en ERC-721
- Sistema soporta ambos

**Fase 2: Migración Opcional**
- Rancheros pueden migrar tags a ERC-3643 si quieren
- O mantenerlos en ERC-721
- Ambos funcionan

**Fase 3: Deprecación (Opcional)**
- Si todos migran, deprecar ERC-721
- O mantener ambos para compatibilidad

---

## 📊 TABLA DE CONTRATOS (Estructura)

```sql
-- Ejemplo de registros en tabla contracts:

-- v1.0 (ERC-721)
INSERT INTO contracts VALUES (
  'RanchLinkTag Base Mainnet',
  'RLTAG',
  '0xABC...',  -- Proxy address
  'BASE_MAINNET',
  'ERC721',
  'cattle'
);

-- v2.0 (ERC-3643) - Futuro
INSERT INTO contracts VALUES (
  'RanchLinkRWA Base Mainnet',
  'RLRWA',
  '0xDEF...',  -- Nuevo proxy address
  'BASE_MAINNET',
  'ERC3643',
  'cattle,licensed_products'
);
```

---

## 🎯 RESPUESTA DIRECTA

### ✅ SÍ, puedes transformar/reemplazar contratos:

1. **ERC-721 → ERC-3643:**
   - Deploy nuevo contrato ERC-3643
   - Registrar en tabla `contracts`
   - Nuevos tags usan ERC-3643
   - Tags existentes pueden migrar o quedarse

2. **Múltiples Contratos Simultáneos:**
   - ERC-721 para cattle tags básicos
   - ERC-3643 para productos con compliance
   - ERC-7518 para licenses avanzadas
   - Sistema decide según `asset_type`

3. **Sin Romper Flujo:**
   - Frontend/Backend leen `contract_address` de cada tag
   - Usan wrapper correcto según `standard`
   - URLs de Basescan funcionan (cada contrato tiene su address)
   - QR codes siguen funcionando (apuntan a `/t/[tag_code]`)

---

## 🚀 PRÓXIMOS PASOS

1. **Crear Contract Registry module**
2. **Actualizar Factory endpoint** para soportar múltiples contratos
3. **Crear wrappers** para ERC-3643 y ERC-7518 (cuando los uses)
4. **Deploy ERC-721 primero** (v1.0)
5. **Preparar migración** para cuando necesites ERC-3643

**¿Procedo a crear el Contract Registry y actualizar el factory para soportar múltiples contratos?**

