import React, { useState } from 'react';
import { Plus, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { useChatStore, Conversation } from '../store/chatStore';
import toast from 'react-hot-toast';

export function ChatSidebar() {
  const { conversations, createConversation, setCurrentConversation, updateConversationTitle } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleNewChat = async () => {
    try {
      await createConversation('新对话');
    } catch (error: any) {
      toast.error(error.message || '创建对话失败');
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveTitle = async (conversation: Conversation) => {
    if (!editingTitle.trim()) {
      toast.error('标题不能为空');
      return;
    }
    try {
      await updateConversationTitle(conversation.id, editingTitle.trim());
      setEditingId(null);
      toast.success('重命名成功');
    } catch (error: any) {
      toast.error(error.message || '重命名失败');
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full">
      <button
        onClick={handleNewChat}
        className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-700"
      >
        <Plus className="w-5 h-5" />
        <span>新建对话</span>
      </button>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="flex items-center px-4 py-3 hover:bg-gray-700 group"
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            
            {editingId === conversation.id ? (
              <div className="flex items-center ml-2 flex-1">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="bg-gray-600 text-white px-2 py-1 rounded flex-1 mr-2"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveTitle(conversation);
                    }
                  }}
                />
                <button
                  onClick={() => saveTitle(conversation)}
                  className="text-green-400 hover:text-green-300 mr-1"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleSelectConversation(conversation)}
                  className="ml-2 truncate flex-1 text-left"
                >
                  {conversation.title}
                </button>
                <button
                  onClick={() => startEditing(conversation)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}