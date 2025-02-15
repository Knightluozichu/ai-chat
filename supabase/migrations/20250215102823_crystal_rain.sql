/*
  # Add document processing features

  1. Changes to files table
    - Add processing_status column
    - Add error_message column for tracking processing errors
    - Add processed_at column for tracking processing completion

  2. New Tables
    - document_chunks
      - Stores processed document chunks for vector search
      - Links to files table
      - Includes chunk content and metadata

  3. Security
    - Enable RLS on document_chunks table
    - Add policies for authenticated users
*/

-- Add processing status to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'pending'
  CHECK (processing_status IN ('pending', 'processing', 'completed', 'error'));
ALTER TABLE files ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Add policy for viewing document chunks
CREATE POLICY "Users can view chunks of their files"
  ON document_chunks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE id = document_chunks.file_id
      AND user_id = auth.uid()
    )
  );

-- Add policy for inserting document chunks
CREATE POLICY "Service role can insert document chunks"
  ON document_chunks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Update files table triggers
CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS files_updated_at ON files;
CREATE TRIGGER files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_files_updated_at();