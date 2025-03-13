import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Category, Question } from '../types/practice';

interface PracticeManagementState {
  // 状态
  categories: Category[];
  questions: Question[];
  currentQuestion: Question | null;
  loadingCategories: boolean;
  loadingQuestions: boolean;
  error: string | null;
  
  // 分类管理方法
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  updateCategoryOrder: (id: number, newOrder: number) => Promise<void>;
  
  // 题目管理方法
  fetchQuestions: (categoryId?: number) => Promise<void>;
  createQuestion: (data: Omit<Question, 'id' | 'created_at'>) => Promise<void>;
  updateQuestion: (id: string, data: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
}

export const usePracticeManagementStore = create<PracticeManagementState>((set, get) => ({
  // 初始状态
  categories: [],
  questions: [],
  currentQuestion: null,
  loadingCategories: false,
  loadingQuestions: false,
  error: null,

  // 分类管理实现
  fetchCategories: async () => {
    try {
      set({ loadingCategories: true, error: null });
      const { data: categories, error } = await supabase
        .rpc('get_categories_with_count')
        .throwOnError();

      if (error) throw error;
      set({ categories: categories || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取分类失败' });
    } finally {
      set({ loadingCategories: false });
    }
  },

  createCategory: async (name) => {
    try {
      set({ error: null });
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, order_index: 0 }])
        .select()
        .single();

      if (error) throw error;
      const { categories } = get();
      set({ categories: [...categories, data] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建分类失败' });
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      set({ error: null });
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      const { categories } = get();
      set({
        categories: categories.map(cat =>
          cat.id === id ? { ...cat, ...data } : cat
        )
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新分类失败' });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ error: null });
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const { categories } = get();
      set({ categories: categories.filter(cat => cat.id !== id) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除分类失败' });
      throw error;
    }
  },

  updateCategoryOrder: async (id, newOrder) => {
    try {
      set({ error: null });
      const { error } = await supabase
        .rpc('update_category_order', {
          p_category_id: id,
          p_new_order: newOrder
        });

      if (error) throw error;
      await get().fetchCategories(); // 重新获取分类列表以确保顺序正确
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新分类顺序失败' });
      throw error;
    }
  },

  // 题目管理实现
  fetchQuestions: async (categoryId) => {
    try {
      set({ loadingQuestions: true, error: null });
      let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      set({ questions: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取题目失败' });
    } finally {
      set({ loadingQuestions: false });
    }
  },

  createQuestion: async (data) => {
    try {
      set({ error: null });
      const { data: newQuestion, error } = await supabase
        .from('questions')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      const { questions } = get();
      set({ questions: [newQuestion, ...questions] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建题目失败' });
      throw error;
    }
  },

  updateQuestion: async (id, data) => {
    try {
      set({ error: null });
      const { error } = await supabase
        .from('questions')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      const { questions } = get();
      set({
        questions: questions.map(q =>
          q.id === id ? { ...q, ...data } : q
        )
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新题目失败' });
      throw error;
    }
  },

  deleteQuestion: async (id) => {
    try {
      set({ error: null });
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const { questions } = get();
      set({ questions: questions.filter(q => q.id !== id) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除题目失败' });
      throw error;
    }
  },
}));