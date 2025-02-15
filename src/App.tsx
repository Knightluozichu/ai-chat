import React, { useEffect, useState, lazy, Suspense, memo } from 'react';
import { Send, LogOut, Bot } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { Auth } from './components/Auth';
import { ResizableSidebar } from './components/ResizableSidebar';
import { KnowledgeCapsule } from './components/KnowledgeBase/KnowledgeCapsule';

// 性能监控
if (process.env.NODE_ENV === 'development' && window.performance) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log(`${entry.name}: ${entry.duration}ms`);
    });
  });
  observer.observe({ entryTypes: ['measure'] });
}

const ChatMessages = lazy(() => 
  import('./components/ChatMessages').then(module => ({ 
    default: memo(module.ChatMessages) 
  }))
);

const LoadingSpinner = memo(() => (
  <div className="flex flex-col items-center justify-center h-full">
    <Bot className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
    <div className="text-gray-500">加载中...</div>
  </div>
));

const Header = memo(({ title, email, onSignOut }: { 
  title: string;
  email: string;
  onSignOut: () => void;
}) => (
  <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <Bot className="w-6 h-6 text-blue-500" />
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <span className="text-sm text-gray-500">{email}</span>
      </div>
    </div>
    <button
      onClick={onSignOut}
      className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <LogOut className="w-5 h-5" />
      <span>退出</span>
    </button>
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
  onSend: () => void;
  disabled: boolean;
}) => (
  <div className="bg-white border-t p-4 shadow-lg">
    <div className="flex space-x-4 max-w-4xl mx-auto">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
        placeholder="输入消息..."
        disabled={disabled}
        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="bg-blue-500 text-white rounded-xl px-6 py-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
      >
        <Send className="w-5 h-5" />
        <span className="hidden sm:inline">发送</span>
      </button>
    </div>
  </div>
));

function App() {
  if (window.performance) {
    performance.mark('app-start');
  }
  
  const { user, loading, checkAuth, signOut } = useAuthStore();
  const {
    currentConversation,
    sendMessage,
    loadConversations,
    isAiResponding
  } = useChatStore();
  const [input, setInput] = useState('');

  useEffect(() => {
    const measurePerformance = async () => {
      if (!window.performance) return;
      
      performance.mark('auth-check-start');
      await checkAuth();
      performance.mark('auth-check-end');
      performance.measure('Auth Check Time', 'auth-check-start', 'auth-check-end');
    };
    
    measurePerformance();
  }, [checkAuth]);

  useEffect(() => {
    const measureConversations = async () => {
      if (!window.performance || !user) return;
      
      performance.mark('load-conversations-start');
      await loadConversations();
      performance.mark('load-conversations-end');
      performance.measure(
        'Load Conversations Time',
        'load-conversations-start',
        'load-conversations-end'
      );
    };
    
    measureConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (window.performance) {
      performance.mark('app-end');
      performance.measure('Total App Init Time', 'app-start', 'app-end');
    }
  }, []);

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
    if (!input.trim()) return;
    
    if (window.performance) {
      performance.mark('send-message-start');
    }
    
    await sendMessage(input);
    
    if (window.performance) {
      performance.mark('send-message-end');
      performance.measure(
        'Message Send Time',
        'send-message-start',
        'send-message-end'
      );
    }
    
    setInput('');
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

      <div className="flex-1 flex flex-col">
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
      </div>

      <KnowledgeCapsule />
    </div>
  );
}

export default memo(App);