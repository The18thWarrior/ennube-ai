-- Create UserProfile table
CREATE TABLE IF NOT EXISTS user_profile (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    company VARCHAR(255) NOT NULL,
    job_role VARCHAR(255) NOT NULL,
    updated_at BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile(email);

-- Comment explaining the table
COMMENT ON TABLE user_profile IS 'Stores user profile information based on the UserProfile interface';
COMMENT ON COLUMN user_profile.name IS 'User full name';
COMMENT ON COLUMN user_profile.email IS 'User email address, unique identifier';
COMMENT ON COLUMN user_profile.company IS 'Company the user belongs to';
COMMENT ON COLUMN user_profile.job_role IS 'User job role or title';
COMMENT ON COLUMN user_profile.updated_at IS 'Last update timestamp stored as unix timestamp (milliseconds)';
COMMENT ON COLUMN user_profile.created_at IS 'Record creation timestamp';