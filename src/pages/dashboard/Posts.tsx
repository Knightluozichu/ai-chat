import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { Post } from '../../types/post';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Pagination } from '../../components/Pagination';

const Posts = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuthStore();
  const {
    posts,
    totalCount,
    loading,
    filters,
    fetchPosts,
    setFilters,
    createPost,
    deletePost,
    updatePostStatus
  } = usePostStore();

  // 初始加载和过滤器变化时获取文章
  useEffect(() => {
    fetchPosts();
  }, [filters, fetchPosts]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchTerm, page: 1 });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters]);

  const handleCreatePost = async () => {
    if (isCreating || !user) return;
    setIsCreating(true);
    try {
      const post = await createPost('新文章', user.id);
      navigate(`/dashboard/posts/${post.id}/edit`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      await deletePost(id);
    }
  };

  const handleStatusChange = async (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await updatePostStatus(post.id, newStatus);
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回仪表盘
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">文章管理</h1>
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            共 {totalCount} 篇文章
          </p>
        </div>
        <button
          onClick={handleCreatePost}
          disabled={isCreating}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          新建文章
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-lg">
            <label htmlFor="search" className="sr-only">搜索文章</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="搜索文章标题..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    浏览量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    发布时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusChange(post)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {post.status === 'published' ? '已发布' : '草稿'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {post.view_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {post.published_at
                        ? format(new Date(post.published_at), 'yyyy年MM月dd日', { locale: zhCN })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/posts/${post.slug}`}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          title="查看"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/dashboard/posts/${post.id}/edit`}
                          className="text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                          title="编辑"
                        >
                          <Edit2 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-400 hover:text-red-500 dark:hover:text-red-300"
                          title="删除"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {!loading && totalCount > 0 && (
        <Pagination
          currentPage={filters.page || 1}
          totalPages={Math.ceil(totalCount / (filters.per_page || 10))}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default Posts; 