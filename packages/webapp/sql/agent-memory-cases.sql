-- Create agent_memory_cases table
CREATE TABLE IF NOT EXISTS agent_memory_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES agent_memory_profiles(id) ON DELETE CASCADE,
    message_hash TEXT NOT NULL,
    prompt_snapshot JSONB,
    plan_summary JSONB,
    tool_traces JSONB,
    outcome TEXT CHECK (outcome IN ('success', 'failure', 'partial', 'aborted')),
    reward_score NUMERIC(3,2) CHECK (reward_score >= 0 AND reward_score <= 1),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reference_case_ids UUID[]
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_memory_cases_profile_id_created_at ON agent_memory_cases(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_cases_message_hash ON agent_memory_cases(message_hash);
CREATE INDEX IF NOT EXISTS idx_agent_memory_cases_outcome ON agent_memory_cases(outcome);
CREATE INDEX IF NOT EXISTS idx_agent_memory_cases_reward_score ON agent_memory_cases(reward_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_cases_tags ON agent_memory_cases USING GIN(tags);

-- Comment explaining the table
COMMENT ON TABLE agent_memory_cases IS 'Core memory bank capturing structured outcomes for agent learning';
COMMENT ON COLUMN agent_memory_cases.id IS 'Unique identifier for the memory case';
COMMENT ON COLUMN agent_memory_cases.profile_id IS 'Reference to the agent memory profile';
COMMENT ON COLUMN agent_memory_cases.message_hash IS 'Hash of the triggering user message for deduplication';
COMMENT ON COLUMN agent_memory_cases.prompt_snapshot IS 'Normalized prompt/context fed to the LLM';
COMMENT ON COLUMN agent_memory_cases.plan_summary IS 'Ordered steps and tools used in the plan';
COMMENT ON COLUMN agent_memory_cases.tool_traces IS 'Reduced logs of tool executions (inputs, outputs, status, duration)';
COMMENT ON COLUMN agent_memory_cases.outcome IS 'Outcome classification: success, failure, partial, aborted';
COMMENT ON COLUMN agent_memory_cases.reward_score IS 'Scalar heuristic reward score (0-1)';
COMMENT ON COLUMN agent_memory_cases.tags IS 'Array of domain/topic tags for filtering';
COMMENT ON COLUMN agent_memory_cases.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN agent_memory_cases.reference_case_ids IS 'IDs of cases retrieved during planning for audit trail';