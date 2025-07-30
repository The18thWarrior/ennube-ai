-- === outcomes.sql ===
-- Created: 2025-07-21  
-- Purpose: Generalized outcomes table for agent-driven n8n/LLM workflows
-- Exports: Table 'outcomes'
-- Interactions: Used by all agent workflow logic
-- Notes: outcome_data is JSONB for agent-specific results

-- OVERVIEW
--
-- - Stores outcomes from any agent (not just prospect-finder)
-- - outcome_data allows flexible, agent-specific payloads
-- - Supports traceability via run_id and customer_profile_id
-- - Designed for extensibility and analytics

CREATE TABLE IF NOT EXISTS outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    run_id VARCHAR(255),
    outcome_data JSONB,
    user_id VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outcomes_user_id ON outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_agent ON outcomes(agent);
CREATE INDEX IF NOT EXISTS idx_outcomes_status ON outcomes(status);
CREATE INDEX IF NOT EXISTS idx_outcomes_run_id ON outcomes(run_id);

-- === outcomes.sql ===
-- Updated: 2025-07-21
-- Summary: Generalized outcomes table for all agent workflows
-- Key Components:
--   - id: UUID PK
--   - user_id: User who owns the outcome
--   - agent: Agent name/type
--   - status: Outcome state
--   - run_id: Workflow or agent run reference
--   - outcome_data: JSONB, agent-specific
--   - customer_profile_id: Optional FK
--   - created_at/updated_at: Timestamps
-- Dependencies:
--   - Requires: customer_profiles table
-- Version History:
--   v1.0 – initial
-- Notes:
--   - Extend outcome_data schema as needed per agent
