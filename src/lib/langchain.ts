interface ChatResponse {
  content: string;
  error?: string;
}

interface ChatRequest {
  message: string;
  conversation_id: string;
  user_id: string;
}

interface DocumentProcessRequest {
  file_id: string;
  url: string;
  user_id: string;
}

interface DocumentStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processedChunks?: number;
  totalChunks?: number;
}

const LANGCHAIN_API = {
  chat: '/api/chat',
  history: '/api/chat/history',
  processDocument: '/api/documents/process',
  documentStatus: '/api/documents/{file_id}/status'
};

class LangChainClient {
  private baseUrl: string;
  private timeout: number = 60000;
  private retryCount: number = 3;
  private retryDelay: number = 1000;
  private pollInterval: number = 1000; // 增加轮询间隔到1秒

  constructor(isProd: boolean = false) {
    this.baseUrl = isProd 
      ? (import.meta.env.VITE_LANGCHAIN_API_URL_PROD || 'https://aichatserver-hellsingluo.replit.app/')
      : (import.meta.env.VITE_LANGCHAIN_API_URL || 'https://65f93cec-1177-473b-a2a6-f7f529f80cbe-00-2kt0l4vje8zvw.sisko.replit.dev/');
    
    this.baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = this.retryCount
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error: any) {
      if (retries > 0 && error.name === 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  async pollDocumentStatus(fileId: string): Promise<DocumentStatus> {
    const url = `${this.baseUrl}${LANGCHAIN_API.documentStatus.replace('{file_id}', fileId)}`;
    console.log('📡 轮询文档状态:', { fileId, url });
    
    try {
      console.log('🚀 发送状态请求...');
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('📥 收到状态响应:', data);
      return data as DocumentStatus;
    } catch (error: any) {
      console.error('❌ 获取文档状态失败:', error);
      throw new Error('获取文档处理状态失败');
    }
  }

  async processDocument(
    request: DocumentProcessRequest
  ): Promise<void> {
    console.log('📄 开始处理文档:', request);
    try {
      // 发送处理请求
      console.log('🚀 发送处理请求...');
      const response = await this.fetchWithRetry(
        `${this.baseUrl}${LANGCHAIN_API.processDocument}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );
      
      const result = await response.json();
      console.log('📥 处理请求响应:', result);

      // 等待处理完成
      console.log('⏳ 等待处理完成...');
      let status: DocumentStatus;
      
      do {
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        status = await this.pollDocumentStatus(request.file_id);
        console.log('📊 当前处理状态:', status);
        
        if (status.status === 'error') {
          console.error('❌ 处理出错:', status.error);
          throw new Error(status.error || '文档处理失败');
        }
      } while (status.status === 'processing' || status.status === 'pending');

      console.log('✅ 文档处理完成');
    } catch (error: any) {
      console.error('❌ 处理文档失败:', error);
      throw new Error(error.message || '文档处理服务暂时不可用，请稍后重试');
    }
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.fetchWithRetry(
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
    } catch (error: any) {
      console.error('发送消息失败:', error);
      if (error.name === 'AbortError') {
        throw new Error('AI响应超时，正在重试...');
      }
      throw new Error(error.message || 'AI服务暂时不可用，请稍后重试');
    }
  }

  async getHistory(conversationId: string): Promise<ChatResponse[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}${LANGCHAIN_API.chat}/${conversationId}/history`,
        {
          method: 'GET',
        }
      );
      
      return response.json();
    } catch (error: any) {
      console.error('获取历史记录失败:', error);
      throw new Error(error.message || '获取聊天历史失败，请稍后重试');
    }
  }
}

const isProd = import.meta.env.MODE === 'production';
export const langchainClient = new LangChainClient(isProd);