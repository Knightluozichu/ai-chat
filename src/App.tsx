import React, { useEffect, useState } from 'react';
import { Send, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { Auth } from './components/Auth';
import { ChatSidebar } from './components/ChatSidebar';

function App() {
  const { user, loading, checkAuth, signOut } = useAuthStore();
  const {
    messages,
    currentConversation,
    sendMessage,
    loadConversations,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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
    <div className="flex h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <ChatSidebar />

      <div className="flex-1 flex flex-col">
        {/* 聊天头部 */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            {currentConversation?.title || 'AI聊天助手'}
          </h1>
          <button
            onClick={signOut}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <LogOut className="w-5 h-5" />
            <span>退出</span>
          </button>
        </header>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* 输入区域 */}
        <div className="bg-white border-t p-4">
          <div className="flex space-x-4 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;