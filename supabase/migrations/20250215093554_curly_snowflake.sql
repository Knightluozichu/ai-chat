/*
  # Fix duplicate tables issue

  This migration ensures we don't have duplicate tables by:
  1. Dropping the table if it exists
  2. Re-creating it with the correct structure
  3. Re-enabling RLS and policies
*/

-- First drop the table if it exists
DROP TABLE IF EXISTS files;

-- Re-create the table with the correct structure
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Re-create policies
CREATE POLICY "Users can view own files"
  ON files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own files"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure storage bucket exists
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('files', 'files', true)
  ON CONFLICT (id) DO NOTHING;

  -- Enable public access to the bucket
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES
    ('Public Read Access', 'files', '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Anonymous":["*"]},"Action":["select"],"Resource":["*"]}]}')
  ON CONFLICT (name, bucket_id) DO NOTHING;

  -- Allow authenticated users to upload files
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES
    ('Authenticated Upload Access', 'files', '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Claims":["authenticated"]},"Action":["insert"],"Resource":["*"]}]}')
  ON CONFLICT (name, bucket_id) DO NOTHING;
END $$;