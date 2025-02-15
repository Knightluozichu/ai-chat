import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { langchainClient } from '../lib/langchain';
import toast from 'react-hot-toast';

const MESSAGES_PER_PAGE = 20;
const TIMEOUT = 15000;
const AI_RESPONSE_TIMEOUT = 60000;

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
  clearState: () => void;
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

      clearState: () => {
        set({
          conversations: [],
          currentConversation: null,
          messages: [],
          isAiResponding: false,
          messageError: null,
          currentPage: 1,
          hasMore: true
        });
      },
      
      loadConversations: async () => {
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('conversations')
              .select('*')
              .order('created_at', { ascending: false }),
            TIMEOUT,
            '加载对话列表'
          );
            
          if (error) throw error;
          
          const normalizedConversations = data.map(normalizeConversation);
          set({ 
            conversations: normalizedConversations,
            // 清空当前会话和消息
            currentConversation: null,
            messages: []
          });
          
          // 如果有对话，自动加载第一个
          if (normalizedConversations.length > 0) {
            await get().setCurrentConversation(normalizedConversations[0]);
          }
        } catch (error: any) {
          console.error('加载对话失败:', error);
          throw new Error(error.message || '加载对话失败，请重试');
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
            TIMEOUT,
            '加载更多消息'
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
          throw new Error(error.message || '加载更多消息失败，请重试');
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
            TIMEOUT,
            '创建对话'
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
            TIMEOUT,
            '加载对话消息'
          );
            
          if (error) throw error;
          
          set({
            currentConversation: conversation,
            messages: data.map(normalizeMessage),
            currentPage: 1,
            hasMore: data.length === MESSAGES_PER_PAGE,
            messageError: null
          });
        } catch (error: any) {
          console.error('加载消息失败:', error);
          throw new Error(error.message || '加载消息失败，请重试');
        }
      },
      
      sendMessage: async (content) => {
        const conversation = get().currentConversation;
        if (!conversation) {
          toast.error('请先选择或创建一个对话');
          return;
        }
        
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) throw new Error('请先登录');

          set(state => ({
            isAiResponding: true,
            messageError: null
          }));

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
            TIMEOUT,
            '发送消息'
          );
            
          if (userError2) throw userError2;
          
          set(state => ({
            messages: [...state.messages, normalizeMessage(userMessage)]
          }));

          try {
            const aiResponse = await withTimeout(
              langchainClient.sendMessage({
                message: content,
                conversation_id: conversation.id,
                user_id: user.id,
              }),
              AI_RESPONSE_TIMEOUT,
              'AI响应'
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
              TIMEOUT,
              '保存AI响应'
            );
              
            if (aiError) throw aiError;
            
            set(state => ({
              messages: [...state.messages, normalizeMessage(aiMessage)],
              isAiResponding: false,
              messageError: null,
            }));
          } catch (error: any) {
            console.error('AI响应失败:', error);
            const errorMessage = error.message === 'signal is aborted without reason' 
              ? 'AI响应超时，请重试'
              : error.message || 'AI响应失败，请重试';
            
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
              TIMEOUT,
              '保存错误消息'
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
            
            toast.error(errorMessage);
          }
          
        } catch (error: any) {
          console.error('发送消息失败:', error);
          const errorMessage = error.message === 'signal is aborted without reason'
            ? '发送消息超时，请重试'
            : error.message || '发送消息失败，请重试';
            
          set({ 
            isAiResponding: false,
            messageError: errorMessage
          });
          
          toast.error(errorMessage);
          throw error;
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
            TIMEOUT,
            '检查对话权限'
          );

          if (checkError || !conversation) {
            throw new Error('对话不存在或无权访问');
          }

          const { error: updateError } = await withTimeout(
            supabase
              .from('conversations')
              .update({ title })
              .eq('id', id),
            TIMEOUT,
            '更新对话标题'
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
            TIMEOUT,
            '删除对话'
          );

          if (error) {
            throw error;
          }

          set((state) => {
            const newState = {
              conversations: state.conversations.filter(conv => conv.id !== id),
              currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
              messages: state.currentConversation?.id === id ? [] : state.messages
            };
            
            // 如果删除了当前对话，自动切换到第一个对话
            if (state.currentConversation?.id === id && newState.conversations.length > 0) {
              get().setCurrentConversation(newState.conversations[0]);
            }
            
            return newState;
          });
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
      onRehydrateStorage: () => (state) => {
        // 重新加载时清空消息和状态
        if (state) {
          state.messages = [];
          state.isAiResponding = false;
          state.messageError = null;
          state.currentPage = 1;
          state.hasMore = true;
        }
      }
    }
  )
);