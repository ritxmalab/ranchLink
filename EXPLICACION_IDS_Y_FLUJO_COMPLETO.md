# 🔍 Explicación Completa: IDs y Flujo de Attach/Claim

## 🎯 Los Diferentes IDs y Para Qué Se Usan

### 1. **`tag_code`** (ej: `RL-001`)
- **Qué es**: Código del tag físico (impreso en el sticker)
- **Dónde se usa**: 
  - QR code apunta a: `/t/RL-001`
  - URL de la página del tag: `/t/RL-001`
  - Identificador humano-legible del tag
- **Es único**: No se repite

### 2. **`public_id`** (ej: `AUS0001`)
- **Qué es**: ID público del animal (no del tag)
- **Dónde se usa**:
  - URL de la tarjeta del animal: `/a/AUS0001`
  - Identificador humano-legible del animal
- **Se genera automáticamente**: Cuando creas un animal (AUS0001, AUS0002, etc.)
- **Es único**: No se repite

### 3. **`token_id`** (ej: `123`)
- **Qué es**: ID del NFT en la blockchain
- **Dónde se usa**:
  - Basescan link: `https://basescan.org/token/0xCE16...6242?a=123`
  - Para verificar que el tag está on-chain
- **Se obtiene del mint**: Cuando el NFT se mintea en blockchain
- **Es único**: No se repite (dentro del contract)

### 4. **`id`** (uuid interno)
- **Qué es**: ID interno de la base de datos (uuid)
- **Dónde se usa**: 
  - Foreign keys (`tags.animal_id` → `animals.id`)
  - Relaciones internas en la DB
- **No se muestra al usuario**: Es técnico

---

## 🔄 Flujo Completo v1.0

### Paso 1: Generar Tag (Factory)
```
1. Usuario llena formulario en /superadmin
2. Click "Generate & Mint Tags"
3. Se crea tag en DB:
   - tag_code: "RL-001"
   - token_id: NULL (aún no minted)
   - animal_id: NULL (aún no attached)
4. Se intenta mint NFT en blockchain
5. Si el mint funciona:
   - token_id: "123" (del NFT)
   - mint_tx_hash: "0xabc..."
6. Tag está listo para usar
```

### Paso 2: Escanear QR (Usuario Final)
```
1. Usuario escanea QR del sticker físico
2. QR apunta a: /t/RL-001
3. La app carga la página del tag
```

### Paso 3: Attach Tag a Animal
```
1. Si el tag NO está attached (animal_id = NULL):
   - Muestra formulario "Attach Tag to Animal"
   - Usuario llena:
     - Animal Name: "Gonzo"
     - Species: "Other"
     - Breed: "Human"
     - Birth Year: 1996
     - Sex: "Male"

2. Click "Attach Animal"
3. Backend (/api/attach-tag):
   a) Crea animal en DB:
      - public_id: "AUS0001" (generado automáticamente)
      - name: "Gonzo"
      - species: "Other"
      - breed: "Human"
      - birth_year: 1996
      - sex: "Male"
      - id: uuid (interno)
   
   b) Vincula tag al animal:
      - tags.animal_id = animals.id (uuid)
      - tags.status = "attached"
   
   c) Retorna public_id: "AUS0001"

4. Redirige a: /a/AUS0001 (tarjeta del animal)
```

### Paso 4: Ver Animal Card
```
1. Usuario ve /a/AUS0001
2. Muestra:
   - Animal: Gonzo
   - Animal ID: AUS0001
   - Tag Code: RL-001
   - Token ID: Pending (si mint no se completó)
   - On-chain Status: OFF-CHAIN (si token_id es NULL)
```

---

## ❓ Respuestas a Tus Preguntas

### "¿Cuál de todos estos es el id?"

**Depende del contexto:**

- **Para escanear QR**: Usas `tag_code` → `/t/RL-001`
- **Para ver animal**: Usas `public_id` → `/a/AUS0001`
- **Para Basescan**: Usas `token_id` → `?a=123`
- **Para relaciones DB**: Usas `id` (uuid interno)

### "¿Eso lo uso en la página de claim?"

**NO.** La página `/start` (claim) es **LEGACY** (v0.9).

**En v1.0:**
- **NO uses `/start`** para tags nuevos
- **Usa directamente `/t/[tag_code]`** (el QR ya apunta ahí)
- El QR del sticker apunta a `/t/RL-001`, no a `/start`

**Si alguien escanea el QR:**
1. Va directamente a `/t/RL-001`
2. Si el tag no está attached, ve el formulario
3. Llena la info del animal
4. Se crea el animal y se vincula al tag
5. Redirige a `/a/AUS0001`

### "Ya llené mi info como si fuera el animal"

**¡Correcto!** Eso es exactamente lo que debes hacer.

**La lógica es:**
- El tag físico (`RL-001`) es solo un identificador
- Cuando lo escaneas y llenas el formulario, estás creando el **animal** (Gonzo)
- El tag se **vincula** al animal (`tags.animal_id` → `animals.id`)
- El animal tiene su propio ID (`AUS0001`)

**Es como:**
- El tag es el "collar" físico
- El animal es la "vaca" (o lo que sea)
- El collar se pone en la vaca (attach)

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────┐
│ TAG FÍSICO (Sticker)                    │
│ QR Code: /t/RL-001                      │
│ Tag Code: RL-001                       │
└──────────────┬──────────────────────────┘
               │
               │ Escaneo QR
               ▼
┌─────────────────────────────────────────┐
│ PÁGINA DEL TAG: /t/RL-001               │
│ - Muestra info del tag                  │
│ - Si NO attached: muestra formulario    │
└──────────────┬──────────────────────────┘
               │
               │ Usuario llena formulario
               │ (Animal Name, Species, etc.)
               ▼
┌─────────────────────────────────────────┐
│ BACKEND: /api/attach-tag                │
│ 1. Crea animal:                          │
│    - public_id: "AUS0001"               │
│    - name: "Gonzo"                      │
│    - species: "Other"                   │
│ 2. Vincula tag:                          │
│    - tags.animal_id → animals.id        │
└──────────────┬──────────────────────────┘
               │
               │ Redirige
               ▼
┌─────────────────────────────────────────┐
│ TARJETA DEL ANIMAL: /a/AUS0001          │
│ - Muestra info del animal (Gonzo)        │
│ - Muestra info del tag (RL-001)          │
│ - Muestra Token ID (si está on-chain)   │
└─────────────────────────────────────────┘
```

---

## ✅ Conclusión

**No necesitas usar `/start` (claim)** - es legacy.

**Flujo v1.0:**
1. QR → `/t/RL-001` (página del tag)
2. Si no está attached → formulario
3. Llenas info del animal → se crea animal
4. Tag se vincula al animal
5. Redirige a `/a/AUS0001` (tarjeta del animal)

**Los IDs:**
- `tag_code` (RL-001) → Para el tag
- `public_id` (AUS0001) → Para el animal
- `token_id` (123) → Para el NFT en blockchain

**Todo está funcionando correctamente.** ✅

