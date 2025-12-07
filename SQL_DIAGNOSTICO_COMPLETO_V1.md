# 🔍 SQL DIAGNÓSTICO COMPLETO - Verifica TODO lo que el Código Necesita

## 🎯 Objetivo

Este SQL verifica **EXACTAMENTE** lo que el código v1.0 necesita, basado en el análisis del código fuente:

### Columnas que el código espera en `tags`:
- ✅ `id` (uuid PRIMARY KEY)
- ✅ `tag_code` (text UNIQUE NOT NULL)
- ✅ `token_id` (text) ← **CRÍTICO para blockchain**
- ✅ `mint_tx_hash` (text)
- ✅ `chain` (text)
- ✅ `contract_address` (text)
- ✅ `status` (text)
- ✅ `activation_state` (text)
- ✅ `animal_id` (uuid) ← **Para foreign key**
- ✅ `batch_id` (uuid)
- ✅ `ranch_id` (uuid)
- ✅ `created_at` (timestamptz)
- ✅ `updated_at` (timestamptz)

### Foreign Keys que el código necesita:
- ✅ `tags_animal_id_fkey` ← **CRÍTICO** (para `.select(..., animals(public_id))`)
- ✅ `tags_batch_id_fkey`
- ✅ `tags_ranch_id_fkey`

---

## 📋 Copia y Pega TODO Este SQL

```sql
-- ============================================================================
-- RanchLink v1.0 - Diagnóstico Completo y Fix
-- ============================================================================
-- 
-- Este SQL:
-- 1. Verifica TODAS las columnas que el código necesita
-- 2. Verifica TODOS los foreign keys
-- 3. Crea lo que falta
-- 4. Refresca PostgREST cache
-- 5. Muestra un reporte completo
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARTE 1: Verificar y Crear animals.id (PRIMARY KEY)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  animals_has_id boolean;
  animals_id_is_pk boolean;
BEGIN
  -- Verificar si animals.id existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) INTO animals_has_id;
  
  IF NOT animals_has_id THEN
    -- Crear animals.id
    ALTER TABLE public.animals
      ADD COLUMN id uuid DEFAULT gen_random_uuid();
    
    UPDATE public.animals
    SET id = gen_random_uuid()
    WHERE id IS NULL;
    
    ALTER TABLE public.animals
      ALTER COLUMN id SET NOT NULL;
    
    RAISE NOTICE '✓ animals.id CREADO';
  ELSE
    RAISE NOTICE '✓ animals.id ya existe';
  END IF;
  
  -- Verificar si animals.id es PRIMARY KEY
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'animals'
      AND tc.constraint_type = 'PRIMARY KEY'
      AND kcu.column_name = 'id'
  ) INTO animals_id_is_pk;
  
  IF NOT animals_id_is_pk THEN
    -- Eliminar PRIMARY KEY existente si está en public_id
    BEGIN
      ALTER TABLE public.animals DROP CONSTRAINT animals_pkey;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ALTER TABLE public.animals DROP CONSTRAINT animals_public_id_pkey;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END;
    
    -- Crear PRIMARY KEY en id
    ALTER TABLE public.animals
      ADD PRIMARY KEY (id);
    
    RAISE NOTICE '✓ animals.id PRIMARY KEY CREADO';
  ELSE
    RAISE NOTICE '✓ animals.id ya es PRIMARY KEY';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PARTE 2: Verificar y Crear tabla tags con TODAS las columnas necesarias
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text UNIQUE NOT NULL,
  chain text NOT NULL DEFAULT 'BASE',
  contract_address text,
  token_id text,  -- ← CRÍTICO: El código espera esto
  mint_tx_hash text,
  batch_id uuid,
  ranch_id uuid,
  animal_id uuid,
  status text NOT NULL DEFAULT 'in_inventory',
  activation_state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Agregar columnas que puedan faltar (idempotente)
DO $$
BEGIN
  -- Verificar y agregar token_id si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'token_id'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN token_id text;
    RAISE NOTICE '✓ token_id agregado a tags';
  END IF;
  
  -- Verificar y agregar mint_tx_hash si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'mint_tx_hash'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN mint_tx_hash text;
    RAISE NOTICE '✓ mint_tx_hash agregado a tags';
  END IF;
  
  -- Verificar y agregar contract_address si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'contract_address'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN contract_address text;
    RAISE NOTICE '✓ contract_address agregado a tags';
  END IF;
  
  -- Verificar y agregar activation_state si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'activation_state'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN activation_state text NOT NULL DEFAULT 'active';
    RAISE NOTICE '✓ activation_state agregado a tags';
  END IF;
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_tags_tag_code ON public.tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_tags_batch_id ON public.tags(batch_id);
CREATE INDEX IF NOT EXISTS idx_tags_animal_id ON public.tags(animal_id);
CREATE INDEX IF NOT EXISTS idx_tags_ranch_id ON public.tags(ranch_id);
CREATE INDEX IF NOT EXISTS idx_tags_status ON public.tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_token_id ON public.tags(token_id) WHERE token_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- PARTE 3: Verificar y Crear TODOS los Foreign Keys
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  fk_exists boolean;
BEGIN
  -- Foreign key: tags_animal_id_fkey (CRÍTICO)
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) INTO fk_exists;
  
  IF NOT fk_exists THEN
    -- Verificar que animals.id tiene PRIMARY KEY antes de crear FK
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'animals'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'id'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_animal_id_fkey
        FOREIGN KEY (animal_id) REFERENCES public.animals(id)
        ON DELETE SET NULL;
      
      RAISE NOTICE '✓ tags_animal_id_fkey CREADO';
    ELSE
      RAISE WARNING 'No se puede crear tags_animal_id_fkey: animals.id no tiene PRIMARY KEY';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_animal_id_fkey ya existe';
  END IF;
  
  -- Foreign key: tags_batch_id_fkey
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_batch_id_fkey'
  ) INTO fk_exists;
  
  IF NOT fk_exists THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'batches'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_batch_id_fkey
        FOREIGN KEY (batch_id) REFERENCES public.batches(id)
        ON DELETE SET NULL;
      
      RAISE NOTICE '✓ tags_batch_id_fkey CREADO';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_batch_id_fkey ya existe';
  END IF;
  
  -- Foreign key: tags_ranch_id_fkey
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_ranch_id_fkey'
  ) INTO fk_exists;
  
  IF NOT fk_exists THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'ranches'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_ranch_id_fkey
        FOREIGN KEY (ranch_id) REFERENCES public.ranches(id)
        ON DELETE SET NULL;
      
      RAISE NOTICE '✓ tags_ranch_id_fkey CREADO';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_ranch_id_fkey ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PARTE 4: Verificar que ranches existe
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ranches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- PARTE 5: Verificar que batches tiene batch_name
-- ----------------------------------------------------------------------------
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS batch_name text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS model text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS material text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS color text;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS chain text DEFAULT 'BASE';

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS count integer;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS target_ranch_id uuid;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ----------------------------------------------------------------------------
-- PARTE 6: REPORTE COMPLETO - Verificar TODO
-- ----------------------------------------------------------------------------

-- Reporte 1: Columnas de tags
SELECT 
  'COLUMNAS DE TAGS' AS reporte,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN ('id', 'tag_code', 'token_id', 'mint_tx_hash', 'chain', 
                         'contract_address', 'status', 'activation_state', 
                         'animal_id', 'batch_id', 'ranch_id', 'created_at', 'updated_at')
    THEN '✓ REQUERIDA'
    ELSE '⚠ OPCIONAL'
  END AS estado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tags'
ORDER BY 
  CASE 
    WHEN column_name = 'id' THEN 1
    WHEN column_name = 'tag_code' THEN 2
    WHEN column_name = 'token_id' THEN 3
    WHEN column_name = 'animal_id' THEN 4
    ELSE 99
  END,
  column_name;

-- Reporte 2: Foreign Keys de tags
SELECT 
  'FOREIGN KEYS DE TAGS' AS reporte,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN tc.constraint_name = 'tags_animal_id_fkey' THEN '✓ CRÍTICO'
    WHEN tc.constraint_name IN ('tags_batch_id_fkey', 'tags_ranch_id_fkey') THEN '✓ IMPORTANTE'
    ELSE '✓'
  END AS estado
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'tags'
ORDER BY 
  CASE 
    WHEN tc.constraint_name = 'tags_animal_id_fkey' THEN 1
    WHEN tc.constraint_name = 'tags_batch_id_fkey' THEN 2
    WHEN tc.constraint_name = 'tags_ranch_id_fkey' THEN 3
    ELSE 99
  END;

-- Reporte 3: Verificar animals.id tiene PRIMARY KEY
SELECT 
  'ANIMALS.ID PRIMARY KEY' AS reporte,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'animals'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'id'
    ) THEN '✓ animals.id tiene PRIMARY KEY'
    ELSE '❌ animals.id NO tiene PRIMARY KEY - CRÍTICO'
  END AS estado;

-- Reporte 4: Verificar que token_id existe en tags
SELECT 
  'TOKEN_ID EN TAGS' AS reporte,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tags'
        AND column_name = 'token_id'
        AND data_type = 'text'
    ) THEN '✓ token_id existe en tags (text)'
    ELSE '❌ token_id NO existe en tags - CRÍTICO'
  END AS estado;

-- ----------------------------------------------------------------------------
-- PARTE 7: REFRESCAR POSTGREST CACHE (CRÍTICO)
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- RESUMEN FINAL
-- ----------------------------------------------------------------------------
SELECT 
  'RESUMEN FINAL' AS reporte,
  'Ejecuta los reportes de arriba para verificar que todo está correcto' AS mensaje,
  'Espera 10-30 segundos después de NOTIFY pgrst' AS siguiente_paso,
  'Luego prueba: https://ranch-link.vercel.app/superadmin → Generate & Mint Tags' AS prueba;

-- ============================================================================
-- FIN
-- ============================================================================
```

---

## ✅ Qué Verifica Este SQL

1. ✅ **animals.id** existe y es PRIMARY KEY
2. ✅ **tags.token_id** existe (text) - CRÍTICO para blockchain
3. ✅ **tags.mint_tx_hash** existe
4. ✅ **tags.contract_address** existe
5. ✅ **tags.activation_state** existe
6. ✅ **TODAS las columnas** que el código necesita
7. ✅ **tags_animal_id_fkey** existe (el que falta)
8. ✅ **tags_batch_id_fkey** existe
9. ✅ **tags_ranch_id_fkey** existe
10. ✅ **batches.batch_name** existe
11. ✅ **PostgREST cache** refrescado

---

## 📊 Reportes que Muestra

Después de ejecutar, verás 4 reportes:
1. **Columnas de tags** - Lista todas con estado (✓ REQUERIDA / ⚠ OPCIONAL)
2. **Foreign Keys de tags** - Lista todas con estado (✓ CRÍTICO / ✓ IMPORTANTE)
3. **animals.id PRIMARY KEY** - Verifica que existe
4. **token_id en tags** - Verifica que existe

---

## 🎯 Resultado Esperado

Después de ejecutar:
- ✅ Todos los reportes muestran "✓"
- ✅ 3 foreign keys en tags (incluyendo `tags_animal_id_fkey`)
- ✅ `token_id` existe en tags
- ✅ PostgREST cache refrescado
- ✅ El error desaparece

---

**Este SQL verifica TODO lo que el código necesita, basado en análisis del código fuente.** ✅

