/*
  # Add pgvector extension

  1. Changes
    - Enable pgvector extension for vector similarity search
    - This is required before creating tables with vector columns

  2. Notes
    - Must be run with superuser privileges
    - Extension is required for document embeddings
*/

-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;