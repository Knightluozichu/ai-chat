import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { langchainClient } from '../lib/langchain';
import toast from 'react-hot-toast';
import { persist } from 'zustand/middleware';

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
  isAiResponding: boolean;
  messageError: string | null;
  loadConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
}

// 添加防抖函数
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        resolve(func(...args));
      }, wait);
    });
  };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      messages: [],
      isAiResponding: false,
      messageError: null,
      
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
      
      sendMessage: debounce(async (content) => {
        const conversation = get().currentConversation;
        if (!conversation) return;
        
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) throw new Error('请先登录');

          const { data: userMessage, error: userError2 } = await supabase
            .from('messages')
            .insert([{
              conversation_id: conversation.id,
              content,
              is_user: true,
            }])
            .select()
            .single();
            
          if (userError2) throw userError2;
          
          set(state => ({
            messages: [...state.messages, userMessage],
            isAiResponding: true,
            messageError: null,
          }));

          try {
            const aiResponse = await langchainClient.sendMessage({
              message: content,
              conversation_id: conversation.id,
              user_id: user.id,
            });

            const { data: aiMessage, error: aiError } = await supabase
              .from('messages')
              .insert([{
                conversation_id: conversation.id,
                content: aiResponse.content,
                is_user: false,
              }])
              .select()
              .single();
              
            if (aiError) throw aiError;
            
            set(state => ({
              messages: [...state.messages, aiMessage],
              isAiResponding: false,
              messageError: null,
            }));
          } catch (error: any) {
            const errorMessage = error.message || '与 AI 服务通信失败，请稍后重试';
            
            const { data: errorAiMessage, error: saveError } = await supabase
              .from('messages')
              .insert([{
                conversation_id: conversation.id,
                content: errorMessage,
                is_user: false,
              }])
              .select()
              .single();

            if (!saveError && errorAiMessage) {
              set(state => ({
                messages: [...state.messages, errorAiMessage],
                isAiResponding: false,
                messageError: null,
              }));
            } else {
              set(state => ({
                isAiResponding: false,
                messageError: errorMessage,
              }));
            }
          }
          
        } catch (error: any) {
          set({ 
            isAiResponding: false,
            messageError: error.message 
          });
          toast.error(error.message || '发送消息失败');
        }
      }, 300),

      updateConversationTitle: async (id: string, title: string) => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error('请先登录');
          }

          const { data: conversation, error: checkError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          if (checkError || !conversation) {
            throw new Error('对话不存在或无权访问');
          }

          const { error: updateError } = await supabase
            .from('conversations')
            .update({ title })
            .eq('id', id);

          if (updateError) {
            throw updateError;
          }

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
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversation: state.currentConversation,
      }),
    }
  )
);