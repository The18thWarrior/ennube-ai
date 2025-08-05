-- === contract-results.sql ===
-- Created: 2025-07-29
-- Purpose: Table for storing normalized contract extraction results
-- Structure:
--   - id: UUID (primary key)
--   - user_id: string (user reference)
--   - created_at: timestamp (record creation time)
--   - updated_at: bigint (last update epoch ms)
--   - source_id: varchar (external system contract id)
--   - provider: enum ('sfdc', 'hubspot', 'gmail', 'msoffice')
--   - contract_data: JSONB (ContractResult type)

CREATE TABLE IF NOT EXISTS contract_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at BIGINT NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    provider VARCHAR(16) NOT NULL CHECK (provider IN ('sfdc', 'hubspot', 'gmail', 'msoffice')),
    contract_data JSONB NOT NULL
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_contract_results_user_id ON contract_results(user_id);
-- Index for fast lookup by provider
CREATE INDEX IF NOT EXISTS idx_contract_results_provider ON contract_results(provider);
-- Index for fast lookup by source_id
CREATE INDEX IF NOT EXISTS idx_contract_results_source_id ON contract_results(source_id);

-- Column descriptions
COMMENT ON COLUMN contract_results.id IS 'Primary key, unique contract result identifier (UUID)';
COMMENT ON COLUMN contract_results.user_id IS 'ID of the user who owns this contract result';
COMMENT ON COLUMN contract_results.created_at IS 'Timestamp when the contract result was created';
COMMENT ON COLUMN contract_results.updated_at IS 'Epoch milliseconds of last update to this record';
COMMENT ON COLUMN contract_results.source_id IS 'External system contract identifier (e.g., Salesforce, HubSpot, etc.)';
COMMENT ON COLUMN contract_results.provider IS 'Source system/provider: sfdc, hubspot, gmail, or msoffice';
COMMENT ON COLUMN contract_results.contract_data IS 'Extracted contract data as JSONB (ContractResult type)';

-- === contract-results.sql ===
-- Updated: 2025-07-29
-- Summary: Table for storing contract extraction results with JSONB contract_data
-- Key Columns:
--   - id: UUID
--   - user_id: string
--   - provider: enum
--   - contract_data: JSONB (ContractResult)
-- Version History:
--   v1.0 – initial
