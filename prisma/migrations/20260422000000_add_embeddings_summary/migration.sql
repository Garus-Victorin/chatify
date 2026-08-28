-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add embeddings (Float[]) + summary + pgvector HNSW index
--
-- NOTE: pgvector extension is OPTIONAL.
-- If your PostgreSQL provider supports it (Neon, Supabase, self-hosted),
-- uncomment the pgvector block below for native vector operations.
-- Otherwise, the Float[] column + application-side cosine similarity is used.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add summary field to Chat
ALTER TABLE "Chat"
  ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- Add embedding field to Message (native float array — works on all PostgreSQL)
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "embedding" DOUBLE PRECISION[];

-- ─── OPTIONAL: pgvector native vector type ────────────────────────────────────
-- Uncomment if pgvector extension is available on your PostgreSQL instance.
-- This enables native ANN (Approximate Nearest Neighbor) search.
--
-- CREATE EXTENSION IF NOT EXISTS vector;
--
-- ALTER TABLE "Message"
--   ADD COLUMN IF NOT EXISTS "embedding_vec" vector(384);
--
-- -- HNSW index for fast approximate nearest neighbor search
-- -- m=16 (connections per layer), ef_construction=64 (build quality)
-- CREATE INDEX IF NOT EXISTS "Message_embedding_hnsw_idx"
--   ON "Message" USING hnsw ("embedding_vec" vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);
--
-- -- IVFFlat alternative (faster build, slightly lower recall):
-- -- CREATE INDEX IF NOT EXISTS "Message_embedding_ivfflat_idx"
-- --   ON "Message" USING ivfflat ("embedding_vec" vector_cosine_ops)
-- --   WITH (lists = 100);
-- ─────────────────────────────────────────────────────────────────────────────
