import { useState, lazy, Suspense, memo, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { ResizableSidebar } from '../components/ResizableSidebar';
import { Icon } from '../components/Icon';
import { KnowledgeCapsule } from '../components/KnowledgeBase/KnowledgeCapsule';

const ChatMessages = lazy(() => 
  import('../components/ChatMessages').then(module => ({ 
    default: memo(module.ChatMessages) 
  }))
);

const LoadingSpinner = memo(() => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    <div className="text-gray-500 mt-4">加载中...</div>
  </div>
));

const ChatInput = memo(({ 
  value, 
  onChange, 
  onSend, 
  disabled 
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void>;
  disabled: boolean;
}) => {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!value.trim() || disabled || isSending) return;
    
    try {
      setIsSending(true);
      onChange(''); // 立即清空输入框
      await onSend();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
      <div className="flex space-x-4 max-w-4xl mx-auto">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="输入消息..."
          disabled={disabled || isSending}
          className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled || isSending}
          className="bg-blue-600 text-white rounded-xl px-6 py-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          <Icon name="send" className="w-5 h-5" />
          <span className="hidden sm:inline">
            {isSending ? '发送中...' : '发送'}
          </span>
        </button>
      </div>
    </div>
  );
});

const AiAssistant = () => {
  const {
    currentConversation,
    sendMessage,
    isAiResponding,
    loadConversations,
    conversations,
    loading
  } = useChatStore();
  const { user, signOut } = useAuthStore();
  const [input, setInput] = useState('');

  useEffect(() => {
    console.log('Current conversations:', conversations);
    // 加载会话列表
    loadConversations().catch(error => {
      console.error('Failed to load conversations:', error);
    });
  }, [loadConversations]);

  useEffect(() => {
    console.log('Conversations updated:', conversations);
  }, [conversations]);

  const handleSend = async () => {
    if (!input.trim() || isAiResponding) return;
    
    const message = input;
    setInput('');
    
    try {
      await sendMessage(message);
    } catch (error) {
      setInput(message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <ResizableSidebar />

      <div className="flex-1 flex flex-col">
        <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="bot" className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentConversation?.title || '新对话'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            退出
          </button>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <div className="flex-1 overflow-y-auto">
            <ChatMessages />
          </div>
        </Suspense>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isAiResponding}
        />

        <KnowledgeCapsule />
      </div>
    </div>
  );
};

export default AiAssistant; 