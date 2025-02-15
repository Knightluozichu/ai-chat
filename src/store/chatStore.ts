import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { langchainClient } from '../lib/langchain';
import toast from 'react-hot-toast';

const MESSAGES_PER_PAGE = 20;
const TIMEOUT = 5000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('请求超时')), ms)
    )
  ]);
};

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string;
  conversation_id?: string;
  is_user?: boolean;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  created_at?: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isAiResponding: boolean;
  messageError: string | null;
  currentPage: number;
  hasMore: boolean;
  loadConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
}

const normalizeMessage = (message: any): Message => ({
  id: message.id,
  content: message.content,
  isUser: message.is_user,
  createdAt: message.created_at,
});

const normalizeConversation = (conversation: any): Conversation => ({
  id: conversation.id,
  title: conversation.title,
  createdAt: conversation.created_at,
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      messages: [],
      isAiResponding: false,
      messageError: null,
      currentPage: 1,
      hasMore: true,
      
      loadConversations: async () => {
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('conversations')
              .select('*')
              .order('created_at', { ascending: false }),
            TIMEOUT
          );
            
          if (error) throw error;
          set({ conversations: data.map(normalizeConversation) });
        } catch (error: any) {
          console.error('加载对话失败:', error);
          toast.error('加载对话失败，请刷新重试');
        }
      },
      
      loadMoreMessages: async () => {
        const { currentConversation, currentPage, messages } = get();
        if (!currentConversation) return;

        try {
          const { data, error } = await withTimeout(
            supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', currentConversation.id)
              .order('created_at', { ascending: true })
              .range(currentPage * MESSAGES_PER_PAGE, (currentPage + 1) * MESSAGES_PER_PAGE - 1),
            TIMEOUT
          );
            
          if (error) throw error;
          
          const newMessages = data.map(normalizeMessage);
          set({ 
            messages: [...messages, ...newMessages],
            currentPage: currentPage + 1,
            hasMore: data.length === MESSAGES_PER_PAGE
          });
        } catch (error: any) {
          console.error('加载更多消息失败:', error);
          toast.error('加载更多消息失败，请重试');
        }
      },
      
      createConversation: async (title) => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('请先登录');

        try {
          const { data, error } = await withTimeout(
            supabase
              .from('conversations')
              .insert([{ 
                title,
                user_id: user.id
              }])
              .select()
              .single(),
            TIMEOUT
          );
            
          if (error) {
            if (error.code === '42501') {
              throw new Error('创建会话失败：权限不足');
            }
            throw error;
          }

          const normalizedConversation = normalizeConversation(data);
          set((state) => ({
            conversations: [normalizedConversation, ...state.conversations],
            currentConversation: normalizedConversation,
            messages: [],
            currentPage: 1,
            hasMore: true
          }));
        } catch (error: any) {
          console.error('创建对话失败:', error);
          throw error;
        }
      },
      
      setCurrentConversation: async (conversation) => {
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: true })
              .limit(MESSAGES_PER_PAGE),
            TIMEOUT
          );
            
          if (error) throw error;
          set({
            currentConversation: conversation,
            messages: data.map(normalizeMessage),
            currentPage: 1,
            hasMore: data.length === MESSAGES_PER_PAGE
          });
        } catch (error: any) {
          console.error('加载消息失败:', error);
          toast.error('加载消息失败，请重试');
        }
      },
      
      sendMessage: async (content) => {
        const conversation = get().currentConversation;
        if (!conversation) return;
        
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) throw new Error('请先登录');

          const { data: userMessage, error: userError2 } = await withTimeout(
            supabase
              .from('messages')
              .insert([{
                conversation_id: conversation.id,
                content,
                is_user: true,
              }])
              .select()
              .single(),
            TIMEOUT
          );
            
          if (userError2) throw userError2;
          
          set(state => ({
            messages: [...state.messages, normalizeMessage(userMessage)],
            isAiResponding: true,
            messageError: null,
          }));

          try {
            const aiResponse = await withTimeout(
              langchainClient.sendMessage({
                message: content,
                conversation_id: conversation.id,
                user_id: user.id,
              }),
              30000 // AI响应给30秒超时
            );

            const { data: aiMessage, error: aiError } = await withTimeout(
              supabase
                .from('messages')
                .insert([{
                  conversation_id: conversation.id,
                  content: aiResponse.content,
                  is_user: false,
                }])
                .select()
                .single(),
              TIMEOUT
            );
              
            if (aiError) throw aiError;
            
            set(state => ({
              messages: [...state.messages, normalizeMessage(aiMessage)],
              isAiResponding: false,
              messageError: null,
            }));
          } catch (error: any) {
            const errorMessage = error.message || '与 AI 服务通信失败，请稍后重试';
            
            const { data: errorAiMessage, error: saveError } = await withTimeout(
              supabase
                .from('messages')
                .insert([{
                  conversation_id: conversation.id,
                  content: errorMessage,
                  is_user: false,
                }])
                .select()
                .single(),
              TIMEOUT
            );

            if (!saveError && errorAiMessage) {
              set(state => ({
                messages: [...state.messages, normalizeMessage(errorAiMessage)],
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
      },

      updateConversationTitle: async (id: string, title: string) => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error('请先登录');
          }

          const { data: conversation, error: checkError } = await withTimeout(
            supabase
              .from('conversations')
              .select('id')
              .eq('id', id)
              .eq('user_id', user.id)
              .single(),
            TIMEOUT
          );

          if (checkError || !conversation) {
            throw new Error('对话不存在或无权访问');
          }

          const { error: updateError } = await withTimeout(
            supabase
              .from('conversations')
              .update({ title })
              .eq('id', id),
            TIMEOUT
          );

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

      deleteConversation: async (id: string) => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error('请先登录');
          }

          const { error } = await withTimeout(
            supabase
              .from('conversations')
              .delete()
              .eq('id', id)
              .eq('user_id', user.id),
            TIMEOUT
          );

          if (error) {
            throw error;
          }

          set((state) => ({
            conversations: state.conversations.filter(conv => conv.id !== id),
            currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
            messages: state.currentConversation?.id === id ? [] : state.messages
          }));
        } catch (error: any) {
          console.error('删除对话失败:', error);
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