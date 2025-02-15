import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Send, LogOut, Bot } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { Auth } from './components/Auth';
import { ResizableSidebar } from './components/ResizableSidebar';

const ChatMessages = lazy(() => import('./components/ChatMessages').then(module => ({ default: module.ChatMessages })));

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Bot className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
      <div className="text-gray-500">加载中...</div>
    </div>
  );
}

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
    if (!input.trim()) return;
    await sendMessage(input);
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
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-blue-500" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-gray-800">
                {currentConversation?.title || 'AI聊天助手'}
              </h1>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>退出</span>
          </button>
        </header>

        <Suspense fallback={<LoadingSpinner />}>
          <ChatMessages />
        </Suspense>

        <div className="bg-white border-t p-4 shadow-lg">
          <div className="flex space-x-4 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="输入消息..."
              disabled={isAiResponding}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isAiResponding}
              className="bg-blue-500 text-white rounded-xl px-6 py-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">发送</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;