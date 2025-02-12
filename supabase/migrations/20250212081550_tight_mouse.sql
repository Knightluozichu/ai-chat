/*
  # Add update policy for conversations table with proper documentation

  1. Changes
    - Drop existing update policy if exists (to avoid conflicts)
    - Add RLS policy for UPDATE operations on conversations table
    
  2. Security
    - Allow authenticated users to update their own conversations
    - Maintain data isolation between users
    - Ensure both USING and WITH CHECK clauses for complete security
*/

-- First drop the policy if it exists to avoid conflicts
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND policyname = 'Users can update own conversations'
  ) THEN
    DROP POLICY "Users can update own conversations" ON conversations;
  END IF;
END $$;

-- Create the update policy
CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify RLS is enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;