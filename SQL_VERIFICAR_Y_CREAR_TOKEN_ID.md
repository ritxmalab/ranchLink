# ✅ SQL Verificar y Crear token_id en tags

## 🎯 Problema

El código espera que `token_id` esté en `public.tags`, pero puede que:
1. La columna no exista
2. Los tags generados no tengan `token_id` porque el mint falló
3. PostgREST no está exponiendo la columna

---

## 📋 SQL para Verificar y Corregir

```sql
-- ============================================================================
-- Verificar y Crear token_id en public.tags
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Verificar si token_id existe en tags
-- ----------------------------------------------------------------------------
SELECT 
  'VERIFICACIÓN token_id' AS reporte,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tags'
        AND column_name = 'token_id'
    ) THEN '✓ token_id existe en tags'
    ELSE '❌ token_id NO existe en tags - NECESITA CREARSE'
  END AS estado;

-- ----------------------------------------------------------------------------
-- PASO 2: Crear columna token_id si no existe
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'token_id'
  ) THEN
    ALTER TABLE public.tags
      ADD COLUMN token_id text;
    
    RAISE NOTICE '✓ Columna token_id creada en tags';
  ELSE
    RAISE NOTICE '✓ Columna token_id ya existe en tags';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PASO 3: Verificar tags sin token_id
-- ----------------------------------------------------------------------------
SELECT 
  'TAGS SIN token_id' AS reporte,
  COUNT(*) AS total_sin_token_id,
  COUNT(CASE WHEN mint_tx_hash IS NOT NULL THEN 1 END) AS con_mint_tx_hash,
  COUNT(CASE WHEN mint_tx_hash IS NULL THEN 1 END) AS sin_mint_tx_hash
FROM public.tags
WHERE token_id IS NULL;

-- ----------------------------------------------------------------------------
-- PASO 4: Mostrar ejemplos de tags sin token_id
-- ----------------------------------------------------------------------------
SELECT 
  id,
  tag_code,
  batch_id,
  mint_tx_hash,
  contract_address,
  chain,
  status,
  created_at,
  CASE 
    WHEN mint_tx_hash IS NOT NULL THEN '⚠ Tiene mint_tx_hash pero no token_id - mint puede haber fallado'
    WHEN contract_address IS NOT NULL THEN '⚠ Tiene contract_address pero no mint_tx_hash - mint no se completó'
    ELSE '⚠ Sin información de mint'
  END AS diagnostico
FROM public.tags
WHERE token_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ----------------------------------------------------------------------------
-- PASO 5: Verificar que mint_tx_hash existe (necesario para obtener token_id)
-- ----------------------------------------------------------------------------
SELECT 
  'VERIFICACIÓN mint_tx_hash' AS reporte,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tags'
        AND column_name = 'mint_tx_hash'
    ) THEN '✓ mint_tx_hash existe en tags'
    ELSE '❌ mint_tx_hash NO existe en tags'
  END AS estado;

-- ----------------------------------------------------------------------------
-- PASO 6: Crear índice en token_id para búsquedas rápidas
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tags_token_id ON public.tags(token_id) 
WHERE token_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- PASO 7: Verificar estructura completa de tags
-- ----------------------------------------------------------------------------
SELECT 
  'ESTRUCTURA COMPLETA DE tags' AS reporte,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tags'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- PASO 8: Refrescar PostgREST cache (para que vea token_id)
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- RESUMEN
-- ----------------------------------------------------------------------------
SELECT 
  'RESUMEN' AS reporte,
  'token_id debe ser el ID real del NFT en blockchain (resultado del mint)' AS nota1,
  'Si tags tienen mint_tx_hash pero no token_id, el mint puede haber fallado' AS nota2,
  'El código en /api/factory/batches debería poblar token_id después del mint' AS nota3,
  'Si hay tags sin token_id, revisa los logs del proceso de mint' AS nota4;

-- ============================================================================
-- FIN
-- ============================================================================
```

---

## ⚠️ IMPORTANTE: Sobre token_id

**El `token_id` NO se puede generar arbitrariamente.** Debe ser:
- El ID real del NFT en la blockchain (resultado del mint)
- Obtenido del proceso de mint en `/api/factory/batches` (línea 171: `tokenId = mintResult.tokenId`)

**Si los tags no tienen `token_id`, puede ser porque:**
1. El mint falló (revisa logs de blockchain)
2. El proceso de mint no se completó
3. Hay un error en el código que actualiza `token_id` después del mint

---

## 🔍 Qué Hacer Después

1. **Ejecuta este SQL** para verificar y crear la columna si falta
2. **Revisa los tags sin token_id** - El SQL te mostrará cuántos hay
3. **Si hay tags con `mint_tx_hash` pero sin `token_id`**:
   - El mint puede haber fallado
   - Necesitas consultar la blockchain para obtener el `token_id` real
   - O reintentar el mint para esos tags

4. **Si hay tags sin `mint_tx_hash`**:
   - El mint nunca se ejecutó
   - Necesitas ejecutar el proceso de mint para esos tags

---

## 📝 Respuesta al Asistente de Supabase

**Para el asistente de Supabase, responde:**

- **A** - Actualizar `public.tags` directamente (el código ya espera esto)
- **Sí, ejecutar** - Pero solo para crear la columna si falta, NO para generar valores ficticios
- **mint_tx_hash** - Ya existe en `tags` y se usa para mapear al `token_id` real

**IMPORTANTE:** No generes `token_id` ficticios. El `token_id` debe venir del proceso de mint en blockchain. Si hay tags sin `token_id`, necesitas:
1. Verificar por qué el mint falló
2. Consultar la blockchain usando `mint_tx_hash` para obtener el `token_id` real
3. O reintentar el mint para esos tags

---

**Ejecuta este SQL primero para verificar el estado actual.** ✅

