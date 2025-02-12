import { supabase } from './supabase';

const MAX_RETRIES = 3;
const TIMEOUT = 30000; // 30 seconds

export class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export const chatAPI = {
  async sendMessage(conversationId: string, message: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new APIError('未登录');
      }

      let lastError;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_LANGCHAIN_API_URL}/api/chat/${conversationId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message,
                user_id: user.id,
              }),
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new APIError(
              await response.text(),
              response.status
            );
          }

          return await response.json();
        } catch (error: any) {
          lastError = error;
          if (error.name === 'AbortError') {
            throw new APIError('请求超时');
          }
          // 如果不是最后一次重试，继续重试
          if (i < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            continue;
          }
        }
      }
      throw lastError;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};