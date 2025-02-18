-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------ 1. 创建核心表 ------

-- 1.1 创建文章表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    is_featured BOOLEAN DEFAULT false,
    reading_time INTEGER,
    view_count INTEGER DEFAULT 0,
    author_id UUID REFERENCES auth.users NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    seo_title TEXT,
    seo_description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'))
);

-- 1.2 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 创建用户配置表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    social_links JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

------ 2. 创建关联表 ------

-- 2.1 创建文章-标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, tag_id)
);

-- 2.2 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

------ 3. 创建触发器 ------

-- 3.1 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3.2 为posts表添加触发器
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.3 为user_profiles表添加触发器
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

------ 4. 设置RLS策略 ------

-- 4.1 Posts表策略
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by everyone" 
    ON posts FOR SELECT 
    USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Users can create their own posts" 
    ON posts FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
    ON posts FOR UPDATE 
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
    ON posts FOR DELETE 
    USING (auth.uid() = author_id);

-- 4.2 Tags表策略
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" 
    ON tags FOR SELECT 
    TO PUBLIC USING (true);

CREATE POLICY "Only authenticated users can create tags" 
    ON tags FOR INSERT 
    TO authenticated WITH CHECK (true);

-- 4.3 Comments表策略
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
    ON comments FOR SELECT 
    TO PUBLIC USING (true);

CREATE POLICY "Authenticated users can create comments" 
    ON comments FOR INSERT 
    TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own comments" 
    ON comments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
    ON comments FOR DELETE 
    USING (auth.uid() = user_id);

------ 5. 创建索引 ------

-- 5.1 文章表索引
CREATE INDEX posts_slug_idx ON posts(slug);
CREATE INDEX posts_status_idx ON posts(status);
CREATE INDEX posts_created_at_idx ON posts(created_at);

-- 5.2 标签表索引
CREATE INDEX tags_slug_idx ON tags(slug);

-- 5.3 评论表索引
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);

-- 添加一些初始标签数据
INSERT INTO tags (name, slug, description) VALUES
    ('React', 'react', 'React相关文章'),
    ('TypeScript', 'typescript', 'TypeScript相关文章'),
    ('Web开发', 'web-development', 'Web开发相关文章'),
    ('前端', 'frontend', '前端开发相关文章'); 