import React, { useState } from 'react';
import { Plus, MessageSquare, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function ChatSidebar() {
  const { user } = useAuthStore();
  const { 
    conversations, 
    createConversation, 
    setCurrentConversation, 
    updateConversationTitle,
    deleteConversation,
    currentConversation 
  } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleNewChat = async () => {
    try {
      await createConversation('新对话');
    } catch (error: any) {
      toast.error(error.message || '创建对话失败');
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
  };

  const startEditing = (conversation: any) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteConversation(id);
      toast.success('对话已删除');
      setDeletingId(null);
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const saveTitle = async (conversation: any) => {
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
      cancelEditing();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="p-4 border-b border-gray-700">
        <div className="text-sm text-gray-400 mb-4 truncate">
          {user?.email}
        </div>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>新建对话</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group px-4 py-3 hover:bg-gray-700 transition-colors ${
              currentConversation?.id === conversation.id ? 'bg-gray-700' : ''
            }`}
          >
            {editingId === conversation.id ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="flex-1 bg-gray-600 text-white px-2 py-1 rounded"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveTitle(conversation);
                    }
                  }}
                />
                <button
                  onClick={() => saveTitle(conversation)}
                  className="text-green-400 hover:text-green-300"
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
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <button
                  onClick={() => handleSelectConversation(conversation)}
                  className="ml-2 flex-1 text-left truncate"
                >
                  {conversation.title}
                </button>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(conversation)}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deletingId === conversation.id ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => confirmDelete(conversation.id)}
                        className="p-1 hover:bg-red-600 rounded"
                      >
                        <Check className="w-4 h-4 text-red-400" />
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-1 hover:bg-gray-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(conversation.id)}
                      className="p-1 hover:bg-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}