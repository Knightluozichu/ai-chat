import toast from 'react-hot-toast';

interface ChatResponse {
  content: string;
  error?: string;
}

interface ChatRequest {
  message: string;
  conversation_id: string;
  user_id: string;
}

const LANGCHAIN_API = {
  chat: '/api/chat',
  history: '/api/chat/history',
};

class LangChainClient {
  private baseUrl: string;
  private timeout: number = 30000;

  constructor(isProd: boolean = false) {
    this.baseUrl = isProd 
      ? (import.meta.env.VITE_LANGCHAIN_API_URL_PROD || 'https://aichatserver-hellsingluo.replit.app/')
      : (import.meta.env.VITE_LANGCHAIN_API_URL || 'https://65f93cec-1177-473b-a2a6-f7f529f80cbe-00-2kt0l4vje8zvw.sisko.replit.dev/');
    
    this.baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${LANGCHAIN_API.chat}/${request.conversation_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.user_id,
            message: request.message
          }),
        }
      );
      
      const data = await response.json();
      return {
        content: data.response
      };
    } catch (error) {
      console.error('发送消息失败:', error);
      throw new Error('与 AI 服务通信失败，请稍后重试');
    }
  }

  async getHistory(conversationId: string): Promise<ChatResponse[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${LANGCHAIN_API.chat}/${conversationId}/history`,
        {
          method: 'GET',
        }
      );
      
      return response.json();
    } catch (error) {
      console.error('获取历史记录失败:', error);
      throw new Error('获取聊天历史失败，请稍后重试');
    }
  }
}

const isProd = import.meta.env.MODE === 'production';
export const langchainClient = new LangChainClient(isProd);