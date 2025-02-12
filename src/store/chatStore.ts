import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { chatAPI } from '../lib/api';
import { monitor } from '../lib/monitor';
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
  isLoading: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  
  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const startTime = performance.now();
      
      const { data, error } = await retryOperation(async () => {
        const response = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (response.error) {
          throw response.error;
        }
        return response;
      });
        
      if (error) throw error;
      set({ conversations: data || [] });
      
      monitor.timing('loadConversations', performance.now() - startTime);
    } catch (error: any) {
      const errorMessage = '加载对话列表失败：' + (error.message || '未知错误');
      set({ error: errorMessage });
      toast.error(errorMessage);
      monitor.error(error, { action: 'loadConversations' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // ... 其他方法保持不变
}));