import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MDEditor from '@uiw/react-md-editor';

const PostEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    is_featured: false,
    seo_title: '',
    seo_description: ''
  });

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id);
        if (data && data.length > 0) {
          setPost(data[0]);
          setFormData({
            title: data[0].title,
            slug: data[0].slug,
            excerpt: data[0].excerpt || '',
            content: data[0].content,
            cover_image: data[0].cover_image || '',
            is_featured: data[0].is_featured,
            seo_title: data[0].seo_title || '',
            seo_description: data[0].seo_description || ''
          });
        }
      } catch (error) {
        console.error('获取文章失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleContentChange = (value?: string) => {
    setFormData(prev => ({ ...prev, content: value || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !post) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) {
        console.error('Failed to save post:', error);
      } else {
        console.log('文章保存成功');
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">文章不存在</p>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 py-6 ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard/posts')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回列表
        </button>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => window.open(`/posts/${post.slug}`, '_blank')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="w-4 h-4 mr-2" />
            预览
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            标题
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL 标识
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            摘要
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            内容
          </label>
          <div className="prose max-w-none">
            <MDEditor
              value={formData.content}
              onChange={handleContentChange}
              preview="edit"
              height={500}
              className="w-full"
              hideToolbar={false}
              enableScroll={true}
              data-color-mode={isDarkMode ? 'dark' : 'light'}
              highlightEnable={true}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            封面图片
          </label>
          <input
            type="text"
            id="cover_image"
            name="cover_image"
            value={formData.cover_image}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_featured"
            name="is_featured"
            checked={formData.is_featured}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            特色文章
          </label>
        </div>

        <div>
          <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            SEO 标题
          </label>
          <input
            type="text"
            id="seo_title"
            name="seo_title"
            value={formData.seo_title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            SEO 描述
          </label>
          <textarea
            id="seo_description"
            name="seo_description"
            value={formData.seo_description}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </form>
    </div>
  );
};

export default PostEdit;