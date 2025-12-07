# 📋 INSTRUCCIONES EXACTAS - COPIAR Y PEGAR EN SUPABASE

## 🎯 PASO A PASO

### 1. Abre el archivo SQL

**Ruta del archivo:**
```
supabase/migrations/PROD_SYNC_V1.sql
```

### 2. Copia TODO el contenido

**IMPORTANTE:** Copia desde la primera línea hasta la última, incluyendo todos los comentarios.

### 3. Pega en Supabase SQL Editor

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto **PRODUCTION** (ranchLink)
3. Click en **SQL Editor** (icono de base de datos en el sidebar izquierdo)
4. Click en **"New query"** o el botón **"+"**
5. **PEGA** todo el contenido del archivo SQL
6. Click en **"Run"** (botón verde) o presiona **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows)

### 4. Verifica el resultado

**Esperado:**
- ✅ Deberías ver: "Success. No rows returned" o similar
- ✅ NO deberías ver errores en rojo

**Si hay errores:**
- Anota el mensaje de error exacto
- Verifica que estás en el proyecto PRODUCTION correcto

---

## 📄 CONTENIDO COMPLETO DEL SQL

El archivo completo está en: `supabase/migrations/PROD_SYNC_V1.sql`

**Tamaño aproximado:** ~350 líneas

**Incluye:**
- Creación de tabla `tags` (si no existe)
- Agregar columna `batch_name` a `batches` (CRÍTICO)
- Agregar todas las columnas v1.0 a `animals`
- Crear foreign keys (CRÍTICO para PostgREST)
- Crear índices
- Crear tablas `kits` y `kit_tags`

---

## ✅ DESPUÉS DE EJECUTAR

Una vez que el SQL se ejecute exitosamente:

1. **Verifica que funcionó:**
   - Ve a `https://ranch-link.vercel.app/superadmin`
   - Intenta generar un batch de 3 tags
   - **NO debería aparecer el error:** "Could not find the table 'public.tags'"
   - **NO debería aparecer el error:** "Could not find the 'batch_name' column"

2. **Si todavía hay errores:**
   - Ejecuta las queries de verificación del checklist
   - Revisa los mensajes de error específicos

---

## 🔧 VERIFICACIÓN RÁPIDA (Opcional)

Después de ejecutar la migración, puedes ejecutar esta query para verificar:

```sql
-- Verificar que tags existe
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'tags';

-- Verificar que batch_name existe
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'batches' 
  AND column_name = 'batch_name';

-- Verificar foreign keys
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND constraint_name = 'tags_animal_id_fkey';
```

**Esperado:**
- Primera query: Debe retornar `1` (tabla tags existe)
- Segunda query: Debe retornar `batch_name` (columna existe)
- Tercera query: Debe retornar `tags_animal_id_fkey` (foreign key existe)

---

**LISTO PARA COPIAR Y PEGAR** ✅

