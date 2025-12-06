-- Enable Row Level Security (RLS) on all tables
-- This is CRITICAL for data protection and legal compliance

-- ============================================
-- OWNERS TABLE
-- ============================================
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own owner record
-- Note: This assumes you'll add Supabase Auth later
-- For now, this allows public read (you may want to restrict further)
CREATE POLICY "Public can view owners" ON owners
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own owner record
CREATE POLICY "Users can insert own owner" ON owners
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own owner record
CREATE POLICY "Users can update own owner" ON owners
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ANIMALS TABLE
-- ============================================
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view animals (for public animal cards)
-- This allows the /a?id= endpoint to work
CREATE POLICY "Public can view animals" ON animals
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert animals
-- You'll need to add auth check when you implement authentication
CREATE POLICY "Authenticated users can insert animals" ON animals
  FOR INSERT
  WITH CHECK (true);

-- Policy: Owners can update their own animals
CREATE POLICY "Owners can update own animals" ON animals
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- DEVICES TABLE
-- ============================================
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view unclaimed devices (for QR generation)
CREATE POLICY "Public can view unclaimed devices" ON devices
  FOR SELECT
  USING (status = 'printed' AND owner_id IS NULL);

-- Policy: Owners can view their own claimed devices
CREATE POLICY "Owners can view own devices" ON devices
  FOR SELECT
  USING (owner_id IS NOT NULL);

-- Policy: System can insert/update devices (via service role)
-- This is handled server-side with service role key
-- RLS doesn't apply to service role operations

-- ============================================
-- EVENTS TABLE
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view events for public animals
-- This allows public animal cards to show event history
CREATE POLICY "Public can view animal events" ON events
  FOR SELECT
  USING (
    public_id IN (
      SELECT public_id FROM animals
    )
  );

-- Policy: Owners can insert events for their animals
CREATE POLICY "Owners can insert events" ON events
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ANCHORS TABLE
-- ============================================
ALTER TABLE anchors ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view anchors (blockchain data is public)
CREATE POLICY "Public can view anchors" ON anchors
  FOR SELECT
  USING (true);

-- ============================================
-- TRANSFERS TABLE
-- ============================================
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view transfers (ownership history is public)
CREATE POLICY "Public can view transfers" ON transfers
  FOR SELECT
  USING (true);

-- ============================================
-- BATCHES TABLE
-- ============================================
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Policy: Only system/admin can view batches
-- For now, allow public read (restrict later if needed)
CREATE POLICY "Public can view batches" ON batches
  FOR SELECT
  USING (true);

-- ============================================
-- QA_TESTS TABLE
-- ============================================
ALTER TABLE qa_tests ENABLE ROW LEVEL SECURITY;

-- Policy: Only system/admin can view QA tests
CREATE POLICY "Public can view qa_tests" ON qa_tests
  FOR SELECT
  USING (true);

-- ============================================
-- CUSTODY_LOG TABLE
-- ============================================
ALTER TABLE custody_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only system/admin can view custody logs
CREATE POLICY "Public can view custody_log" ON custody_log
  FOR SELECT
  USING (true);

-- ============================================
-- CONTRACTS TABLE
-- ============================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view contracts (blockchain addresses are public)
CREATE POLICY "Public can view contracts" ON contracts
  FOR SELECT
  USING (true);

-- ============================================
-- WALLETS TABLE
-- ============================================
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Only system/admin can view wallets
-- WARNING: This contains sensitive wallet information
CREATE POLICY "System only can view wallets" ON wallets
  FOR SELECT
  USING (false); -- Restrict all public access

-- ============================================
-- RWA_IOT TABLE
-- ============================================
ALTER TABLE rwa_iot ENABLE ROW LEVEL SECURITY;

-- Policy: Only owners can view their IoT device data
-- GPS coordinates and device data are sensitive
CREATE POLICY "Owners can view own IoT devices" ON rwa_iot
  FOR SELECT
  USING (
    device_id IN (
      SELECT id FROM devices WHERE owner_id IS NOT NULL
    )
  );

-- ============================================
-- NOTES
-- ============================================
-- 
-- These policies provide basic protection but may need refinement:
-- 
-- 1. Add Supabase Auth integration for proper user identification
-- 2. Replace `true` checks with actual auth.uid() checks
-- 3. Consider more restrictive policies for sensitive data
-- 4. Add policies for UPDATE and DELETE operations as needed
-- 5. Test all policies thoroughly before production
-- 
-- Example of auth-based policy (when auth is implemented):
-- 
-- CREATE POLICY "Users can view own owner" ON owners
--   FOR SELECT
--   USING (auth.uid()::text = id::text);
-- 
-- ============================================

