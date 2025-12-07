# RanchLink v1.0 Production Schema Sync Checklist

**Date:** December 7, 2025  
**Purpose:** Step-by-step guide to apply schema migration and verify v1.0 functionality

---

## A) How to Apply the Migration in Supabase PROD

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select the **PRODUCTION** Supabase project (the one used by `ranch-link.vercel.app`)

### Step 2: Open SQL Editor

1. In the left sidebar, click **SQL Editor**
2. Click **New query** (or use the existing query editor)

### Step 3: Copy Migration SQL

1. Open the file: `supabase/migrations/PROD_SYNC_V1.sql`
2. **Copy the ENTIRE contents** of the file
3. Paste into the Supabase SQL Editor

### Step 4: Run the Migration

1. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
2. Wait for execution to complete
3. **Verify:** You should see "Success. No rows returned" or similar success message
4. **Check for errors:** If you see any errors, note them and check:
   - Are you in the correct project (PRODUCTION)?
   - Do you have the correct permissions?
   - Are there any conflicting constraints?

### Step 5: Verify Idempotency (Optional but Recommended)

1. **Run the migration again** (same SQL, click Run)
2. **Expected:** Should complete with no errors (idempotent)
3. **If errors occur:** Note them - they may indicate existing conflicts

---

## B) How to Verify Schema with SQL

Run these SQL queries in Supabase SQL Editor to verify the schema is correct:

### 1. Verify Tables Exist

```sql
-- Check that all required tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tags', 'batches', 'animals', 'ranches', 'kits', 'kit_tags')
ORDER BY table_name;
```

**Expected Result:** Should return 6 rows (tags, batches, animals, ranches, kits, kit_tags)

---

### 2. Check Columns for `batches` Table

```sql
-- Verify batches table has all v1.0 columns, especially batch_name
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'batches'
ORDER BY column_name;
```

**Expected Columns:**
- `id` (uuid)
- `name` (text)
- `batch_name` (text) - **CRITICAL: This must exist!**
- `model` (text)
- `material` (text)
- `color` (text)
- `chain` (text)
- `count` (integer)
- `target_ranch_id` (uuid)
- `status` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

---

### 3. Check Columns for `tags` Table

```sql
-- Verify tags table has all v1.0 columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tags'
ORDER BY column_name;
```

**Expected Columns:**
- `id` (uuid)
- `tag_code` (text, UNIQUE)
- `chain` (text)
- `contract_address` (text)
- `token_id` (text)
- `mint_tx_hash` (text)
- `batch_id` (uuid)
- `ranch_id` (uuid)
- `animal_id` (uuid) - **CRITICAL: This enables animal-tag relationships!**
- `status` (text)
- `activation_state` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

---

### 4. Check Columns for `animals` Table

```sql
-- Verify animals table has all v1.0 columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'animals'
ORDER BY column_name;
```

**Expected Columns:**
- `id` (uuid)
- `public_id` (text, UNIQUE)
- `name` (text)
- `species` (text)
- `breed` (text)
- `birth_year` (integer)
- `sex` (text)
- `ranch_id` (uuid)
- `status` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

---

### 5. Check Foreign Key Relationships

```sql
-- Verify all foreign keys exist (CRITICAL for PostgREST relationships)
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
  AND tc.table_name IN ('tags', 'animals', 'batches', 'kits', 'kit_tags')
ORDER BY tc.table_name, tc.constraint_name;
```

**Expected Foreign Keys:**
- `tags_batch_id_fkey` - tags.batch_id → batches.id
- `tags_ranch_id_fkey` - tags.ranch_id → ranches.id
- `tags_animal_id_fkey` - **CRITICAL:** tags.animal_id → animals.id (enables PostgREST relationships)
- `animals_ranch_id_fkey` - animals.ranch_id → ranches.id
- `batches_target_ranch_id_fkey` - batches.target_ranch_id → ranches.id
- `kit_tags_kit_id_fkey` - kit_tags.kit_id → kits.id
- `kit_tags_tag_id_fkey` - kit_tags.tag_id → tags.id
- `kits_claimed_ranch_id_fkey` - kits.claimed_ranch_id → ranches.id

---

### 6. Check Indexes

```sql
-- Verify indexes exist for performance
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tags', 'batches', 'animals')
ORDER BY tablename, indexname;
```

**Expected Indexes:**
- `idx_tags_tag_code` - For fast tag_code lookups
- `idx_tags_batch_id` - For batch queries
- `idx_tags_animal_id` - For animal-tag joins
- `idx_tags_ranch_id` - For ranch filtering
- `idx_tags_status` - For status filtering
- `idx_animals_public_id` - For public_id lookups
- `idx_batches_status` - For status filtering

---

## C) Manual RanchLink v1.0 End-to-End Test

After applying the migration and verifying the schema, test the complete v1.0 flow:

### Prerequisites

1. ✅ Migration applied successfully
2. ✅ Schema verification queries passed
3. ✅ Vercel deployment is up-to-date (commit `ece9f5e` or newer)
4. ✅ Environment variables are set in Vercel (especially Supabase keys)

---

### Test 1: Verify Build Badge

1. Open `https://ranch-link.vercel.app/superadmin` in **incognito/private window**
2. **Expected:** Build badge visible in top-right showing:
   - `RanchLink v1.0.0 • Base Mainnet • 0xCE16...6242 • build: ece9f5e` (or newer commit)
3. **Expected:** Only 3 tabs visible: Factory, Dashboard, Inventory
4. **Expected:** NO "QR Generator" tab

---

### Test 2: Factory - Generate & Mint Tags

1. In the **Factory** tab:
   - Set **Batch Size** = 3
   - Set **Material** = "PETG"
   - Set **Model** = "BASIC_QR (Original)"
   - Set **Blockchain** = "BASE" (should be disabled, showing "Base Mainnet (v1.0)")
   - Set **Color** = "Mesquite"
   - Set **Batch Name** = "Test Batch 2024"
   - Set **Batch Date** = Today's date
2. Click **"🚀 Generate & Mint Tags"**
3. **Expected:**
   - ✅ NO error about "Could not find the table 'public.tags'"
   - ✅ NO error about "Could not find the 'batch_name' column"
   - ✅ Success message appears (green box)
   - ✅ Message shows: "Successfully generated X tags with NFTs minted on Base Mainnet" (or similar)
4. **Verify in Supabase:**
   - Run: `SELECT COUNT(*) FROM tags WHERE batch_id IS NOT NULL;`
   - Should show 3 new tags
   - Run: `SELECT COUNT(*) FROM batches WHERE batch_name = 'Test Batch 2024';`
   - Should show 1 new batch

---

### Test 3: Inventory Tab

1. Click **Inventory** tab
2. Click **"🔄 Refresh"** button
3. **Expected:**
   - ✅ The 3 newly generated tags appear in the table
   - ✅ Each tag shows: Tag Code (e.g. "RL-001"), Token ID (or "Pending"), Status, On-Chain status
   - ✅ On-chain status shows: ✅ ON-CHAIN (if minted) or ⚪ OFF-CHAIN (if pending)

---

### Test 4: Dashboard Tab

1. Click **Dashboard** tab
2. **Expected:**
   - ✅ Stats cards show updated totals:
     - Total Tags: 3 (or more if previous tags exist)
     - On-Chain: X (number of tags with token_id)
     - Pending Mint: Y (number of tags without token_id)
     - Attached: 0 (no animals attached yet)

---

### Test 5: Tag Scan Page

1. Pick one of the newly generated tag codes (e.g. "RL-001")
2. Open: `https://ranch-link.vercel.app/t/RL-001` (replace with actual tag_code)
3. **Expected:**
   - ✅ Tag details page loads
   - ✅ Shows tag_code, status, activation_state
   - ✅ Shows blockchain info: Token ID, Chain, Contract Address (if minted)
   - ✅ Shows on-chain status badge: ✅ ON-CHAIN or ⚪ OFF-CHAIN
   - ✅ Shows Basescan link (if token_id exists)
   - ✅ Shows "Attach Tag to Animal" form (if tag not attached)

---

### Test 6: Attach Animal

1. On the tag scan page (`/t/RL-001`), fill out the attach form:
   - **Animal Name:** "Test Cow"
   - **Species:** "Cattle"
   - **Breed:** "Angus" (optional)
   - **Birth Year:** 2023 (optional)
   - **Sex:** "Female" (optional)
2. Click **"Attach Animal"**
3. **Expected:**
   - ✅ Success message appears
   - ✅ Redirects to `/a/AUS0001` (or similar public_id)
4. **Verify in Supabase:**
   - Run: `SELECT * FROM animals WHERE public_id LIKE 'AUS%' ORDER BY created_at DESC LIMIT 1;`
   - Should show the new animal
   - Run: `SELECT * FROM tags WHERE tag_code = 'RL-001';`
   - Should show `animal_id` is set and `status = 'attached'`

---

### Test 7: Animal Card Page

1. After attaching, you should be on `/a/AUS0001` (or similar)
2. **Expected:**
   - ✅ Animal card page loads
   - ✅ Shows animal info: name, species, breed, birth_year, sex
   - ✅ Shows tag info: tag_code, token_id, chain, contract_address
   - ✅ Shows on-chain status badge
   - ✅ Shows Basescan link (if token_id exists)
   - ✅ Shows ranch info (if ranch_id is set)

---

### Test 8: Dashboard - Animals View

1. Go back to `/dashboard`
2. **Expected:**
   - ✅ "Attached" counter shows 1 (or more)
   - ✅ In "Animals View" tab, the newly created animal appears
   - ✅ Animal card shows tag_code and on-chain status

---

## Troubleshooting

### If Factory Test Fails with "Could not find table 'public.tags'":

- **Check:** Did the migration run successfully?
- **Fix:** Re-run the migration SQL
- **Verify:** Run schema verification queries (Section B)

### If Factory Test Fails with "Could not find 'batch_name' column":

- **Check:** Does `batches` table have `batch_name` column?
- **Fix:** Re-run the migration SQL (it should add the column)
- **Verify:** Run query from Section B.2

### If Dashboard/Inventory Shows No Tags:

- **Check:** Are tags actually created in Supabase?
- **Fix:** Run: `SELECT * FROM tags ORDER BY created_at DESC LIMIT 5;`
- **Check:** Are there any RLS policies blocking access?
- **Fix:** Check Supabase RLS policies for `tags` table

### If Tag Scan Page Shows "Tag not found":

- **Check:** Does the tag exist in Supabase?
- **Fix:** Run: `SELECT * FROM tags WHERE tag_code = 'RL-001';`
- **Check:** Is the tag_code correct?

### If Attach Animal Fails:

- **Check:** Does the tag exist and is it not already attached?
- **Fix:** Run: `SELECT * FROM tags WHERE tag_code = 'RL-001';`
- **Check:** Are there any RLS policies blocking inserts to `animals`?
- **Fix:** Check Supabase RLS policies for `animals` table

### If Animal Card Shows No Tag Info:

- **Check:** Is the foreign key `tags_animal_id_fkey` created?
- **Fix:** Run foreign key verification query (Section B.5)
- **Check:** Does the tag have `animal_id` set?
- **Fix:** Run: `SELECT * FROM tags WHERE animal_id IS NOT NULL;`

---

## Success Criteria

All tests pass when:

- ✅ Factory generates tags without errors
- ✅ Tags appear in Inventory
- ✅ Dashboard shows correct stats
- ✅ Tag scan page loads tag details
- ✅ Attach animal creates animal and links tag
- ✅ Animal card shows tag and blockchain info
- ✅ Dashboard shows attached animals

---

## Next Steps After Successful Migration

1. **Monitor Production:**
   - Watch for any PostgREST errors in Vercel logs
   - Monitor Supabase query performance

2. **Optional: Add RLS Policies:**
   - If you need row-level security, add policies after migration
   - Migration enables RLS but doesn't create policies (assumes existing)

3. **Optional: Add More Indexes:**
   - If queries are slow, add indexes based on actual query patterns

---

**Migration Status:** ⏳ Pending application in Supabase PROD

