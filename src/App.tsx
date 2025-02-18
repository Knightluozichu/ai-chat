import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { useAuthStore } from './store/authStore';

// 前台页面
const Home = lazy(() => import('./pages/Home'));
const Posts = lazy(() => import('./pages/Posts'));
const PostView = lazy(() => import('./pages/PostView'));
const About = lazy(() => import('./pages/About'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));

// 后台页面
const DashboardLogin = lazy(() => import('./pages/dashboard/Login'));
const DashboardRegister = lazy(() => import('./pages/dashboard/Register'));
const DashboardPosts = lazy(() => import('./pages/dashboard/Posts'));
const PostEdit = lazy(() => import('./pages/dashboard/PostEdit'));

// 加载动画组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
);

// 需要登录的路由
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/dashboard/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
          </Route>

          {/* AI助手路由 - 独立布局 */}
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
              <Route path="posts" element={<DashboardPosts />} />
              <Route path="posts/:id/edit" element={<PostEdit />} />
              <Route index element={<Navigate to="posts" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App; 