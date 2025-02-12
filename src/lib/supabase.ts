import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// 检查环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 环境变量未配置');
  toast.error('系统配置错误，请联系管理员');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'ai-chat'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// 添加响应拦截器
supabase.handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '请求失败');
  }
  return response;
};