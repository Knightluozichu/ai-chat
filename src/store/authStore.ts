import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const TIMEOUT = 5000; // 5秒超时

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('请求超时')), ms)
    )
  ]);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      signIn: async (email, password) => {
        try {
          const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({
              email,
              password,
            }),
            TIMEOUT
          );
          if (error) throw error;
          if (data.user) {
            set({ user: { id: data.user.id, email: data.user.email! } });
          }
        } catch (error: any) {
          if (error.message === '请求超时') {
            throw new Error('登录超时，请重试');
          }
          throw error;
        }
      },
      signUp: async (email, password) => {
        try {
          const { data, error } = await withTimeout(
            supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: window.location.origin // 添加重定向URL
              }
            }),
            TIMEOUT
          );
          if (error) throw error;
          if (data.user) {
            set({ user: { id: data.user.id, email: data.user.email! } });
          }
        } catch (error: any) {
          if (error.message === '请求超时') {
            throw new Error('注册超时，请重试');
          }
          throw error;
        }
      },
      signOut: async () => {
        try {
          const { error } = await withTimeout(
            supabase.auth.signOut(),
            TIMEOUT
          );
          if (error) throw error;
          set({ user: null });
          // 清除本地存储中的会话数据
          localStorage.removeItem('sb-fmqreoeqzqdaqdtgqzkc-auth-token');
        } catch (error: any) {
          if (error.message === '请求超时') {
            throw new Error('退出超时，请重试');
          }
          throw error;
        }
      },
      checkAuth: async () => {
        try {
          // 先检查本地会话
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // 如果有会话，刷新它
            const { data: { user }, error } = await supabase.auth.refreshSession();
            if (error) {
              set({ user: null, loading: false });
              return;
            }
            set({ 
              user: user ? { id: user.id, email: user.email! } : null,
              loading: false 
            });
          } else {
            set({ user: null, loading: false });
          }
        } catch (error: any) {
          console.error('认证检查失败:', error);
          set({ user: null, loading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      storage: localStorage // 显式指定使用 localStorage
    }
  )
);