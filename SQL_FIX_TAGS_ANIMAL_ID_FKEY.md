# 🔧 SQL para Crear tags_animal_id_fkey (El que Falta)

## ⚠️ Problema Detectado

En los resultados del SQL anterior, solo aparecen:
- ✅ `tags_batch_id_fkey` 
- ✅ `tags_ranch_id_fkey`
- ❌ **FALTA `tags_animal_id_fkey`** ← Este es el crítico para resolver el error

---

## 📋 Copia y Pega Este SQL en Supabase

Este SQL verifica y crea específicamente el foreign key que falta:

```sql
-- ============================================================================
-- Fix: Crear tags_animal_id_fkey (El Foreign Key que Falta)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Verificar que animals.id tiene PRIMARY KEY
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  has_pk boolean;
BEGIN
  -- Verificar si animals.id tiene PRIMARY KEY
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'animals'
      AND tc.constraint_type = 'PRIMARY KEY'
      AND kcu.column_name = 'id'
  ) INTO has_pk;
  
  IF NOT has_pk THEN
    RAISE EXCEPTION 'animals.id NO tiene PRIMARY KEY. Ejecuta primero la migración completa.';
  ELSE
    RAISE NOTICE '✓ animals.id tiene PRIMARY KEY';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 2: Verificar si animals.id existe como columna
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
    RAISE EXCEPTION 'animals.id NO existe o no es uuid. Ejecuta primero la migración completa.';
  ELSE
    RAISE NOTICE '✓ animals.id existe y es uuid';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 3: Crear el Foreign Key tags_animal_id_fkey
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Verificar si ya existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    RAISE NOTICE '✓ tags_animal_id_fkey ya existe';
  ELSE
    -- Crear el foreign key
    BEGIN
      ALTER TABLE public.tags
        ADD CONSTRAINT tags_animal_id_fkey
        FOREIGN KEY (animal_id) REFERENCES public.animals(id)
        ON DELETE SET NULL;
      
      RAISE NOTICE '✓ tags_animal_id_fkey CREADO EXITOSAMENTE';
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Error al crear foreign key: %', SQLERRM;
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 4: Verificar que se creó correctamente
-- ----------------------------------------------------------------------------
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN tc.constraint_name = 'tags_animal_id_fkey' THEN '✓ CRÍTICO - Este es el que necesitamos'
    ELSE '✓'
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'tags'
ORDER BY 
  CASE WHEN tc.constraint_name = 'tags_animal_id_fkey' THEN 0 ELSE 1 END,
  tc.constraint_name;

-- ----------------------------------------------------------------------------
-- PASO 5: Refrescar PostgREST Cache (IMPORTANTE)
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- FIN
-- ----------------------------------------------------------------------------
-- Después de ejecutar:
-- 1. Deberías ver "tags_animal_id_fkey" en los resultados
-- 2. Espera 10-30 segundos
-- 3. Prueba: https://ranch-link.vercel.app/superadmin → "Generate & Mint Tags"
-- ============================================================================
```

---

## ✅ Qué Hace Este SQL

1. **Verifica** que `animals.id` tiene PRIMARY KEY (si no, lanza error)
2. **Verifica** que `animals.id` existe y es uuid
3. **Crea** `tags_animal_id_fkey` si no existe
4. **Muestra** todas las foreign keys de `tags` (deberías ver 3 ahora)
5. **Refresca** PostgREST cache

---

## 🎯 Resultado Esperado

Después de ejecutar, deberías ver en los resultados **3 foreign keys**:
- ✅ `tags_batch_id_fkey`
- ✅ `tags_ranch_id_fkey`
- ✅ **`tags_animal_id_fkey`** ← Este es el nuevo

---

## ⚠️ Si Da Error

Si el SQL da error diciendo que `animals.id` no tiene PRIMARY KEY, ejecuta primero este SQL para crearlo:

```sql
-- Asegurar que animals.id es PRIMARY KEY
DO $$
BEGIN
  -- Agregar id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'animals' 
      AND column_name = 'id'
  ) THEN
    ALTER TABLE public.animals
      ADD COLUMN id uuid DEFAULT gen_random_uuid();
    
    UPDATE public.animals
    SET id = gen_random_uuid()
    WHERE id IS NULL;
    
    ALTER TABLE public.animals
      ALTER COLUMN id SET NOT NULL;
  END IF;
  
  -- Crear PRIMARY KEY si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.animals
      ADD PRIMARY KEY (id);
  END IF;
END $$;
```

Luego ejecuta el SQL principal de arriba.

---

**Este SQL específico crea el foreign key que falta.** ✅

