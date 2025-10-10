
CREATE TYPE status AS ENUM ('active', 'inactive');


-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    sub_id VARCHAR(255) NOT NULL,
    parent_sub_id VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status status NOT NULL DEFAULT 'active'
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_licenses_sub_id ON licenses(sub_id);
CREATE INDEX IF NOT EXISTS idx_licenses_parent_sub_id ON licenses(parent_sub_id);

-- Add comments
COMMENT ON TABLE licenses IS 'Stores license relationships between accounts';
COMMENT ON COLUMN licenses.sub_id IS 'The subscription ID of the license holder';
COMMENT ON COLUMN licenses.parent_sub_id IS 'The parent subscription ID if this is a child license';
COMMENT ON COLUMN licenses.updated_at IS 'When this license record was last updated';
COMMENT ON COLUMN licenses.created_at IS 'When this license record was created';
COMMENT ON COLUMN licenses.status IS 'The status of the license (active, inactive, etc.)';