# 🔍 Explicación: "Attached" vs "On-Chain"

## 🎯 Diferencia Clave

Son dos conceptos diferentes:

### ✅ "Attached" (Adjuntado)
- **Significa**: El tag está vinculado a un animal en la base de datos
- **Cómo se determina**: `tags.animal_id` → `animals.id` (foreign key)
- **Es una relación en Supabase**: Base de datos solamente
- **No requiere blockchain**: Funciona sin mint

### ⛓️ "On-Chain" (En Blockchain)
- **Significa**: El tag tiene un NFT minted en la blockchain
- **Cómo se determina**: `tags.token_id` existe Y `tags.contract_address` existe
- **Es una transacción en Base Mainnet**: Requiere mint exitoso
- **Requiere blockchain**: Necesita que el mint se complete

---

## 📊 Estado Actual de RL-001

```
✅ Attached: SÍ
   - tags.animal_id → animals.id (Gonzo)
   - El tag está vinculado al animal en la DB

❌ On-Chain: NO
   - tags.token_id = NULL (el mint no se completó)
   - tags.contract_address = NULL o no válido
   - No hay NFT en blockchain todavía
```

---

## 🔍 Código que Determina On-Chain Status

```typescript
const getOnChainStatus = (tag: Tag): 'on-chain' | 'off-chain' | 'error' => {
  if (tag.token_id && tag.contract_address) {
    return 'on-chain'  // ✅ Tiene NFT en blockchain
  } else if (!tag.token_id) {
    return 'off-chain'  // ❌ No tiene NFT (mint pendiente o falló)
  } else {
    return 'error'     // ⚠️ Tiene token_id pero no contract_address (raro)
  }
}
```

**Por eso está "OFF-CHAIN"**: Porque `token_id` es `NULL` (el mint no se completó).

---

## 🎯 Flujo Completo Esperado

### Paso 1: Generar Tag
- Tag se crea en DB con `tag_code = "RL-001"`
- `token_id = NULL` (aún no minted)
- Estado: **OFF-CHAIN** ✅ Correcto

### Paso 2: Mint NFT
- Se ejecuta `mintTagUnified()`
- Se obtiene `token_id` de la blockchain
- Se actualiza `tags.token_id` y `tags.mint_tx_hash`
- Estado: **ON-CHAIN** ✅ Correcto

### Paso 3: Attach Animal (Opcional, puede ser antes o después)
- Se crea animal en DB
- Se actualiza `tags.animal_id` → `animals.id`
- Estado: **Attached** ✅ Correcto
- Estado on-chain: Depende de si el mint se completó

---

## 🔧 Por Qué RL-001 Está OFF-CHAIN

**El mint no se completó.** Posibles razones:

1. ❌ **Error en el proceso de mint** (revisa logs de Vercel)
2. ❌ **Falta de ETH en server wallet** (no hay gas para la transacción)
3. ❌ **Variables de entorno incorrectas** (RPC, contract address, etc.)
4. ❌ **MINTER_ROLE no concedido** (server wallet no tiene permisos)

---

## ✅ Solución

**Necesitas completar el mint para que el tag esté ON-CHAIN.**

Una vez que el mint se complete:
- `tags.token_id` se llenará con el ID real del NFT
- `tags.mint_tx_hash` se llenará con el hash de la transacción
- El estado cambiará automáticamente a **ON-CHAIN** ✅

**El tag puede estar "Attached" sin estar "On-Chain"** - son independientes.

---

## 📝 Resumen

| Concepto | Significa | Requiere |
|----------|-----------|----------|
| **Attached** | Tag vinculado a animal en DB | Solo base de datos |
| **On-Chain** | NFT minted en blockchain | Mint exitoso + token_id |

**RL-001 está "Attached" pero "OFF-CHAIN" porque el mint no se completó.** ✅

