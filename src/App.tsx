import React, { useEffect, useState, lazy, Suspense, memo } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { Auth } from './components/Auth';
import { ResizableSidebar } from './components/ResizableSidebar';
import { Icon } from './components/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeCapsule } from './components/KnowledgeBase/KnowledgeCapsule';

const ChatMessages = lazy(() => 
  import('./components/ChatMessages').then(module => ({ 
    default: memo(module.ChatMessages) 
  }))
);

const LoadingSpinner = memo(() => (
  <div className="flex flex-col items-center justify-center h-full">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Icon name="bot" className="w-12 h-12 text-blue-500" />
    </motion.div>
    <div className="text-gray-500 mt-4">加载中...</div>
  </div>
));

const Header = memo(({ title, email, onSignOut }: { 
  title: string;
  email: string;
  onSignOut: () => void;
}) => (
  <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <Icon name="bot" className="w-6 h-6 text-blue-500" />
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <span className="text-sm text-gray-500">{email}</span>
      </div>
    </div>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSignOut}
      className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Icon name="log-out" className="w-5 h-5" />
      <span>退出</span>
    </motion.button>
  </header>
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
    <div className="bg-white border-t p-4 shadow-lg">
      <div className="flex space-x-4 max-w-4xl mx-auto">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="输入消息..."
          disabled={disabled || isSending}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={!value.trim() || disabled || isSending}
          className="bg-blue-500 text-white rounded-xl px-6 py-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          <Icon name="send" className="w-5 h-5" />
          <span className="hidden sm:inline">
            {isSending ? '发送中...' : '发送'}
          </span>
        </motion.button>
      </div>
    </div>
  );
});

function App() {
  const { user, loading, checkAuth, signOut } = useAuthStore();
  const {
    currentConversation,
    sendMessage,
    loadConversations,
    isAiResponding
  } = useChatStore();
  const [input, setInput] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleSend = async () => {
    if (!input.trim() || isAiResponding) return;
    
    const message = input; // 保存消息内容
    setInput(''); // 立即清空输入框
    
    try {
      await sendMessage(message);
    } catch (error) {
      setInput(message); // 如果发送失败，恢复消息内容
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <ResizableSidebar />

      <div className="flex-1 flex flex-col relative">
        <Header
          title={currentConversation?.title || 'AI聊天助手'}
          email={user.email}
          onSignOut={signOut}
        />

        <Suspense fallback={<LoadingSpinner />}>
          <ChatMessages />
        </Suspense>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isAiResponding}
        />

        {/* 知识库胶囊悬浮窗 */}
        <KnowledgeCapsule />
      </div>
    </div>
  );
}

export default memo(App);