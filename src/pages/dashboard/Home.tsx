import { Link } from 'react-router-dom';
import { FileText, Users, Settings, BarChart } from 'lucide-react';
import { usePostStore } from '../../store/postStore';
import { useEffect } from 'react';

const DashboardHome = () => {
  const { posts, totalCount, fetchPosts } = usePostStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const stats = [
    {
      name: '文章总数',
      value: totalCount,
      icon: FileText,
      color: 'bg-blue-500',
      link: '/dashboard/posts'
    },
    {
      name: '已发布',
      value: posts.filter(post => post.status === 'published').length,
      icon: BarChart,
      color: 'bg-green-500',
      link: '/dashboard/posts'
    },
    {
      name: '草稿箱',
      value: posts.filter(post => post.status === 'draft').length,
      icon: FileText,
      color: 'bg-yellow-500',
      link: '/dashboard/posts'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">仪表盘</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="relative group bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/dashboard/posts"
          className="flex items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <FileText className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">文章管理</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">管理和编辑您的文章内容</p>
          </div>
        </Link>

        <Link
          to="/dashboard/users"
          className="flex items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <Users className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">用户管理</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">管理用户权限和角色</p>
          </div>
        </Link>

        <Link
          to="/dashboard/settings"
          className="flex items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <Settings className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">系统设置</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">配置系统参数和偏好</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome; 