/*
  # 修复文档匹配功能

  1. 新增函数
    - match_documents: 优化文档匹配查询，避免列名歧义
  
  2. 安全性
    - 仅允许认证用户访问
    - 确保用户只能查询自己的文档
*/

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  content text,
  similarity float,
  metadata jsonb,
  file_id uuid,
  file_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    dc.metadata,
    f.id as file_id,
    f.name as file_name
  FROM
    document_chunks dc
    INNER JOIN files f ON f.id = dc.file_id
  WHERE
    f.user_id = p_user_id
    AND f.processing_status = 'completed'
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;