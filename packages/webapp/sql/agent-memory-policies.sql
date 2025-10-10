-- Create agent_memory_policies table
CREATE TABLE IF NOT EXISTS agent_memory_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES agent_memory_profiles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    weights JSONB,
    loss_metrics JSONB,
    trained_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'training', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_memory_policies_profile_id ON agent_memory_policies(profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_policies_status ON agent_memory_policies(status);

-- Comment explaining the table
COMMENT ON TABLE agent_memory_policies IS 'Stores parametric retrieval policies and training metadata';
COMMENT ON COLUMN agent_memory_policies.id IS 'Unique identifier for the policy';
COMMENT ON COLUMN agent_memory_policies.profile_id IS 'Reference to the agent memory profile';
COMMENT ON COLUMN agent_memory_policies.version IS 'Version number for policy updates';
COMMENT ON COLUMN agent_memory_policies.weights IS 'Serialized model parameters/weights';
COMMENT ON COLUMN agent_memory_policies.loss_metrics IS 'Training diagnostics (loss, accuracy, etc.)';
COMMENT ON COLUMN agent_memory_policies.trained_at IS 'Last training timestamp';
COMMENT ON COLUMN agent_memory_policies.status IS 'Policy status: active, training, failed';
COMMENT ON COLUMN agent_memory_policies.created_at IS 'Record creation timestamp';