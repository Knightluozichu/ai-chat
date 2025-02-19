import { useState } from 'react';
import { Plus, MessageSquare, Edit2, Check, X, Trash2, Loader2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleNewChat = async () => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      await createConversation('新对话');
      toast.success('对话创建成功');
    } catch (error: any) {
      toast.error(error.message || '创建对话失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    if (selectedId === conversation.id) return;
    
    try {
      setSelectedId(conversation.id);
      await setCurrentConversation(conversation);
    } catch (error: any) {
      toast.error(error.message || '切换对话失败');
    } finally {
      setSelectedId(null);
    }
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
    if (isDeleting) return;
    
    try {
      setIsDeleting(id);
      await deleteConversation(id);
      setDeletingId(null);
      toast.success('对话已删除');
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    } finally {
      setIsDeleting(null);
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5" />
            </motion.div>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>新建对话</span>
            </>
          )}
        </motion.button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`group px-4 py-3 hover:bg-gray-700 transition-all ${
                currentConversation?.id === conversation.id ? 'bg-gray-700' : ''
              } ${selectedId === conversation.id ? 'animate-pulse' : ''}`}
            >
              {editingId === conversation.id ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 bg-gray-600 text-white px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        saveTitle(conversation);
                      }
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => saveTitle(conversation)}
                    className="text-green-400 hover:text-green-300 p-1 hover:bg-gray-600 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={cancelEditing}
                    className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectConversation(conversation)}
                    disabled={selectedId === conversation.id}
                    className="ml-2 flex-1 text-left truncate hover:text-blue-300 transition-colors disabled:cursor-wait"
                  >
                    {conversation.title}
                  </motion.button>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startEditing(conversation)}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    {deletingId === conversation.id ? (
                      <div className="flex items-center space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => confirmDelete(conversation.id)}
                          disabled={isDeleting === conversation.id}
                          className="p-1 hover:bg-red-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting === conversation.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="w-4 h-4 text-red-400" />
                            </motion.div>
                          ) : (
                            <Check className="w-4 h-4 text-red-400" />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeletingId(null)}
                          disabled={isDeleting === conversation.id}
                          className="p-1 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeletingId(conversation.id)}
                        className="p-1 hover:bg-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </motion.button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}