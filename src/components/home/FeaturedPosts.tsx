import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../layout/Container';
import { Clock, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types/post';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { usePostStore } from '../../store/postStore';

const PostCard = ({ post }: { post: Post }) => {
  const { setCurrentViewPost } = usePostStore();

  const handleClick = () => {
    setCurrentViewPost(post);
  };

  return (
    <Link 
      to={`/posts/${post.slug}`}
      onClick={handleClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 hover:shadow-lg"
    >
      <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
        {post.cover_image && (
          <img
            src={`${post.cover_image}?w=800&auto=format&fit=crop`}
            alt={post.title}
            className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      
      <div className="flex-1 p-6">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Clock className="w-4 h-4 mr-1" />
          <span>{Math.ceil(post.content.length / 400)} 分钟阅读</span>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {post.title}
        </h3>
        
        {post.excerpt && (
          <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        
        <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
          <span className="text-sm font-medium">阅读全文</span>
          <ArrowUpRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
      </div>
    </Link>
  );
};

export const FeaturedPosts = () => {
  const [loading, setLoading] = useState(true);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Error fetching featured posts:', error);
          return;
        }

        setFeaturedPosts(data || []);
      } catch (error) {
        console.error('Error in fetchFeaturedPosts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              精选文章
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              探索我们精心挑选的技术文章，了解AI领域的最新进展和实践经验
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm p-4 animate-pulse"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (featuredPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            精选文章
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            探索我们精心挑选的技术文章，了解AI领域的最新进展和实践经验
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/posts"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            查看更多文章
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </Container>
    </section>
  );
}; 