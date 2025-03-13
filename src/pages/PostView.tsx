import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { usePostStore } from '../store/postStore';
import MarkdownWithMermaid from '../components/markdown/MarkdownWithMermaid';

export default function PostView() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentViewPost, setCurrentViewPost } = usePostStore();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setError('未提供文章标识');
        setLoading(false);
        return;
      }

      // 如果 store 中已有文章数据，直接使用
      if (currentViewPost && currentViewPost.slug === slug) {
        setLoading(false);
        return;
      }

      console.log('Fetching post with slug:', slug);
      
      try {
        setLoading(true);
        setError(null);
        
        // 使用原始的编码后的 slug 进行查询
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) {
          console.error('Supabase error:', error);
          setError(error.message);
          return;
        }
        
        if (!data) {
          console.log('No post found with slug:', slug);
          setError('文章不存在');
          return;
        }
        
        console.log('Fetched post data:', data);
        setCurrentViewPost(data);

        // 增加浏览次数
        const { error: updateError } = await supabase
          .rpc('increment_post_view_count', { post_id: data.id });

        if (updateError) {
          console.error('Error incrementing view count:', updateError);
        }
      } catch (error) {
        console.error('Error in fetchPost:', error);
        setError('获取文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, currentViewPost, setCurrentViewPost]);

  // 清理函数：组件卸载时清除当前查看的文章
  useEffect(() => {
    return () => {
      setCurrentViewPost(null);
    };
  }, [setCurrentViewPost]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            文章不存在
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            抱歉，您访问的文章不存在或已被删除。
          </p>
        </div>
      </Container>
    );
  }

  if (!currentViewPost) {
    return (
      <Container>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            文章不存在
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            抱歉，您访问的文章不存在或已被删除。
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <article className="py-8 max-w-4xl mx-auto">
        {/* 文章标题 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {currentViewPost.title}
        </h1>

        {/* 文章元信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <time dateTime={currentViewPost.created_at}>
            {format(new Date(currentViewPost.created_at), 'PPP', { locale: zhCN })}
          </time>
          <span>·</span>
          <span>{Math.ceil(currentViewPost.content.length / 400)} 分钟阅读</span>
          <span>·</span>
          <span>{currentViewPost.view_count || 0} 次阅读</span>
        </div>

        {/* 文章封面图 */}
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={currentViewPost.cover_image || "/assets/doc_pic.jpg"}
              alt={currentViewPost.title}
              className="w-full h-[400px] object-cover"
            />
          </div>

        {/* 文章摘要 */}
        {currentViewPost.excerpt && (
          <div className="mb-8 text-lg text-gray-600 dark:text-gray-400 border-l-4 border-blue-500 pl-4">
            {currentViewPost.excerpt}
          </div>
        )}

        {/* 文章内容 */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MarkdownWithMermaid content={currentViewPost.content} />
        </div>
      </article>
    </Container>
  );
}