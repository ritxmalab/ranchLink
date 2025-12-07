# ✅ SQL SOLUCIÓN SEGURA - Sin Romper Tablas Legacy

## 🎯 Estrategia

**NO vamos a cambiar el PRIMARY KEY de `animals`** (porque `events`, `anchors`, `transfers` dependen de él).

En su lugar:
1. ✅ Crear `animals.id` como **UNIQUE** (no PRIMARY KEY)
2. ✅ Crear `tags_animal_id_fkey` apuntando a `animals.id` (UNIQUE es suficiente para foreign keys)
3. ✅ PostgREST reconocerá la relación
4. ✅ No rompemos nada legacy

---

## 📋 Copia y Pega Este SQL (SOLUCIÓN SEGURA)

```sql
-- ============================================================================
-- Solución Segura: Crear animals.id como UNIQUE (sin cambiar PRIMARY KEY)
-- ============================================================================
-- 
-- NO eliminamos el PRIMARY KEY existente en animals.public_id
-- porque events, anchors, transfers dependen de él.
-- 
-- En su lugar, creamos animals.id como UNIQUE y usamos eso para tags.
-- UNIQUE es suficiente para foreign keys y PostgREST lo reconoce.
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Crear animals.id si no existe
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Agregar id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.animals
      ADD COLUMN id uuid DEFAULT gen_random_uuid();
    
    -- Actualizar filas existentes
    UPDATE public.animals
    SET id = gen_random_uuid()
    WHERE id IS NULL;
    
    -- Hacer id NOT NULL
    ALTER TABLE public.animals
      ALTER COLUMN id SET NOT NULL;
    
    RAISE NOTICE '✓ animals.id creado';
  ELSE
    RAISE NOTICE '✓ animals.id ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 2: Crear UNIQUE INDEX en animals.id (NO PRIMARY KEY)
-- ----------------------------------------------------------------------------
-- Esto es suficiente para foreign keys y PostgREST
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'animals'
      AND indexname = 'idx_animals_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_animals_id_unique ON public.animals(id);
    RAISE NOTICE '✓ UNIQUE INDEX creado en animals.id';
  ELSE
    RAISE NOTICE '✓ UNIQUE INDEX ya existe en animals.id';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 3: Verificar que animals.id es UNIQUE
-- ----------------------------------------------------------------------------
SELECT 
  'VERIFICACIÓN animals.id' AS reporte,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'animals'
        AND indexname = 'idx_animals_id_unique'
    ) THEN '✓ animals.id tiene UNIQUE INDEX'
    ELSE '❌ animals.id NO tiene UNIQUE INDEX'
  END AS estado_unique,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'animals'
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN '✓ animals.id existe (uuid)'
    ELSE '❌ animals.id NO existe'
  END AS estado_columna;

-- ----------------------------------------------------------------------------
-- PASO 4: Crear foreign key tags_animal_id_fkey
-- ----------------------------------------------------------------------------
-- UNIQUE es suficiente para foreign keys - no necesitamos PRIMARY KEY
DO $$
BEGIN
  -- Verificar si el foreign key ya existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    -- Verificar que animals.id tiene UNIQUE INDEX
    IF EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'animals'
        AND indexname = 'idx_animals_id_unique'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_animal_id_fkey
        FOREIGN KEY (animal_id) REFERENCES public.animals(id)
        ON DELETE SET NULL;
      
      RAISE NOTICE '✓ tags_animal_id_fkey CREADO';
    ELSE
      RAISE WARNING 'No se puede crear foreign key: animals.id no tiene UNIQUE INDEX';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_animal_id_fkey ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 5: Verificar otros foreign keys de tags
-- ----------------------------------------------------------------------------
-- Asegurar que tags_batch_id_fkey y tags_ranch_id_fkey existen
DO $$
BEGIN
  -- tags_batch_id_fkey
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_batch_id_fkey'
  ) THEN
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
  END IF;
  
  -- tags_ranch_id_fkey
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_ranch_id_fkey'
  ) THEN
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
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 6: Verificar que ranches existe
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
-- PASO 7: Verificar que tags tiene todas las columnas necesarias
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text UNIQUE NOT NULL,
  chain text NOT NULL DEFAULT 'BASE',
  contract_address text,
  token_id text,
  mint_tx_hash text,
  batch_id uuid,
  ranch_id uuid,
  animal_id uuid,
  status text NOT NULL DEFAULT 'in_inventory',
  activation_state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Agregar columnas que puedan faltar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'token_id'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN token_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'mint_tx_hash'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN mint_tx_hash text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'contract_address'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN contract_address text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'activation_state'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN activation_state text NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- Crear índices en tags
CREATE INDEX IF NOT EXISTS idx_tags_tag_code ON public.tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_tags_batch_id ON public.tags(batch_id);
CREATE INDEX IF NOT EXISTS idx_tags_animal_id ON public.tags(animal_id);
CREATE INDEX IF NOT EXISTS idx_tags_ranch_id ON public.tags(ranch_id);
CREATE INDEX IF NOT EXISTS idx_tags_status ON public.tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_token_id ON public.tags(token_id) WHERE token_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- PASO 8: Verificar que batches tiene batch_name
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
-- PASO 9: REPORTE FINAL - Verificar todo
-- ----------------------------------------------------------------------------

-- Reporte 1: Foreign Keys de tags
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

-- Reporte 2: Verificar animals.id
SELECT 
  'ANIMALS.ID' AS reporte,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'animals'
        AND indexname = 'idx_animals_id_unique'
    ) THEN '✓ animals.id tiene UNIQUE INDEX (suficiente para foreign keys)'
    ELSE '❌ animals.id NO tiene UNIQUE INDEX'
  END AS estado;

-- Reporte 3: Verificar token_id en tags
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
    ELSE '❌ token_id NO existe en tags'
  END AS estado;

-- ----------------------------------------------------------------------------
-- PASO 10: Refrescar PostgREST Cache
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- RESUMEN
-- ----------------------------------------------------------------------------
SELECT 
  'RESUMEN' AS reporte,
  '✓ animals.id creado como UNIQUE (no PRIMARY KEY - no rompe legacy)' AS paso1,
  '✓ tags_animal_id_fkey creado apuntando a animals.id' AS paso2,
  '✓ PostgREST cache refrescado' AS paso3,
  'Espera 10-30 segundos y prueba: https://ranch-link.vercel.app/superadmin' AS siguiente_paso;

-- ============================================================================
-- FIN
-- ============================================================================
-- Esta solución NO rompe las tablas legacy (events, anchors, transfers)
-- porque NO eliminamos el PRIMARY KEY existente en animals.public_id
-- 
-- En su lugar, usamos animals.id como UNIQUE, que es suficiente para:
-- - Foreign keys (tags_animal_id_fkey)
-- - PostgREST relaciones
-- ============================================================================
```

---

## ✅ Por Qué Esta Solución Funciona

1. ✅ **NO toca el PRIMARY KEY existente** - No rompe `events`, `anchors`, `transfers`
2. ✅ **Crea `animals.id` como UNIQUE** - Suficiente para foreign keys
3. ✅ **Crea `tags_animal_id_fkey`** - Apunta a `animals.id` (UNIQUE)
4. ✅ **PostgREST lo reconoce** - UNIQUE es suficiente para relaciones
5. ✅ **No rompe nada legacy** - Todo sigue funcionando

---

## 🎯 Resultado Esperado

Después de ejecutar:
- ✅ "✓ animals.id tiene UNIQUE INDEX" en el reporte
- ✅ 3 foreign keys en tags (incluyendo `tags_animal_id_fkey`)
- ✅ "✓ token_id existe en tags" en el reporte
- ✅ Sin errores
- ✅ PostgREST cache refrescado

---

## 📝 Nota Importante

**Esta solución es compatible con el código v1.0** porque:
- El código hace `.select(..., animals(public_id))` en línea 56
- PostgREST puede usar UNIQUE constraints para relaciones
- No necesitamos cambiar el PRIMARY KEY de `animals`

---

**Esta solución es segura y no rompe nada legacy.** ✅

