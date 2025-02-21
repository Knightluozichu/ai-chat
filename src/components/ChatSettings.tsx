import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import toast from 'react-hot-toast';

export function ChatSettings() {
  const { modelProvider, systemPrompt, useWebSearch, useIntentDetection, isLoading, updateSettings } = useSettingsStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    modelProvider,
    systemPrompt,
    useWebSearch,
    useIntentDetection,
  });
  
  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      toast.success('设置已保存');
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || '保存设置失败');
    }
  };
  
  return (
    <div className="border-t border-gray-700 p-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        <SettingsIcon className="w-5 h-5" />
        <span>设置</span>
      </motion.button>
      
      {isOpen && (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-6 h-6 text-blue-500" />
              </motion.div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">模型提供商</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={localSettings.modelProvider === 'deepseek'}
                      onChange={() => setLocalSettings(s => ({ ...s, modelProvider: 'deepseek' }))}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span>DeepSeek</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={localSettings.modelProvider === 'openai'}
                      onChange={() => setLocalSettings(s => ({ ...s, modelProvider: 'openai' }))}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span>OpenAI</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">系统提示词</label>
                <textarea
                  value={localSettings.systemPrompt}
                  onChange={(e) => setLocalSettings(s => ({ ...s, systemPrompt: e.target.value }))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.useWebSearch}
                    onChange={(e) => setLocalSettings(s => ({ ...s, useWebSearch: e.target.checked }))}
                    className="text-blue-500 focus:ring-blue-500 rounded"
                  />
                  <span>使用联网搜索</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.useIntentDetection}
                    onChange={(e) => setLocalSettings(s => ({ ...s, useIntentDetection: e.target.checked }))}
                    className="text-blue-500 focus:ring-blue-500 rounded"
                  />
                  <span>使用意图识别</span>
                </label>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>保存设置</span>
              </motion.button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
