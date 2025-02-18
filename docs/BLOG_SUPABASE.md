# 博客系统数据库设计文档

## 数据库表结构

### 1. 核心表设计

#### 1.1 文章表 (posts)
```sql
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,                    -- 文章标题
    slug TEXT UNIQUE NOT NULL,              -- URL友好的文章标识
    excerpt TEXT,                           -- 文章摘要
    content TEXT NOT NULL,                  -- 文章内容（Markdown格式）
    cover_image TEXT,                       -- 封面图片URL
    is_featured BOOLEAN DEFAULT false,      -- 是否为精选文章
    reading_time INTEGER,                   -- 预估阅读时间（分钟）
    view_count INTEGER DEFAULT 0,           -- 浏览次数
    author_id UUID REFERENCES auth.users NOT NULL, -- 作者ID
    published_at TIMESTAMPTZ,               -- 发布时间
    created_at TIMESTAMPTZ DEFAULT now(),   -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT now(),   -- 更新时间
    seo_title TEXT,                         -- SEO标题
    seo_description TEXT,                   -- SEO描述
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')) -- 文章状态
);
```

#### 1.2 标签表 (tags)
```sql
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                     -- 标签名称
    slug TEXT UNIQUE NOT NULL,              -- URL友好的标签标识
    description TEXT,                       -- 标签描述
    created_at TIMESTAMPTZ DEFAULT now()    -- 创建时间
);
```

#### 1.3 文章-标签关联表 (post_tags)
```sql
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, tag_id)
);
```

#### 1.4 评论表 (comments)
```sql
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- 关联的文章ID
    user_id UUID REFERENCES auth.users NOT NULL,         -- 评论用户ID
    content TEXT NOT NULL,                               -- 评论内容
    parent_id UUID REFERENCES comments(id),              -- 父评论ID（用于回复功能）
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.5 用户配置表 (user_profiles)
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    display_name TEXT,                      -- 显示名称
    avatar_url TEXT,                        -- 头像URL
    bio TEXT,                              -- 个人简介
    website TEXT,                          -- 个人网站
    social_links JSONB,                    -- 社交媒体链接
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. 自动更新触发器

```sql
-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为posts表添加触发器
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为user_profiles表添加触发器
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. 行级安全策略 (RLS)

#### 3.1 Posts表策略
```sql
-- 启用RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 查看权限：已发布的文章所有人可见，草稿只有作者可见
CREATE POLICY "Published posts are viewable by everyone" 
    ON posts FOR SELECT 
    USING (status = 'published' OR auth.uid() = author_id);

-- 创建权限：认证用户可以创建文章
CREATE POLICY "Users can create their own posts" 
    ON posts FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

-- 更新权限：作者可以更新自己的文章
CREATE POLICY "Users can update their own posts" 
    ON posts FOR UPDATE 
    USING (auth.uid() = author_id);

-- 删除权限：作者可以删除自己的文章
CREATE POLICY "Users can delete their own posts" 
    ON posts FOR DELETE 
    USING (auth.uid() = author_id);
```

#### 3.2 Tags表策略
```sql
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" 
    ON tags FOR SELECT 
    TO PUBLIC USING (true);

CREATE POLICY "Only authenticated users can create tags" 
    ON tags FOR INSERT 
    TO authenticated WITH CHECK (true);
```

#### 3.3 Comments表策略
```sql
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
```

### 4. 性能优化索引

```sql
-- 文章表索引
CREATE INDEX posts_slug_idx ON posts(slug);
CREATE INDEX posts_status_idx ON posts(status);
CREATE INDEX posts_created_at_idx ON posts(created_at);

-- 标签表索引
CREATE INDEX tags_slug_idx ON tags(slug);

-- 评论表索引
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
```

## 使用说明

### 1. 文章状态管理
- `draft`: 草稿状态，只有作者可见
- `published`: 已发布状态，所有人可见
- `archived`: 归档状态，只有作者可见

### 2. 数据关系
- 一篇文章可以有多个标签 (多对多关系通过 post_tags 表实现)
- 一篇文章可以有多个评论 (一对多关系)
- 评论支持嵌套回复 (通过 parent_id 实现)
- 每个用户都有一个对应的 profile (一对一关系)

### 3. 安全考虑
- 所有表都启用了行级安全性(RLS)
- 通过策略确保用户只能操作自己的数据
- 公开数据（如已发布的文章）对所有人可见
- 私密数据（如草稿）只对作者可见

### 4. 性能优化
- 为常用查询字段创建了索引
- 使用触发器自动更新时间戳
- 使用 UUID 作为主键，避免ID冲突

### 5. 扩展性
- 预留了SEO相关字段
- 支持文章特色标记
- 灵活的用户配置存储
- 评论系统支持多级回复
