import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

export function ChatMessages() {
  const { messages, isAiResponding, messageError } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
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
      
      {isAiResponding && (
        <div className="flex justify-start">
          <div className="bg-white text-gray-800 max-w-[70%] rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
      
      {messageError && (
        <div className="flex justify-center">
          <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg">
            {messageError}
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}