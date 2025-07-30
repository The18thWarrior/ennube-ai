-- === outcome-log.sql ===
-- Created: 2025-07-22
-- Purpose: Table for logging actions/events related to outcomes
-- Exports: Table 'outcome_log'
-- Interactions: Used by agent workflow event logging
-- Notes: messages is JSONB for flexible message storage

-- OVERVIEW
--
-- - Stores log entries for outcome actions/events
-- - Links to outcomes table via outcome_id
-- - Supports extensible message payloads
-- - Designed for auditability and analytics

CREATE TABLE IF NOT EXISTS outcome_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id UUID NOT NULL,
    timestamp BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    messages JSONB,
    CONSTRAINT fk_outcome FOREIGN KEY (outcome_id) REFERENCES outcomes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outcome_log_outcome_id ON outcome_log(outcome_id);
CREATE INDEX IF NOT EXISTS idx_outcome_log_action ON outcome_log(action);
CREATE INDEX IF NOT EXISTS idx_outcome_log_timestamp ON outcome_log(timestamp);

-- === outcome-log.sql ===
-- Updated: 2025-07-22
-- Summary: Table for logging outcome actions/events
-- Key Components:
--   - id: UUID PK
--   - outcome_id: FK to outcomes
--   - timestamp: Event time
--   - action: Event type
--   - summary: Short description
--   - messages: JSONB, message payloads
-- Dependencies:
--   - Requires: outcomes table
-- Version History:
--   v1.0 – initial
-- Notes:
--   - Extend messages schema as needed per agent/event
