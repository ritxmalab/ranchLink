# 🔍 SQL Verificación y Forzar Reload de PostgREST

## 🎯 Problema Detectado

Los logs muestran requests 400/404 a `/rest/v1/tags` y `/rest/v1/animals` con selects anidados. Esto indica que PostgREST aún no ha reconocido las relaciones correctamente.

---

## 📋 Ejecuta Este SQL (Verificación + Forzar Reload)

```sql
-- ============================================================================
-- Verificación Completa + Forzar Reload de PostgREST
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Verificar que las Foreign Keys existen
-- ----------------------------------------------------------------------------
SELECT 
  'VERIFICACIÓN FOREIGN KEYS' AS reporte,
  tc.constraint_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table, 
  ccu.column_name AS foreign_column,
  CASE 
    WHEN tc.constraint_name = 'tags_animal_id_fkey' THEN '✓ CRÍTICO'
    WHEN tc.constraint_name IN ('tags_batch_id_fkey', 'tags_ranch_id_fkey') THEN '✓ IMPORTANTE'
    ELSE '✓'
  END AS estado
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'tags' 
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY 
  CASE 
    WHEN tc.constraint_name = 'tags_animal_id_fkey' THEN 1
    WHEN tc.constraint_name = 'tags_batch_id_fkey' THEN 2
    WHEN tc.constraint_name = 'tags_ranch_id_fkey' THEN 3
    ELSE 99
  END;

-- ----------------------------------------------------------------------------
-- PASO 2: Verificar que animals.id tiene UNIQUE INDEX
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
  END AS estado;

-- ----------------------------------------------------------------------------
-- PASO 3: Verificar columnas de animals (incluyendo public_id)
-- ----------------------------------------------------------------------------
SELECT 
  'COLUMNAS DE animals' AS reporte,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'animals'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- PASO 4: Verificar columnas de tags (incluyendo token_id)
-- ----------------------------------------------------------------------------
SELECT 
  'COLUMNAS DE tags' AS reporte,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tags'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- PASO 5: Verificar que tags.animal_id puede referenciar animals.id
-- ----------------------------------------------------------------------------
SELECT 
  'VERIFICACIÓN RELACIÓN tags -> animals' AS reporte,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'tags_animal_id_fkey'
    ) THEN '✓ Foreign key tags_animal_id_fkey existe'
    ELSE '❌ Foreign key tags_animal_id_fkey NO existe'
  END AS fk_existe,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' 
        AND tablename = 'animals' 
        AND indexname = 'idx_animals_id_unique'
    ) THEN '✓ animals.id tiene UNIQUE INDEX (suficiente para FK)'
    ELSE '❌ animals.id NO tiene UNIQUE INDEX'
  END AS animals_id_unique;

-- ----------------------------------------------------------------------------
-- PASO 6: FORZAR RELOAD DE POSTGREST (CRÍTICO)
-- ----------------------------------------------------------------------------
-- Esto fuerza a PostgREST a recargar su schema cache
-- Ejecuta esto y espera 10-30 segundos antes de probar de nuevo
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- PASO 7: Verificar que PostgREST puede ver las relaciones
-- ----------------------------------------------------------------------------
-- Esta query simula lo que PostgREST necesita ver
SELECT 
  'SIMULACIÓN POSTGREST' AS reporte,
  'tags' AS tabla,
  'animal_id' AS columna_local,
  'animals' AS tabla_referenciada,
  'id' AS columna_referenciada,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'tags_animal_id_fkey'
    ) THEN '✓ PostgREST DEBERÍA poder ver esta relación'
    ELSE '❌ PostgREST NO podrá ver esta relación'
  END AS estado;

-- ----------------------------------------------------------------------------
-- RESUMEN FINAL
-- ----------------------------------------------------------------------------
SELECT 
  'RESUMEN' AS reporte,
  'Ejecuta NOTIFY pgrst arriba y espera 10-30 segundos' AS paso1,
  'Luego prueba: https://ranch-link.vercel.app/superadmin' AS paso2,
  'Si sigue fallando, pega aquí la URL exacta del request que falla' AS paso3;

-- ============================================================================
-- FIN
-- ============================================================================
```

---

## ✅ Qué Hace Este SQL

1. ✅ **Verifica** que las 3 foreign keys existen
2. ✅ **Verifica** que `animals.id` tiene UNIQUE INDEX
3. ✅ **Verifica** columnas de `animals` (incluyendo `public_id`)
4. ✅ **Verifica** columnas de `tags` (incluyendo `token_id`)
5. ✅ **Verifica** que la relación `tags -> animals` está correcta
6. ✅ **FORZA RELOAD** de PostgREST con `NOTIFY pgrst, 'reload schema'`
7. ✅ **Simula** lo que PostgREST necesita ver

---

## 🎯 Después de Ejecutar

1. **Revisa los resultados** - Deberías ver:
   - ✓ 3 foreign keys en tags
   - ✓ animals.id tiene UNIQUE INDEX
   - ✓ Todas las columnas necesarias

2. **Espera 10-30 segundos** después del `NOTIFY pgrst`

3. **Prueba de nuevo** en producción:
   - https://ranch-link.vercel.app/superadmin
   - "Generate & Mint Tags"

---

## 🔧 Si Sigue Fallando

Si después de esto sigue dando 400/404, necesito ver:
1. **La URL exacta** del request que falla (con todos los parámetros)
2. **El body de la respuesta** del error
3. **El código exacto** que está haciendo la query (puede que el problema esté en el código, no en PostgREST)

---

**Ejecuta este SQL y comparte los resultados si algo sigue fallando.** ✅

