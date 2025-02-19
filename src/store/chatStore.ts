import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { withSupabaseTimeout } from '../utils/supabaseUtils';
import { PostgrestResponse } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  isAiResponding: boolean;
  messageError: string | null;
  
  // Actions
  createConversation: (title: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearState: () => void;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

const MESSAGES_PER_PAGE = 20;

const normalizeMessage = (message: any): Message => ({
  id: message.id,
  content: message.content,
  isUser: message.role === 'user',
  createdAt: message.created_at,
});

const normalizeConversation = (conversation: any): Conversation => {
  console.log('Normalizing conversation:', conversation);
  return {
    id: conversation.id,
    title: conversation.title || '新对话',
    createdAt: conversation.created_at,
  };
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  hasMore: true,
  loadingMore: false,
  isAiResponding: false,
  messageError: null,

  clearState: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      loading: false,
      error: null,
      hasMore: true,
      loadingMore: false,
      isAiResponding: false,
      messageError: null
    });
  },

  loadConversations: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Loading conversations for user:', user.id);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Received conversations:', data);
      const normalizedConversations = (data || []).map(normalizeConversation);
      console.log('Normalized conversations:', normalizedConversations);
      
      set({ conversations: normalizedConversations });
    } catch (error: any) {
      console.error('加载会话列表失败:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createConversation: async (title: string) => {
    try {
      set({ loading: true });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const { data, error } = await withSupabaseTimeout<PostgrestResponse<any>>(
        supabase
          .from('conversations')
          .insert({
            user_id: user?.id,  
            title: title
          })
          .select()
          .single()
      );

      if (error) throw error;

      const conversation = normalizeConversation(data);
      set(state => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation
      }));
    } catch (error: any) {
      console.error('创建会话失败:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  loadMessages: async (conversationId: string) => {
    try {
      set({ loading: true });

      const { data, error } = await withSupabaseTimeout<PostgrestResponse<any>>(
        supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(MESSAGES_PER_PAGE)
      );

      if (error) throw error;

      set({
        messages: (data || []).map(normalizeMessage),
        hasMore: (data?.length || 0) >= MESSAGES_PER_PAGE
      });
    } catch (error: any) {
      console.error('加载消息失败:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadMoreMessages: async () => {
    const { currentConversation, messages, loadingMore } = get();
    if (!currentConversation || loadingMore) return;

    try {
      set({ loadingMore: true });

      const lastMessage = messages[0];
      if (!lastMessage) return;

      const { data, error } = await withSupabaseTimeout<PostgrestResponse<any>>(
        supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConversation.id)
          .lt('created_at', lastMessage.createdAt)
          .order('created_at', { ascending: true })
          .limit(MESSAGES_PER_PAGE)
      );

      if (error) throw error;

      set({
        messages: [...(data || []).map(normalizeMessage), ...messages],
        hasMore: (data?.length || 0) >= MESSAGES_PER_PAGE,
        loadingMore: false
      });
    } catch (error: any) {
      console.error('加载更多消息失败:', error);
      set({ loadingMore: false });
      throw error;
    }
  },

  sendMessage: async (content: string) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    try {
      set({ loading: true, isAiResponding: true });

      // 保存用户消息
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: userMessage, error: userError } = await withSupabaseTimeout<PostgrestResponse<any>>(
        supabase
          .from('messages')
          .insert({
            conversation_id: currentConversation.id,
            content,
            role: 'user',
            user_id: currentUser?.id,  
          })
          .select()
          .single()
      );

      if (userError) throw userError;

      set(state => ({
        messages: [...state.messages, normalizeMessage(userMessage)]
      }));

      // 保存 AI 回复
      try {
        const { data: aiMessage, error: aiError } = await withSupabaseTimeout<PostgrestResponse<any>>(
          supabase
            .from('messages')
            .insert({
              conversation_id: currentConversation.id,
              content: '这是一个模拟的 AI 回复',
              role: 'assistant'
            })
            .select()
            .single()
        );

        if (aiError) throw aiError;

        set(state => ({
          messages: [...state.messages, normalizeMessage(aiMessage)],
          isAiResponding: false,
          messageError: null
        }));
      } catch (error: any) {
        // 如果 AI 回复失败，保存一个错误消息
        const { data: errorAiMessage, error: saveError } = await withSupabaseTimeout<PostgrestResponse<any>>(
          supabase
            .from('messages')
            .insert({
              conversation_id: currentConversation.id,
              content: '抱歉，处理您的请求时出现了错误。',
              role: 'assistant',
              error: error.message
            })
            .select()
            .single()
        );

        if (!saveError) {
          set(state => ({
            messages: [...state.messages, normalizeMessage(errorAiMessage)],
            isAiResponding: false,
            messageError: null
          }));
        }

        throw error;
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      set({ loading: false, isAiResponding: false, messageError: error.message });
      throw error;
    }
  },

  updateConversationTitle: async (id: string, title: string) => {
    try {
      const { error } = await withSupabaseTimeout<PostgrestResponse<any>>(
        supabase
          .from('conversations')
          .update({ title })
          .eq('id', id)
      );

      if (error) throw error;

      set(state => ({
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

  deleteConversation: async (id: string) => {
    try {
      const { error } = await withSupabaseTimeout<PostgrestResponse<any>>(
        supabase
          .from('conversations')
          .delete()
          .eq('id', id)
      );

      if (error) throw error;

      set(state => ({
        conversations: state.conversations.filter(conv => conv.id !== id),
        currentConversation: state.currentConversation?.id === id ? null : state.currentConversation
      }));
    } catch (error: any) {
      console.error('删除会话失败:', error);
      throw error;
    }
  }
}));