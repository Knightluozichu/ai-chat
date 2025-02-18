import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useChatStore } from './chatStore';
import toast from 'react-hot-toast';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const TIMEOUT = 10000; // 10秒超时

const withTimeout = <T>(promise: Promise<T>, ms: number, operation: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation}超时，请重试`));
    }, ms);
  });

  return Promise.race([
    promise.then((result) => {
      clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise
  ]).catch((error) => {
    clearTimeout(timeoutId);
    throw error;
  });
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      
      signIn: async (email: string, password: string) => {
        try {
          // 1. 清理旧的状态
          useChatStore.getState().clearState();
          
          // 2. 执行登录
          const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({
              email,
              password,
            }),
            TIMEOUT,
            '登录'
          );
          
          if (error) throw error;
          if (!data.user) throw new Error('登录失败：未获取到用户信息');
          
          // 3. 更新用户状态
          set({ user: data.user });
          toast.success('登录成功');
        } catch (error: any) {
          console.error('登录失败:', error);
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('邮箱或密码错误');
          }
          throw new Error(error.message || '登录失败，请重试');
        }
      },
      
      signUp: async (email: string, password: string) => {
        try {
          // 1. 清理旧的状态
          useChatStore.getState().clearState();
          
          // 2. 执行注册
          const { data, error } = await withTimeout(
            supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: window.location.origin,
                data: {
                  email_confirmed: true
                }
              }
            }),
            TIMEOUT,
            '注册'
          );
          
          if (error) throw error;
          if (!data.user) throw new Error('注册失败：未获取到用户信息');
          
          // 3. 更新用户状态
          set({ user: data.user });
          toast.success('注册成功');
        } catch (error: any) {
          console.error('注册失败:', error);
          if (error.message.includes('User already registered')) {
            throw new Error('该邮箱已被注册');
          }
          throw new Error(error.message || '注册失败，请重试');
        }
      },
      
      signOut: async () => {
        try {
          // 1. 清理聊天状态
          useChatStore.getState().clearState();
          
          // 2. 清理本地存储和认证状态
          localStorage.removeItem('sb-fmqreoeqzqdaqdtgqzkc-auth-token');
          set({ user: null });
          
          // 3. 执行 Supabase 登出
          const { error } = await supabase.auth.signOut();
          
          // 4. 如果登出失败，只记录错误
          if (error) {
            console.warn('Supabase 登出异常:', error);
          }
          
          toast.success('已退出登录');
        } catch (error: any) {
          // 5. 即使发生错误，也确保用户处于登出状态
          console.error('退出失败:', error);
          set({ user: null });
          localStorage.removeItem('sb-fmqreoeqzqdaqdtgqzkc-auth-token');
        }
      },
      
      checkAuth: async () => {
        try {
          set({ loading: true });
          
          // 1. 检查会话
          const { data: { session } } = await withTimeout(
            supabase.auth.getSession(),
            TIMEOUT,
            '检查认证状态'
          );
          
          if (session) {
            // 2. 刷新会话
            const { data: { user }, error } = await withTimeout(
              supabase.auth.refreshSession(),
              TIMEOUT,
              '刷新会话'
            );
            
            if (error) {
              console.error('刷新会话失败:', error);
              set({ user: null, loading: false });
              return;
            }
            
            if (user) {
              set({ 
                user: { id: user.id, email: user.email! },
                loading: false 
              });
              return;
            }
          }
          
          // 3. 无有效会话
          set({ user: null, loading: false });
          
        } catch (error: any) {
          console.error('认证检查失败:', error);
          set({ user: null, loading: false });
          
          if (process.env.NODE_ENV === 'development') {
            toast.error(`认证检查失败: ${error.message}`);
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      storage: localStorage
    }
  )
);