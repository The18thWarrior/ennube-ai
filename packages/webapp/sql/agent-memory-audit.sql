-- Create agent_memory_audit table
CREATE TABLE IF NOT EXISTS agent_memory_audit (
    id BIGSERIAL PRIMARY KEY,
    user_sub TEXT NOT NULL,
    agent_key TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('insert_case', 'update_case', 'prune_case', 'retrieve_cases', 'train_policy')),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_memory_audit_user_sub_created_at ON agent_memory_audit(user_sub, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_audit_action ON agent_memory_audit(action);

-- Comment explaining the table
COMMENT ON TABLE agent_memory_audit IS 'Audit log for memory operations and mutations';
COMMENT ON COLUMN agent_memory_audit.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN agent_memory_audit.user_sub IS 'Auth0 user subject identifier';
COMMENT ON COLUMN agent_memory_audit.agent_key IS 'Agent identifier';
COMMENT ON COLUMN agent_memory_audit.action IS 'Type of memory operation performed';
COMMENT ON COLUMN agent_memory_audit.payload IS 'JSON payload with operation details';
COMMENT ON COLUMN agent_memory_audit.created_at IS 'Timestamp of the audit event';