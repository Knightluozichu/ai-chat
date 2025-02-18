-- 创建分类表
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(name)
);

-- 插入所有顶级分类
INSERT INTO categories (name, order_index) VALUES
('Python', 1),
('C++', 2),
('C#', 3),
('Java', 4),
('Unity引擎', 5),
('图形', 6),
('UE引擎', 7),
('Pytorch', 8),
('Numpy', 9),
('ML', 10),
('DL', 11),
('Tensorflow', 12),
('CV', 13),
('NLP', 14),
('LLM', 15),
('Agent', 16),
('Replit', 17);

-- 创建题目表
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id INT REFERENCES categories(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 设置公开访问权限
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开查看分类"
  ON categories FOR SELECT
  TO anon
  USING (true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开查看题目"
  ON questions FOR SELECT
  TO anon
  USING (true);

-- 创建随机获取题目的函数
CREATE OR REPLACE FUNCTION get_random_question(p_category_id INT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  answer TEXT,
  explanation TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.title, q.content, q.answer, q.explanation
  FROM questions q
  WHERE q.category_id = p_category_id
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;