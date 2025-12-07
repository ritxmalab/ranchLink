# ✅ SQL COMPLETO - Todo en Uno

## 📋 Copia y Pega TODO Esto en Supabase SQL Editor

Este SQL hace:
1. ✅ Verifica que el foreign key existe
2. ✅ Lo crea si falta
3. ✅ Refresca el cache de PostgREST

---

```sql
-- ============================================================================
-- RanchLink v1.0 - Verificar y Refrescar Schema Cache
-- ============================================================================
-- 
-- Este SQL:
-- 1. Verifica que el foreign key tags_animal_id_fkey existe
-- 2. Lo crea si falta
-- 3. Refresca el cache de PostgREST para reconocer la relación
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Verificar que animals.id tiene PRIMARY KEY
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Verificar que animals.id existe y es PRIMARY KEY
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'animals'
      AND tc.constraint_type = 'PRIMARY KEY'
      AND kcu.column_name = 'id'
  ) THEN
    RAISE WARNING 'animals.id NO tiene PRIMARY KEY - esto causará problemas';
  ELSE
    RAISE NOTICE '✓ animals.id tiene PRIMARY KEY';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 2: Verificar/Crear Foreign Key tags_animal_id_fkey
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Verificar si el foreign key existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    -- Crear el foreign key si no existe
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
      
      RAISE NOTICE '✓ Foreign key tags_animal_id_fkey CREADO';
    ELSE
      RAISE WARNING 'No se puede crear foreign key: animals.id no tiene PRIMARY KEY';
    END IF;
  ELSE
    RAISE NOTICE '✓ Foreign key tags_animal_id_fkey ya existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 3: Verificar todas las relaciones importantes
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Verificar tags.batch_id → batches.id
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_batch_id_fkey'
  ) THEN
    RAISE NOTICE '✓ tags_batch_id_fkey existe';
  ELSE
    RAISE WARNING 'tags_batch_id_fkey NO existe';
  END IF;
  
  -- Verificar tags.ranch_id → ranches.id
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_ranch_id_fkey'
  ) THEN
    RAISE NOTICE '✓ tags_ranch_id_fkey existe';
  ELSE
    RAISE WARNING 'tags_ranch_id_fkey NO existe';
  END IF;
  
  -- Verificar tags.animal_id → animals.id (el más importante)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    RAISE NOTICE '✓ tags_animal_id_fkey existe';
  ELSE
    RAISE WARNING 'tags_animal_id_fkey NO existe';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 4: Refrescar PostgREST Schema Cache
-- ----------------------------------------------------------------------------
-- Esto es CRÍTICO - PostgREST necesita refrescar su cache para reconocer
-- las relaciones después de crear foreign keys
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- PASO 5: Mostrar resumen de foreign keys
-- ----------------------------------------------------------------------------
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'tags'
ORDER BY tc.constraint_name;

-- ----------------------------------------------------------------------------
-- FIN
-- ----------------------------------------------------------------------------
-- Después de ejecutar este SQL:
-- 1. Espera 10-30 segundos para que PostgREST recargue
-- 2. Ve a: https://ranch-link.vercel.app/superadmin
-- 3. Intenta "Generate & Mint Tags" de nuevo
-- 4. El error "Could not find a relationship between 'tags' and 'animals'"
--    debería desaparecer
-- ============================================================================
```

---

## ✅ Qué Hace Este SQL

1. **Verifica** que `animals.id` tiene PRIMARY KEY
2. **Crea** el foreign key `tags_animal_id_fkey` si no existe
3. **Verifica** todas las foreign keys importantes
4. **Refresca** el cache de PostgREST con `NOTIFY pgrst, 'reload schema'`
5. **Muestra** un resumen de todas las foreign keys de `tags`

---

## 🎯 Resultado Esperado

Después de ejecutar:
- ✅ Mensajes en NOTICE indicando que todo está bien
- ✅ Tabla con todas las foreign keys de `tags`
- ✅ PostgREST cache refrescado
- ✅ El error desaparece al generar tags

---

**Copia TODO el SQL de arriba y pégalo en Supabase SQL Editor, luego haz click en "Run".** ✅

