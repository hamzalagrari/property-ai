-- Ensure shadow and fresh databases know the vector type before using it.
CREATE EXTENSION IF NOT EXISTS vector;

-- Reconcile the embedding column that already exists in the database.
ALTER TABLE "DocumentChunk"
ADD COLUMN IF NOT EXISTS "embedding" vector(3072);