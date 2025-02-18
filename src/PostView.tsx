import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Post } from '../types/post';
import { supabase } from '../lib/supabase';
import MDEditor from '@uiw/react-md-editor';

export default function PostView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      console.log('Fetching post with slug:', slug);
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          setError(error.message);
          throw error;
        }
        
        console.log('Fetched post data:', data);
        setPost(data);
      } catch (error) {
        console.error('Error in fetchPost:', error);
        setError('获取文章失败');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    } else {
      console.log('No slug provided');
      setError('未提供文章标识');
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <Container>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {error || '文章不存在'}
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            抱歉，您访问的文章不存在或已被删除。
          </p>
          <button
            onClick={() => navigate('/posts')}
            className="mt-8 text-blue-600 hover:text-blue-500"
          >
            返回文章列表
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <article className="py-8 max-w-4xl mx-auto">
        {/* 文章标题 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {post.title}
        </h1>

        {/* 文章元信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <time dateTime={post.created_at}>
            {format(new Date(post.created_at), 'PPP', { locale: zhCN })}
          </time>
          <span>·</span>
          <span>{Math.ceil(post.content.length / 400)} 分钟阅读</span>
          <span>·</span>
          <span>{post.view_count || 0} 次阅读</span>
        </div>

        {/* 文章封面图 */}
        {post.cover_url && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.cover_url}
              alt={post.title}
              className="w-full h-[400px] object-cover"
            />
          </div>
        )}

        {/* 文章摘要 */}
        {post.excerpt && (
          <div className="mb-8 text-lg text-gray-600 dark:text-gray-400 border-l-4 border-blue-500 pl-4">
            {post.excerpt}
          </div>
        )}

        {/* 文章内容 */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MDEditor.Markdown source={post.content} />
        </div>
      </article>
    </Container>
  );
} 