import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Category, Question, AnswerResult } from '../types/practice';

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

      // 打印请求信息
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('请求配置:', {
        headers: supabase.rest.headers
      });

      const { data, error, status, statusText } = await supabase
        .from('categories')
        .select('*')
        .order('order_index');

      // 打印响应信息
      console.log('响应状态:', status, statusText);
      console.log('响应数据:', data);
      console.log('响应错误:', error);

      if (error) {
        console.error('Supabase错误:', error);
        throw error;
      }

      if (!data || data.length === 0) {
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
    set({ currentCategory: category });
    if (category) {
      get().fetchRandomQuestion(category.id);
    }
  },

  fetchRandomQuestion: async (categoryId) => {
    try {
      set({ loading: true, error: null, showAnswer: false });
      const { data, error } = await supabase
        .rpc('get_random_question', { p_category_id: categoryId });

      if (error) throw error;
      if (data && data.length > 0) {
        set({ currentQuestion: data[0] });
      } else {
        set({ error: '该分类下暂无题目' });
      }
    } catch (error) {
      console.error('Error fetching question:', error);
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