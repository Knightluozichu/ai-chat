import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loadConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  
  loadConversations: async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    set({ conversations: data });
  },
  
  createConversation: async (title) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('请先登录');

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ 
        title,
        user_id: user.id
      }])
      .select()
      .single();
      
    if (error) {
      if (error.code === '42501') {
        throw new Error('创建会话失败：权限不足');
      }
      throw error;
    }

    set((state) => ({
      conversations: [data, ...state.conversations],
      currentConversation: data,
      messages: []
    }));
  },
  
  setCurrentConversation: async (conversation) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    set({
      currentConversation: conversation,
      messages: data,
    });
  },
  
  sendMessage: async (content) => {
    const conversation = get().currentConversation;
    if (!conversation) return;
    
    const { data: userMessage, error: userError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversation.id,
        content,
        is_user: true,
      }])
      .select()
      .single();
      
    if (userError) throw userError;
    
    set((state) => ({
      messages: [...state.messages, userMessage],
    }));
    
    const { data: aiMessage, error: aiError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversation.id,
        content: '这是一个模拟的AI回复。在实际开发中，这里将连接到后端API。',
        is_user: false,
      }])
      .select()
      .single();
      
    if (aiError) throw aiError;
    
    set((state) => ({
      messages: [...state.messages, aiMessage],
    }));
  },

  updateConversationTitle: async (id: string, title: string) => {
    try {
      // 验证用户是否登录
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('请先登录');
      }

      // 先检查对话是否存在且属于当前用户
      const { data: conversation, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !conversation) {
        throw new Error('对话不存在或无权访问');
      }

      // 更新数据库
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // 更新本地状态
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, title } : conv
        ),
        currentConversation: state.currentConversation?.id === id
          ? { ...state.currentConversation, title }
          : state.currentConversation
      }));
      
    } catch (error: any) {
      console.error('更新会话标题失败:', error);
      throw error;
    }
  },
}));