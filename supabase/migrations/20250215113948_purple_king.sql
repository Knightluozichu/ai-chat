/*
  # 修复文件表结构

  1. 重建 files 表
    - 保留原有字段
    - 添加文档处理相关字段
    - 重新创建索引和约束

  2. 重建 document_chunks 表
    - 添加向量搜索支持
    - 设置安全策略

  3. 安全性
    - 启用 RLS
    - 添加访问策略
    - 设置存储权限
*/

-- 启用 vector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 删除现有表和相关对象
DROP TABLE IF EXISTS document_chunks;
DROP TABLE IF EXISTS files;
DROP FUNCTION IF EXISTS update_files_updated_at();

-- 重建 files 表
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  processing_status text NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_files_updated_at();

-- 创建 document_chunks 表
CREATE TABLE document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- 启用行级安全
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- files 表的访问策略
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

CREATE POLICY "Users can update own files"
  ON files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- document_chunks 表的访问策略
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

CREATE POLICY "Service role can insert document chunks"
  ON document_chunks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 确保存储桶配置
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('files', 'files', true)
  ON CONFLICT (id) DO NOTHING;

  -- 公共读取权限
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES
    ('Public Read Access', 'files', '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Anonymous":["*"]},"Action":["select"],"Resource":["*"]}]}')
  ON CONFLICT (name, bucket_id) DO NOTHING;

  -- 认证用户上传权限
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES
    ('Authenticated Upload Access', 'files', '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Claims":["authenticated"]},"Action":["insert"],"Resource":["*"]}]}')
  ON CONFLICT (name, bucket_id) DO NOTHING;
END $$;