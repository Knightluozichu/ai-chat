import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Category, Question, AnswerResult } from '../types/practice';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface PracticeState {
  categories: Category[];
  currentCategory: Category | null;
  currentQuestion: Question | null;
  showAnswer: boolean;
  loading: boolean;
  error: string | null;

  // 加载分类列表
  fetchCategories: () => Promise<void>;
  // 设置当前分类
  setCurrentCategory: (category: Category | null) => void;
  // 获取随机题目
  fetchRandomQuestion: (categoryId: number) => Promise<void>;
  // 验证答案
  checkAnswer: (userAnswer: string) => AnswerResult;
  // 显示/隐藏答案
  toggleShowAnswer: () => void;
  // 重置状态
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  categories: [],
  currentCategory: null,
  currentQuestion: null,
  showAnswer: false,
  loading: false,
  error: null,

  fetchCategories: async () => {
    try {
      console.log('开始获取分类列表...');
      set({ loading: true, error: null });

      // 使用公开访问模式
      const { data, error, status, statusText } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true })
        .throwOnError();  // 添加这行以确保错误被正确捕获

      // 打印详细的响应信息
      console.log('响应详情:', {
        status,
        statusText,
        dataLength: data?.length ?? 0,
        error,
        data: data ?? []
      });

      if (!data || data.length === 0) {
        // 尝试直接通过 REST API 获取
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=order_index.asc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log('REST API响应:', jsonData);
        
        if (jsonData && Array.isArray(jsonData) && jsonData.length > 0) {
          set({ categories: jsonData });
          return;
        }
        
        console.warn('没有找到任何分类数据');
        set({ categories: [] });
        return;
      }

      console.log('成功获取分类列表:', data);
      set({ categories: data });
    } catch (error) {
      console.error('获取分类列表失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '加载分类失败',
        categories: [] 
      });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentCategory: (category) => {
    console.log('设置当前分类:', category);
    set({ currentCategory: category });
    if (category) {
      console.log('准备获取分类题目, id:', category.id);
      get().fetchRandomQuestion(category.id);
    }
  },

  fetchRandomQuestion: async (categoryId) => {
    try {
      console.log('调用 get_random_question, categoryId:', categoryId);
      set({ loading: true, error: null, showAnswer: false });

      // 记录实际发送的参数
      const params = { p_category_id: String(categoryId) }; // 使用 String() 而不是 parseInt()
      console.log('发送的参数:', JSON.stringify(params));
      
      const { data, error } = await supabase
        .rpc('get_random_question', params);

      console.log('get_random_question 响应:', JSON.stringify({ data, error }));

      if (error) throw error;
      
      if (data) {
        console.log('获取到题目:', JSON.stringify(data));
        set({ currentQuestion: data });
      } else {
        console.warn('没有找到题目, categoryId:', categoryId);
        set({ error: '该分类下暂无题目' });
      }
    } catch (error) {
      console.error('获取题目失败:', error);
      set({ error: '加载题目失败' });
    } finally {
      set({ loading: false });
    }
  },

  checkAnswer: (userAnswer) => {
    const { currentQuestion } = get();
    if (!currentQuestion) {
      return { isCorrect: false, correctAnswer: '', explanation: '没有当前题目' };
    }

    const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    return {
      isCorrect,
      correctAnswer: currentQuestion.answer,
      explanation: currentQuestion.explanation
    };
  },

  toggleShowAnswer: () => {
    set((state) => ({ showAnswer: !state.showAnswer }));
  },

  reset: () => {
    set({
      currentCategory: null,
      currentQuestion: null,
      showAnswer: false,
      error: null
    });
  }
})); 