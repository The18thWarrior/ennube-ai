-- Create the frequency type enum for agent settings
CREATE TYPE frequency_type AS ENUM ('business_hours', 'daily', 'weekly', 'monthly');
CREATE TYPE provider_type AS ENUM ('sfdc', 'hubspot', 'gmail', 'msoffice');

CREATE TABLE AgentSettings(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    batch_size INTEGER NOT NULL DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    frequency frequency_type NOT NULL,
    provider provider_type NOT NULL DEFAULT 'sfdc',
    custom_workflow TEXT
);

-- Table comments for AgentSettings
COMMENT ON TABLE AgentSettings IS 'Stores user configuration settings for AI agents';
COMMENT ON COLUMN AgentSettings.id IS 'Primary key UUID for the agent setting record';
COMMENT ON COLUMN AgentSettings.user_id IS 'The Auth0 sub ID of the user who owns these agent settings';
COMMENT ON COLUMN AgentSettings.agent IS 'The name or identifier of the agent';
COMMENT ON COLUMN AgentSettings.created_at IS 'Timestamp when the agent setting was created (Unix timestamp in ms)';
COMMENT ON COLUMN AgentSettings.updated_at IS 'Timestamp when the agent setting was last updated (Unix timestamp in ms)';
COMMENT ON COLUMN AgentSettings.active IS 'Boolean flag indicating if the agent is currently active';
COMMENT ON COLUMN AgentSettings.frequency IS 'How often the agent should run (business_hours, daily, weekly, monthly)';
COMMENT ON COLUMN AgentSettings.batch_size IS 'Number of items to process in each batch when the agent runs';

COMMENT ON COLUMN AgentSettings.provider IS 'The integration provider for this agent (sfdc, hubspot, gmail, msoffice)';

COMMENT ON COLUMN AgentSettings.custom_workflow IS 'Custom workflow for the agent';