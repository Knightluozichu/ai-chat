import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatMessages() {
  const { messages = [], isAiResponding, messageError } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '刚刚';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return '刚刚';
      }
      return formatDistanceToNow(date, { locale: zhCN, addSuffix: true });
    } catch (error) {
      return '刚刚';
    }
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-gray-500"
        >
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-2">开始新的对话</h3>
          <p>发送消息开始与AI助手交谈</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`flex items-start space-x-2 ${
              message.isUser ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.isUser ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {message.isUser ? (
                <User className="w-5 h-5 text-blue-500" />
              ) : (
                <Bot className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className={`group max-w-[70%] ${message.isUser ? 'items-end' : 'items-start'}`}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`rounded-2xl px-4 py-2 shadow-sm ${
                  message.isUser
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}
              >
                {message.content}
              </motion.div>
              <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatMessageTime(message.createdAt)}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {isAiResponding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-2"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-gray-500" />
          </div>
          <div className="bg-white text-gray-800 max-w-[70%] rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </div>
        </motion.div>
      )}
      
      {messageError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-sm border border-red-100">
            <p className="text-sm">{messageError}</p>
          </div>
        </motion.div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}