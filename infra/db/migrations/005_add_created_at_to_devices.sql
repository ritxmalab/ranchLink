-- Ensure devices table has created_at column
-- This is a safety migration in case 002_devices_metadata.sql wasn't run

ALTER TABLE devices ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update any existing rows without created_at
UPDATE devices SET created_at = now() WHERE created_at IS NULL;

