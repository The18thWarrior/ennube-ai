-- Create agent_memory_profiles table
CREATE TABLE IF NOT EXISTS agent_memory_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_sub TEXT NOT NULL,
    agent_key TEXT NOT NULL,
    window_size INTEGER DEFAULT 200,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_sub, agent_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_memory_profiles_user_sub_agent_key ON agent_memory_profiles(user_sub, agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_memory_profiles_created_at ON agent_memory_profiles(created_at DESC);

-- Comment explaining the table
COMMENT ON TABLE agent_memory_profiles IS 'Stores per-user configuration and statistics for agent memory learning';
COMMENT ON COLUMN agent_memory_profiles.id IS 'Unique identifier for the memory profile';
COMMENT ON COLUMN agent_memory_profiles.user_sub IS 'Auth0 user subject identifier';
COMMENT ON COLUMN agent_memory_profiles.agent_key IS 'Agent identifier (e.g., data-steward, prospect-finder)';
COMMENT ON COLUMN agent_memory_profiles.window_size IS 'Sliding window size for retaining memory cases';
COMMENT ON COLUMN agent_memory_profiles.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN agent_memory_profiles.updated_at IS 'Last update timestamp';