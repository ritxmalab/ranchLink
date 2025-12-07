# 🔄 Refrescar PostgREST Schema Cache

## Problema

PostgREST está mostrando el error:
```
Could not find a relationship between 'tags' and 'animals' in the schema cache
```

Aunque el foreign key `tags_animal_id_fkey` existe en la base de datos, PostgREST necesita refrescar su caché de esquema para reconocer la relación.

---

## Solución Rápida

### Paso 1: Ejecutar SQL de Refresh

1. Ve a Supabase Dashboard → SQL Editor
2. Copia y pega este SQL:

```sql
-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

3. Click **"Run"**

### Paso 2: Verificar Foreign Key

Si quieres verificar que todo está correcto, ejecuta también:

```sql
-- Verify foreign key exists
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
  AND tc.constraint_name = 'tags_animal_id_fkey';
```

**Deberías ver:**
- `constraint_name`: `tags_animal_id_fkey`
- `table_name`: `tags`
- `column_name`: `animal_id`
- `foreign_table_name`: `animals`
- `foreign_column_name`: `id`

### Paso 3: Esperar y Probar

1. **Espera 10-30 segundos** para que PostgREST recargue el schema
2. Ve a: https://ranch-link.vercel.app/superadmin
3. Intenta generar tags de nuevo

---

## Si Aún No Funciona

### Opción A: Verificar que el Foreign Key Existe

Ejecuta este SQL para confirmar:

```sql
-- Check if foreign key exists
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname = 'tags_animal_id_fkey';
```

**Deberías ver:**
- `conname`: `tags_animal_id_fkey`
- `conrelid`: `tags`
- `confrelid`: `animals`

### Opción B: Recrear el Foreign Key (si falta)

Si el foreign key no existe, ejecuta:

```sql
-- Recreate foreign key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    ALTER TABLE public.tags
      ADD CONSTRAINT tags_animal_id_fkey
      FOREIGN KEY (animal_id) REFERENCES public.animals(id)
      ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key tags_animal_id_fkey created';
  ELSE
    RAISE NOTICE 'Foreign key tags_animal_id_fkey already exists';
  END IF;
END $$;
```

Luego ejecuta `NOTIFY pgrst, 'reload schema';` de nuevo.

---

## Verificación Final

Después de refrescar el cache, prueba:

1. **Factory → Generate & Mint Tags**
   - Debería funcionar sin el error de "relationship"

2. **Dashboard → Tags**
   - Debería mostrar tags con información de animals

3. **API Directo:**
   ```bash
   curl https://ranch-link.vercel.app/api/dashboard/tags
   ```
   - Debería retornar tags con `animals` nested

---

## Notas Técnicas

- PostgREST cachea el schema para performance
- Después de cambios de schema (foreign keys, nuevas tablas), necesita refresh
- `NOTIFY pgrst, 'reload schema'` es el método estándar para forzar reload
- Si PostgREST está en un servicio separado, puede requerir restart del servicio (requiere acceso admin de Supabase)

---

**Si después de todo esto sigue fallando, puede ser que PostgREST necesite un restart manual del servicio (requiere acceso a Supabase admin panel).**

