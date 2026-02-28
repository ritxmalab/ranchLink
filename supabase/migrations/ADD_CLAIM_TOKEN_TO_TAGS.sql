-- Add claim_token to tags table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS claim_token UUID;
NOTIFY pgrst, 'reload schema';
