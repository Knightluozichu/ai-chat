import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Search, FileText, Trash2, Download, Loader2, AlertCircle } from 'lucide-react';
import { useKnowledgeStore } from '../../store/knowledgeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FileLoadingOverlay } from './FileLoadingOverlay';

interface KnowledgePanelProps {
  onClose: () => void;
}

export function KnowledgePanel({ onClose }: KnowledgePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const {
    files,
    loading,
    isFileLoading,
    searchQuery,
    uploadFile,
    deleteFile,
    loadFiles,
    setSearchQuery,
    subscribeToFileUpdates
  } = useKnowledgeStore();

  // 初始化加载和订阅
  useEffect(() => {
    loadFiles();
    const unsubscribe = subscribeToFileUpdates();
    return () => {
      unsubscribe();
    };
  }, [loadFiles, subscribeToFileUpdates]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ 未选择文件');
      return;
    }

    // 保存选中的文件信息用于显示
    setSelectedFile({
      name: file.name,
      size: file.size
    });

    console.log('📤 准备上传文件:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      await uploadFile(file as any);
      console.log('✅ 文件上传成功');
      event.target.value = '';
    } catch (error) {
      console.error('❌ 文件上传失败:', error);
    } finally {
      setSelectedFile(null);  // 清除选中的文件信息
    }
  };

  const handleDelete = async (id: string) => {
    console.log('🗑️ 准备删除文件:', id);
    
    if (!confirm('确定要删除这个文件吗？此操作不可恢复。')) {
      console.log('❌ 取消删除');
      return;
    }

    try {
      setIsDeleting(id);
      console.log('⏳ 删除中...');
      await deleteFile(id);
      console.log('✅ 删除成功');
    } catch (error) {
      console.error('❌ 删除失败:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          text: '处理完成'
        };
      case 'error':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          text: '处理失败'
        };
      case 'processing':
        return {
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          text: '正在处理'
        };
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          text: '等待处理'
        };
    }
  };

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-screen w-[480px] bg-white shadow-2xl flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">知识库</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        {/* 操作栏 */}
        <div className="px-6 py-4 space-y-4">
          {/* 上传按钮 */}
          <div className="flex justify-between items-center">
            <label className="hidden" htmlFor="file-upload">
              选择要上传的文件
            </label>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              title="选择要上传的文件"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>上传文件</span>
            </motion.button>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* 文件列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-8 h-8 text-blue-500" />
              </motion.div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-gray-500"
            >
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">
                {searchQuery ? '未找到相关文件' : '暂无文件'}
              </p>
              <p className="text-sm mt-2">
                {searchQuery ? '请尝试其他关键词' : '点击上方按钮上传文件'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {filteredFiles.map((file) => {
                  const status = getStatusInfo(file.processing_status);
                  
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{file.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500">
                                {formatFileSize(file.size)} • {file.type === 'application/pdf' ? 'PDF' : 'Word'} 文件
                              </span>
                              <span className="text-sm text-gray-300">•</span>
                              <span className={`text-sm ${status.color} px-2 py-0.5 rounded-full ${status.bgColor}`}>
                                {status.text}
                              </span>
                            </div>
                            {file.error_message && (
                              <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{file.error_message}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <motion.a
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            href={file.url}
                            download
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="下载"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </motion.a>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(file.id)}
                            disabled={isDeleting === file.id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="删除"
                          >
                            {isDeleting === file.id ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              >
                                <Loader2 className="w-4 h-4 text-red-500" />
                              </motion.div>
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isFileLoading && selectedFile && (
          <FileLoadingOverlay
            fileName={selectedFile.name}
            fileSize={formatFileSize(selectedFile.size)}
          />
        )}
      </AnimatePresence>
    </>
  );
}