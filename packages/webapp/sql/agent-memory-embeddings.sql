-- Create agent_memory_embeddings table (requires pgvector extension)
-- Note: Run 'CREATE EXTENSION IF NOT EXISTS vector;' in your database first
CREATE TABLE IF NOT EXISTS agent_memory_embeddings (
    case_id UUID PRIMARY KEY REFERENCES agent_memory_cases(id) ON DELETE CASCADE,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector index for similarity search (HNSW)
CREATE INDEX IF NOT EXISTS idx_agent_memory_embeddings_embedding ON agent_memory_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Comment explaining the table
COMMENT ON TABLE agent_memory_embeddings IS 'Vector embeddings for semantic retrieval of memory cases';
COMMENT ON COLUMN agent_memory_embeddings.case_id IS 'Reference to the memory case';
COMMENT ON COLUMN agent_memory_embeddings.embedding IS '1536-dimensional vector embedding';
COMMENT ON COLUMN agent_memory_embeddings.metadata IS 'Additional scoring or metadata for retrieval';
COMMENT ON COLUMN agent_memory_embeddings.created_at IS 'Record creation timestamp';