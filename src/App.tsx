import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import DashboardLayout from './components/dashboard/DashboardLayout';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// 前台页面
const Home = lazy(() => import('./pages/Home'));
const Posts = lazy(() => import('./pages/Posts'));
const PostView = lazy(() => import('./pages/PostView'));
const About = lazy(() => import('./pages/About'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));
const Practice = lazy(() => import('./pages/Practice'));
const Tools = lazy(() => import('./pages/Tools'));

// 后台页面
const DashboardHome = lazy(() => import('./pages/dashboard/Home'));
const DashboardLogin = lazy(() => import('./pages/dashboard/Login'));
const DashboardRegister = lazy(() => import('./pages/dashboard/Register'));
const DashboardPosts = lazy(() => import('./pages/dashboard/Posts'));
const DashboardUsers = lazy(() => import('./pages/dashboard/Users'));
const DashboardSettings = lazy(() => import('./pages/dashboard/Settings'));
const PostEdit = lazy(() => import('./pages/dashboard/PostEdit'));
const PracticeManagement = lazy(() => import('./pages/dashboard/PracticeManagement'));

// 加载动画组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
);

// 需要登录的路由
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // 将当前路径作为重定向参数
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/dashboard/login?redirect=${redirectPath}`} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();
  const { applyTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 初始化主题
  useEffect(() => {
    applyTheme();
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* 前台路由 */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/posts/:slug" element={<PostView />} />
            <Route path="/about" element={<About />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/tools" element={<Tools />} />
          </Route>

          {/* 采购助手路由 - 独立布局 */}
          <Route
            path="/ai-assistant"
            element={
              <PrivateRoute>
                <div className="h-screen">
                  <AiAssistant />
                </div>
              </PrivateRoute>
            }
          />

          {/* 后台路由 */}
          <Route path="/dashboard">
            <Route path="login" element={<DashboardLogin />} />
            <Route path="register" element={<DashboardRegister />} />
            <Route
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="posts" element={<DashboardPosts />} />
              <Route path="users" element={<DashboardUsers />} />
              <Route path="settings" element={<DashboardSettings />} />
              <Route path="posts/:id/edit" element={<PostEdit />} />
              <Route path="practice" element={<PracticeManagement />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App; 