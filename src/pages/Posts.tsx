import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Post } from '../types/post';
import { supabase } from '../lib/supabase';
import { usePostStore } from '../store/postStore';

export default function Posts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const generateSlug = (title: string) => {
    return title
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-') // 只保留字母、数字、下划线和中文
      .replace(/^-+|-+$/g, ''); // 删除开头和结尾的横线
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // 处理每篇文章的 slug
        const postsWithSlug = await Promise.all((data || []).map(async post => {
          if (!post.slug) {
            const newSlug = generateSlug(post.title);
            // 更新数据库中的 slug
            const { error: updateError } = await supabase
              .from('posts')
              .update({ slug: newSlug })
              .eq('id', post.id);

            if (updateError) {
              console.error('Error updating slug:', updateError);
              return post;
            }

            return { ...post, slug: newSlug };
          }
          return post;
        }));
        
        console.log('Fetched posts:', postsWithSlug);
        setPosts(postsWithSlug);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostClick = (e: React.MouseEvent, post: Post) => {
    e.preventDefault();
    if (!post.slug) {
      console.error('Post has no slug:', post);
      return;
    }
    console.log('Navigating to post:', post.slug);
    // 将文章数据存储到 store
    usePostStore.getState().setCurrentViewPost(post);
    navigate(`/posts/${post.slug}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          文章列表
        </h1>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">暂无文章</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group block cursor-pointer"
                onClick={(e) => handlePostClick(e, post)}
              >
                <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                  {post.cover_image && (
                    <div className="w-32 h-20 overflow-hidden rounded">
                      <img
                        className="w-full h-full object-cover"
                        src={post.cover_image}
                        alt={post.title}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-500">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime={post.created_at}>
                        {format(new Date(post.created_at), 'PPP', {
                          locale: zhCN,
                        })}
                      </time>
                      <span className="mx-2">·</span>
                      <span>{Math.ceil(post.content.length / 400)} 分钟阅读</span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
} 