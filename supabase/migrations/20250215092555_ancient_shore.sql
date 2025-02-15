/*
  # Knowledge Base Tables Creation

  1. New Tables
    - `files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `size` (bigint)
      - `type` (text)
      - `url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `files` table
    - Add policies for authenticated users to manage their own files
*/

-- Create files table
CREATE TABLE IF NOT EXISTS files (
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

-- Create policies
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

-- Create storage bucket for files
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