import { create } from 'zustand';
import { langchainClient } from '../lib/langchain';

interface SettingsState {
  modelProvider: 'deepseek' | 'openai';
  systemPrompt: string;
  useWebSearch: boolean;
  useIntentDetection: boolean;
  isLoading: boolean;
  
  // Actions
  updateSettings: (settings: Partial<SettingsState>) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  modelProvider: 'deepseek',
  systemPrompt: '',
  useWebSearch: false,
  useIntentDetection: false,
  isLoading: true,
  
  loadSettings: async () => {
    try {
      const response = await fetch(langchainClient.getApiUrl('/api/settings'), {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const settings = await response.json();
      set((state) => ({
        ...state,
        ...settings,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      set((state) => ({ ...state, isLoading: false }));
      throw new Error(error.message || '加载设置失败');
    }
  },
  
  updateSettings: async (settings) => {
    try {
      // 更新本地状态
      set((state) => ({
        ...state,
        ...settings
      }));
      
      // 发送设置到服务器
      await fetch(langchainClient.getApiUrl('/api/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      throw new Error(error.message || '更新设置失败');
    }
  },
}));

// Initialize the store by calling loadSettings
useSettingsStore.getState().loadSettings();
