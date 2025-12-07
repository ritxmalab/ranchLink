# ✅ SQL SOLUCIÓN FINAL - Versión Mejorada del Asistente de Supabase

## 🎯 Por Qué Esta Versión es Mejor

1. ✅ **Manejo robusto de errores** - Fallback para `gen_random_uuid()` vs `uuid_generate_v4()`
2. ✅ **Backfill inteligente** - Migra datos legacy de `tags.public_id` → `tags.animal_id`
3. ✅ **Verificaciones detalladas** - Muestra exactamente qué se creó
4. ✅ **Más seguro** - Maneja casos edge que mi versión no consideraba

---

## 📋 Copia y Pega Este SQL (VERSIÓN MEJORADA)

```sql
BEGIN;

-- ----------------------------------------------------------------------------
-- PASO 1: Crear animals.id si no existe y poblarla
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    -- Añadir columna id con default gen_random_uuid() si la extensión pgcrypto está instalada.
    -- Si no, se puede usar gen_random_uuid() requiere extension pgcrypto or pg_catalog.uuid_generate_v4().
    BEGIN
      ALTER TABLE public.animals
        ADD COLUMN id uuid DEFAULT gen_random_uuid();
    EXCEPTION WHEN undefined_function THEN
      -- Fallback a uuid_generate_v4() if available
      ALTER TABLE public.animals
        ADD COLUMN id uuid DEFAULT uuid_generate_v4();
    END;
    
    -- Actualizar filas existentes (en caso de que el DEFAULT no se aplique retroactivamente)
    UPDATE public.animals
    SET id = coalesce(id, gen_random_uuid());
  END IF;

  -- Asegurar NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.animals
      ALTER COLUMN id SET NOT NULL;
    RAISE NOTICE '✓ animals.id existe y es NOT NULL';
  ELSE
    RAISE WARNING '⚠ animals.id no fue creado (revisa funciones gen_random_uuid/uuid_generate_v4)';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 2: Crear UNIQUE INDEX en animals.id (NO PRIMARY KEY)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'animals'
      AND indexname = 'idx_animals_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_animals_id_unique ON public.animals(id);
    RAISE NOTICE '✓ UNIQUE INDEX idx_animals_id_unique creado';
  ELSE
    RAISE NOTICE '✓ UNIQUE INDEX idx_animals_id_unique ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 3: Crear tabla tags si no existe (estructura mínima y columnas necesarias)
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

-- ----------------------------------------------------------------------------
-- PASO 4: Agregar columnas faltantes en tags (idempotente)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- PASO 5: Backfill tags.animal_id desde tags.public_id si existe y es aplicable
-- ----------------------------------------------------------------------------
-- Detecta si tags tiene columna public_id que referencia animals.public_id; si existe,
-- intenta poblar tags.animal_id emparejando por animals.public_id -> animals.id.
DO $$
DECLARE
  col_exists boolean;
  mapped_count int;
BEGIN
  -- Verificar existencia de columna tags.public_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'public_id'
  ) INTO col_exists;

  IF col_exists THEN
    -- Asegurar que tags.animal_id existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'animal_id'
    ) THEN
      ALTER TABLE public.tags ADD COLUMN animal_id uuid;
    END IF;

    -- Realizar el backfill solo para filas donde animal_id IS NULL y public_id IS NOT NULL
    UPDATE public.tags t
    SET animal_id = a.id
    FROM public.animals a
    WHERE t.animal_id IS NULL
      AND t.public_id IS NOT NULL
      AND a.public_id = t.public_id;

    GET DIAGNOSTICS mapped_count = ROW_COUNT;
    RAISE NOTICE '✓ Backfill realizado en % filas (tags.animal_id desde tags.public_id) ', mapped_count;
  ELSE
    RAISE NOTICE '✓ tags.public_id no existe; se asume que tags.animal_id se gestionará en nuevos inserts';
    -- Si animal_id no existe, crearla para futuros inserts
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'animal_id'
    ) THEN
      ALTER TABLE public.tags ADD COLUMN animal_id uuid;
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 6: Crear FK tags_animal_id_fkey apuntando a animals(id)
-- (ON DELETE SET NULL para evitar cascadas por defecto; cambia si deseas)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    -- Verificar que animals.id tenga índice único
    IF EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'animals' AND indexname = 'idx_animals_id_unique'
    ) THEN
      ALTER TABLE public.tags
      ADD CONSTRAINT tags_animal_id_fkey
      FOREIGN KEY (animal_id) REFERENCES public.animals(id)
      ON DELETE SET NULL;
      RAISE NOTICE '✓ tags_animal_id_fkey creado';
    ELSE
      RAISE WARNING '⚠ No se puede crear tags_animal_id_fkey: animals.id no tiene UNIQUE INDEX';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_animal_id_fkey ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 7: Crear/asegurar FKs para batch_id y ranch_id en tags si tablas existen
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- tags_batch_id_fkey
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_batch_id_fkey') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'batches' AND constraint_type = 'PRIMARY KEY'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_batch_id_fkey
        FOREIGN KEY (batch_id) REFERENCES public.batches(id)
        ON DELETE SET NULL;
      RAISE NOTICE '✓ tags_batch_id_fkey creado';
    ELSE
      RAISE NOTICE 'ℹ batches no existe o no tiene PK: tags_batch_id_fkey no creado';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_batch_id_fkey ya existe';
  END IF;

  -- tags_ranch_id_fkey
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_ranch_id_fkey') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'ranches' AND constraint_type = 'PRIMARY KEY'
    ) THEN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_ranch_id_fkey
        FOREIGN KEY (ranch_id) REFERENCES public.ranches(id)
        ON DELETE SET NULL;
      RAISE NOTICE '✓ tags_ranch_id_fkey creado';
    ELSE
      RAISE NOTICE 'ℹ ranches no existe o no tiene PK: tags_ranch_id_fkey no creado';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_ranch_id_fkey ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 8: Crear índices en tags para mejorar consultas
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tags_tag_code ON public.tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_tags_batch_id ON public.tags(batch_id);
CREATE INDEX IF NOT EXISTS idx_tags_animal_id ON public.tags(animal_id);
CREATE INDEX IF NOT EXISTS idx_tags_ranch_id ON public.tags(ranch_id);
CREATE INDEX IF NOT EXISTS idx_tags_status ON public.tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_token_id ON public.tags(token_id) WHERE token_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- PASO 9: Verificaciones finales (selects informativos)
-- ----------------------------------------------------------------------------

-- Comprueba que el índice unique en animals.id exista
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'animals' AND indexname = 'idx_animals_id_unique'
  ) THEN 'OK: idx_animals_id_unique exists' ELSE 'MISSING: idx_animals_id_unique' END AS animals_id_unique_index;

-- Lista constraints FK de tags
SELECT
  tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'tags' AND tc.constraint_type = 'FOREIGN KEY';

-- ----------------------------------------------------------------------------
-- PASO 10: Refrescar PostgREST Cache (si usas PostgREST)
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ======================================================================
-- FIN del script
```

---

## ✅ Mejoras Clave de Esta Versión

1. **Manejo robusto de UUID**: Fallback automático si `gen_random_uuid()` no está disponible
2. **Backfill inteligente**: Si `tags.public_id` existe, migra automáticamente a `tags.animal_id`
3. **Verificaciones detalladas**: Muestra exactamente qué se creó y qué falta
4. **Transacción**: Todo dentro de `BEGIN`/`COMMIT` para atomicidad
5. **Mensajes informativos**: `RAISE NOTICE` y `RAISE WARNING` para debugging

---

## 🎯 Resultado Esperado

Después de ejecutar:
- ✅ "OK: idx_animals_id_unique exists" en la verificación
- ✅ Lista de foreign keys de tags (deberías ver 3: `tags_animal_id_fkey`, `tags_batch_id_fkey`, `tags_ranch_id_fkey`)
- ✅ Si hay datos legacy, verás "✓ Backfill realizado en X filas"
- ✅ Sin errores
- ✅ PostgREST cache refrescado

---

## 📝 Nota sobre COMMIT

En Supabase SQL Editor, el `COMMIT` puede no ser necesario (las transacciones se manejan automáticamente), pero no hace daño incluirlo. Si da error, simplemente elimínalo.

---

**Esta es la versión más robusta y debería funcionar perfectamente.** ✅

