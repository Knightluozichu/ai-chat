import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Layout, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { can, permission } = usePermission();

  const navigation = [
    { 
      name: '文章管理', 
      href: '/dashboard/posts', 
      icon: FileText,
      show: () => can('manage_posts')
    },
    { 
      name: '用户管理', 
      href: '/dashboard/users', 
      icon: Users,
      show: () => can('manage_users')
    },
    { 
      name: '系统设置', 
      href: '/dashboard/settings', 
      icon: Settings,
      show: () => can('manage_users')
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/dashboard/login');
  };

  const visibleNavigation = navigation.filter(item => item.show());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 移动端侧边栏遮罩 */}
      <div 
        className={`fixed inset-0 bg-gray-900/80 z-50 ${sidebarOpen ? 'block' : 'hidden'}`} 
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Layout className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-semibold">管理后台</span>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭侧边栏"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {visibleNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.email}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {permission?.role === 'admin' ? '管理员' : 
                   permission?.role === 'editor' ? '编辑者' : '普通用户'}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40">
          <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="打开侧边栏"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex flex-1 justify-end">
              <div className="flex items-center gap-x-4">
                <div className="relative">
                  <button 
                    className="flex items-center gap-x-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    aria-label="帮助菜单"
                  >
                    <span>帮助</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 