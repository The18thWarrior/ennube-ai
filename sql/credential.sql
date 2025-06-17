-- Create the credential type enum
CREATE TYPE credential_type AS ENUM ('sfdc', 'hubspot', 'gsuite');

CREATE TABLE Credentials(  
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    type credential_type NOT NULL,
    access_token TEXT NOT NULL,
    instance_url TEXT NOT NULL,
    refresh_token TEXT,
    user_info_id TEXT,
    user_info_organization_id TEXT,
    user_info_display_name TEXT,
    user_info_email TEXT,
    user_info_organization_id_alt TEXT,
    account_timestamp_field TEXT,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    created_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table comments
COMMENT ON TABLE Credentials IS 'Stores integration credentials for authenticated users';
COMMENT ON COLUMN Credentials.id IS 'Primary key UUID for the credential record';
COMMENT ON COLUMN Credentials.user_id IS 'The Auth0 sub ID of the user who owns these credentials';
COMMENT ON COLUMN Credentials.type IS 'Type of integration (sfdc, hubspot, or gsuite)';
COMMENT ON COLUMN Credentials.access_token IS 'OAuth access token for the integration';
COMMENT ON COLUMN Credentials.instance_url IS 'The URL of the integration instance';
COMMENT ON COLUMN Credentials.refresh_token IS 'OAuth refresh token (optional)';
COMMENT ON COLUMN Credentials.user_info_id IS 'User ID from the integration';
COMMENT ON COLUMN Credentials.user_info_organization_id IS 'Organization ID from the integration';
COMMENT ON COLUMN Credentials.user_info_display_name IS 'User display name in the integration';
COMMENT ON COLUMN Credentials.user_info_email IS 'User email in the integration';
COMMENT ON COLUMN Credentials.user_info_organization_id_alt IS 'Alternative organization ID field';
COMMENT ON COLUMN Credentials.created_at IS 'Timestamp when the credentials were created (Unix timestamp in ms)';
COMMENT ON COLUMN Credentials.expires_at IS 'Timestamp when the credentials expire (Unix timestamp in ms)';
COMMENT ON COLUMN Credentials.created_timestamp IS 'Database timestamp when the record was created';
COMMENT ON COLUMN Credentials.account_timestamp_field IS 'The timestamp field api name used account queries for credential';