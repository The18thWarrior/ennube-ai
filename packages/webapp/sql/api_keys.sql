-- === 001_create_api_keys.sql ===
-- Created: 2025-08-16  (automated)
-- Purpose: Create `api_keys` table with uuid primary key, subid, created_at and updated_at timestamps
--
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at ON api_keys;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON api_keys
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Index on user_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

COMMENT ON COLUMN api_keys.hash IS 'Hash of the API key';
-- === 001_create_api_keys.sql ===
