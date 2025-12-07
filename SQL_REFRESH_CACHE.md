# 🔄 SQL para Refrescar PostgREST Cache

## Copia y Pega Esto en Supabase SQL Editor

```sql
-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

---

## Después de Ejecutar

1. **Espera 10-30 segundos** para que PostgREST recargue
2. Ve a: https://ranch-link.vercel.app/superadmin
3. Intenta **"Generate & Mint Tags"** de nuevo

---

## Si Quieres Verificar que el Foreign Key Existe

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

---

**Este es el SQL más simple para resolver el problema.** ✅

