# 🔧 SQL FIX - Eliminar PRIMARY KEY Existente en animals

## ⚠️ Problema

Error: `multiple primary keys for table "animals" are not allowed`

**Causa:** La tabla `animals` ya tiene un PRIMARY KEY (probablemente en `public_id`) y estamos intentando crear otro en `id`.

**Solución:** Eliminar el PRIMARY KEY existente ANTES de crear el nuevo.

---

## 📋 Copia y Pega Este SQL (CORREGIDO)

```sql
-- ============================================================================
-- Fix: Eliminar PRIMARY KEY existente en animals y crear uno nuevo en id
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Identificar y eliminar PRIMARY KEY existente en animals
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  pk_constraint_name text;
BEGIN
  -- Buscar el nombre del PRIMARY KEY constraint actual
  SELECT constraint_name INTO pk_constraint_name
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'animals'
    AND constraint_type = 'PRIMARY KEY'
  LIMIT 1;
  
  -- Si existe un PRIMARY KEY, eliminarlo
  IF pk_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.animals DROP CONSTRAINT %I', pk_constraint_name);
    RAISE NOTICE '✓ PRIMARY KEY eliminado: %', pk_constraint_name;
  ELSE
    RAISE NOTICE '✓ No hay PRIMARY KEY existente para eliminar';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 2: Asegurar que animals.id existe
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
-- PASO 3: Crear PRIMARY KEY en animals.id
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Verificar que no existe PRIMARY KEY antes de crear
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.animals
      ADD PRIMARY KEY (id);
    
    RAISE NOTICE '✓ PRIMARY KEY creado en animals.id';
  ELSE
    RAISE NOTICE '✓ PRIMARY KEY ya existe en animals';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 4: Asegurar que public_id es UNIQUE (pero no PRIMARY KEY)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Crear índice único en public_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'animals'
      AND indexname LIKE '%public_id%unique%'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_public_id_unique 
      ON public.animals(public_id) 
      WHERE public_id IS NOT NULL;
    
    RAISE NOTICE '✓ Índice único creado en animals.public_id';
  ELSE
    RAISE NOTICE '✓ Índice único ya existe en animals.public_id';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 5: Verificar el resultado
-- ----------------------------------------------------------------------------
SELECT 
  'VERIFICACIÓN' AS reporte,
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
    ELSE '❌ animals.id NO tiene PRIMARY KEY'
  END AS estado_primary_key,
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
-- PASO 6: Ahora crear el foreign key tags_animal_id_fkey
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Verificar si el foreign key ya existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
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
      RAISE WARNING 'No se puede crear foreign key: animals.id no tiene PRIMARY KEY';
    END IF;
  ELSE
    RAISE NOTICE '✓ tags_animal_id_fkey ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 7: Verificar todos los foreign keys de tags
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- PASO 8: Refrescar PostgREST cache
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- FIN
-- ----------------------------------------------------------------------------
-- Después de ejecutar:
-- 1. Deberías ver "✓ animals.id tiene PRIMARY KEY" en la verificación
-- 2. Deberías ver 3 foreign keys en tags (incluyendo tags_animal_id_fkey)
-- 3. Espera 10-30 segundos
-- 4. Prueba: https://ranch-link.vercel.app/superadmin → "Generate & Mint Tags"
-- ============================================================================
```

---

## ✅ Qué Hace Este SQL (CORREGIDO)

1. ✅ **Identifica** el PRIMARY KEY existente en `animals` (puede estar en `public_id`)
2. ✅ **Elimina** el PRIMARY KEY existente (sin importar su nombre)
3. ✅ **Crea** `animals.id` si no existe
4. ✅ **Crea** PRIMARY KEY en `animals.id` (ahora es seguro porque eliminamos el anterior)
5. ✅ **Crea** índice único en `public_id` (para mantener unicidad)
6. ✅ **Crea** `tags_animal_id_fkey` (ahora debería funcionar)
7. ✅ **Muestra** verificación de todo
8. ✅ **Refresca** PostgREST cache

---

## 🎯 Resultado Esperado

Después de ejecutar:
- ✅ "✓ animals.id tiene PRIMARY KEY" en la verificación
- ✅ 3 foreign keys en tags (incluyendo `tags_animal_id_fkey`)
- ✅ Sin errores
- ✅ PostgREST cache refrescado

---

**Este SQL corrige el problema eliminando el PRIMARY KEY existente antes de crear el nuevo.** ✅

