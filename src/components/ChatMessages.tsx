import { useRef, useEffect } from 'react';
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
          <p>发送消息开始与采购助手交谈</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-end gap-2 ${message.is_user ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 ${message.is_user ? 'ml-2' : 'mr-2'}`}>
              {message.is_user ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>

            <div className={`flex flex-col ${message.is_user ? 'items-end' : 'items-start'} max-w-[70%]`}>
              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  message.is_user
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
              </div>
              <span className="text-xs text-gray-500 mt-1 px-2">
                {formatMessageTime(message.created_at)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isAiResponding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end gap-2"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Bot className="w-5 h-5 text-gray-600" />
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5">
            <div className="flex space-x-1">
              <span className="animate-bounce">•</span>
              <span className="animate-bounce [animation-delay:0.2s]">•</span>
              <span className="animate-bounce [animation-delay:0.4s]">•</span>
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
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg">
            {messageError}
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}