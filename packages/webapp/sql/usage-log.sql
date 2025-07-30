-- Create usage_log table
CREATE TABLE IF NOT EXISTS usage_log (
    id VARCHAR(255) PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    user_sub VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL,
    records_updated INTEGER NOT NULL DEFAULT 0,
    records_created INTEGER NOT NULL DEFAULT 0,
    meetings_booked INTEGER NOT NULL DEFAULT 0,
    queries_executed INTEGER NOT NULL DEFAULT 0, -- Added queries_executed field
    usage INTEGER NOT NULL DEFAULT 0,
    signature VARCHAR(512) NOT NULL,
    nonce BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    -- JSON field for the responseData object
    response_data JSONB
);

-- Create indices for improved query performance
CREATE INDEX IF NOT EXISTS idx_usage_log_user_sub ON usage_log(user_sub);
CREATE INDEX IF NOT EXISTS idx_usage_log_agent ON usage_log(agent);
CREATE INDEX IF NOT EXISTS idx_usage_log_timestamp ON usage_log(timestamp);

-- Add comments to explain table and fields
COMMENT ON TABLE usage_log IS 'Stores usage logs for tracking agent actions based on the UsageLogEntry interface';
COMMENT ON COLUMN usage_log.timestamp IS 'Timestamp of the log entry (milliseconds since epoch)';
COMMENT ON COLUMN usage_log.user_sub IS 'User subscription/ID reference';
COMMENT ON COLUMN usage_log.agent IS 'Name or ID of the agent that performed the action';
COMMENT ON COLUMN usage_log.records_updated IS 'Count of records updated by the agent';
COMMENT ON COLUMN usage_log.records_created IS 'Count of records created by the agent';
COMMENT ON COLUMN usage_log.meetings_booked IS 'Count of meetings booked by the agent';
COMMENT ON COLUMN usage_log.usage IS 'Stores usage count';
COMMENT ON COLUMN usage_log.queries_executed IS 'Count of queries executed by the agent';
COMMENT ON COLUMN usage_log.signature IS 'Cryptographic signature for verification';
COMMENT ON COLUMN usage_log.nonce IS 'One-time number used for verification purposes';
COMMENT ON COLUMN usage_log.created_at IS 'Timestamp when this log entry was created in the database';
COMMENT ON COLUMN usage_log.updated_at IS 'Timestamp when this log entry was last modified';
COMMENT ON COLUMN usage_log.status IS 'Status of the operation (optional)';
COMMENT ON COLUMN usage_log.response_data IS 'JSON data containing detailed response information including execution summary, counts, and record details';

-- Example of a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Example of a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_usage_log_modtime
BEFORE UPDATE ON usage_log
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();