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

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 查看权限
CREATE POLICY "Users can view own files"
  ON files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 上传权限
CREATE POLICY "Users can upload own files"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 删除权限
CREATE POLICY "Users can delete own files"
  ON files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);