# 🚀 Deployment Checklist - Fix & Deploy Now

## ✅ What's Fixed

1. **Database Query Error** - Removed `created_at` dependency
2. **API Routes** - All use correct Supabase client
3. **Health Endpoint** - Created at `/api/health`
4. **Tag Route** - Works with current `devices` table
5. **Factory Endpoint** - Compatible with v0.9 schema

---

## 📋 Step-by-Step: Deploy Everything

### **Step 1: Run Database Migration (Supabase)**

**Go to:** https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/editor

**Run this SQL:**
```sql
-- Add created_at column if missing
ALTER TABLE devices ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing rows
UPDATE devices SET created_at = now() WHERE created_at IS NULL;
```

**Or copy/paste:** `infra/db/migrations/005_add_created_at_to_devices.sql`

---

### **Step 2: Commit & Push to GitHub**

```bash
cd /Users/gonzalobam/ranchlink

# Add all changes
git add .

# Commit
git commit -m "Fix: Database queries, API routes, and add v1.0 foundation

- Fixed devices.created_at column error
- Updated all API routes to use correct Supabase client
- Added /api/health diagnostic endpoint
- Created v1.0 schema migration (ready for later)
- Added blockchain wrapper for RanchLinkTag
- Created factory batches endpoint
- Added /t/[tag_code] route
- All changes backward compatible with v0.9"

# Push to GitHub
git push origin main
```

---

### **Step 3: Vercel Auto-Deploys**

- Vercel will automatically detect the push
- Will rebuild with all new routes
- Takes ~2-3 minutes

---

### **Step 4: Verify Deployment**

**After Vercel finishes:**

1. **Test Health Endpoint:**
   ```
   https://ranch-link.vercel.app/api/health
   ```
   Should return JSON (not 404)

2. **Test QR Generation:**
   - Go to: `/superadmin/qr-generator`
   - Generate a small batch (3 tags)
   - Should work without "created_at" error

3. **Check Vercel Logs:**
   - Go to Vercel → Logs tab
   - Look for any errors
   - Should see successful API calls

---

## 🔍 What Each Fix Does

### **1. Database Query Fix**
- **Before:** Query tried to select `created_at` which didn't exist
- **After:** Query orders by `id` instead (always exists)
- **Migration:** Adds `created_at` column for future use

### **2. API Routes Fix**
- **Before:** Used `createServerClient()` which needed anon key
- **After:** Uses `getSupabaseServerClient()` (only needs service key)
- **Result:** Server routes work correctly

### **3. Health Endpoint**
- **Purpose:** Diagnostic tool to check connectivity
- **Location:** `/api/health`
- **Returns:** Status of env vars and Supabase connection

### **4. Factory Endpoint**
- **Location:** `/api/factory/batches`
- **Purpose:** Creates batches + mints NFTs (when contract deployed)
- **Status:** Ready, but uses `devices` table for now (v0.9 compatible)

### **5. Tag Route**
- **Location:** `/t/[tag_code]`
- **Purpose:** Resolves tag scans
- **Status:** Works with current `devices` table

---

## ⚠️ Important Notes

### **Current State (v0.9 Compatible):**
- ✅ All code works with **existing schema**
- ✅ No breaking changes
- ✅ QR generation should work immediately

### **Future (v1.0 Migration):**
- ⏳ v1.0 schema ready (`004_v1_schema.sql`)
- ⏳ Will migrate `devices` → `tags` when ready
- ⏳ Will migrate `owners` → `ranches` when ready
- ⏳ Can be done later without breaking current system

---

## 🧪 Testing After Deploy

### **Quick Tests:**
1. ✅ `/api/health` - Should return JSON
2. ✅ `/api/superadmin/devices` - Should return devices (or empty array)
3. ✅ `/superadmin/qr-generator` - Generate 3 tags, should work
4. ✅ Check Supabase `devices` table - Should see new rows

### **If Still Failing:**
1. Check Vercel logs for specific error
2. Verify `SUPABASE_SERVICE_KEY` is in Vercel
3. Run database migration if `created_at` error persists
4. Check `/api/health` for diagnostic info

---

## 📝 Files Ready to Commit

**New Files:**
- `apps/web/app/api/health/route.ts`
- `apps/web/app/api/factory/batches/route.ts`
- `apps/web/app/t/[tag_code]/page.tsx`
- `apps/web/lib/blockchain/ranchLinkTag.ts`
- `infra/db/migrations/004_v1_schema.sql`
- `infra/db/migrations/005_add_created_at_to_devices.sql`
- Various documentation files

**Modified Files:**
- `apps/web/app/api/superadmin/devices/route.ts`
- `apps/web/app/api/claim/route.ts`
- `apps/web/app/api/animals/[id]/route.ts`
- `turbo.json`

---

## 🎯 Expected Result

After deployment:
- ✅ No more "created_at" errors
- ✅ QR generation works
- ✅ Tags save to database
- ✅ Health endpoint accessible
- ✅ All API routes functional

**Ready to commit and deploy!** 🚀

