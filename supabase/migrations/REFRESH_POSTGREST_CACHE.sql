-- ============================================================================
-- Refresh PostgREST Schema Cache
-- ============================================================================
-- 
-- PostgREST caches the database schema to optimize queries.
-- After creating foreign keys, PostgREST needs to refresh its cache
-- to recognize the new relationships.
--
-- This script forces PostgREST to reload its schema cache.
--
-- ============================================================================

-- Method 1: Notify PostgREST to reload schema
-- This sends a NOTIFY signal that PostgREST listens for
NOTIFY pgrst, 'reload schema';

-- Method 2: If NOTIFY doesn't work, we can also try:
-- PostgREST will automatically reload when it detects schema changes,
-- but sometimes it needs a small delay or a manual trigger.

-- Method 3: Verify the foreign key exists and is correct
-- This helps ensure the relationship is properly set up
DO $$
BEGIN
  -- Check if the foreign key exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_animal_id_fkey'
  ) THEN
    RAISE NOTICE 'Foreign key tags_animal_id_fkey exists ✓';
  ELSE
    RAISE WARNING 'Foreign key tags_animal_id_fkey does NOT exist!';
  END IF;
  
  -- Check if animals.id has PRIMARY KEY
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'animals'
      AND tc.constraint_type = 'PRIMARY KEY'
      AND kcu.column_name = 'id'
  ) THEN
    RAISE NOTICE 'animals.id has PRIMARY KEY constraint ✓';
  ELSE
    RAISE WARNING 'animals.id does NOT have PRIMARY KEY constraint!';
  END IF;
END $$;

-- ============================================================================
-- IMPORTANT: After running this SQL
-- ============================================================================
-- 
-- PostgREST should automatically reload its schema cache.
-- However, if the error persists:
--
-- 1. Wait 10-30 seconds for PostgREST to reload
-- 2. Try the API call again
-- 3. If still failing, you may need to restart PostgREST service
--    (This requires Supabase admin access)
--
-- ============================================================================

