import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Search, FileText, Trash2, Download, Loader2, AlertCircle } from 'lucide-react';
import { useKnowledgeStore } from '../../store/knowledgeStore';
import toast from 'react-hot-toast';

interface KnowledgePanelProps {
  onClose: () => void;
}

export function KnowledgePanel({ onClose }: KnowledgePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const {
    files,
    loading,
    searchQuery,
    uploadFile,
    deleteFile,
    loadFiles,
    setSearchQuery,
    subscribeToFileUpdates
  } = useKnowledgeStore();

  useEffect(() => {
    loadFiles();
    // 订阅文件更新
    const unsubscribe = subscribeToFileUpdates();
    return () => {
      unsubscribe();
    };
  }, [loadFiles, subscribeToFileUpdates]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadFile(file as any);
      event.target.value = '';
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个文件吗？此操作不可恢复。')) {
      return;
    }

    try {
      setIsDeleting(id);
      await deleteFile(id);
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

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'processing':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getProcessingStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '处理完成';
      case 'error':
        return '处理失败';
      case 'processing':
        return '处理中';
      default:
        return '等待处理';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-[480px] bg-white shadow-2xl flex flex-col animate-slide-in">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">知识库</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 操作栏 */}
      <div className="px-6 py-4 space-y-4">
        {/* 上传按钮 */}
        <div className="flex justify-between items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>上传文件</span>
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文件..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">
              {searchQuery ? '未找到相关文件' : '暂无文件'}
            </p>
            <p className="text-sm mt-2">
              {searchQuery ? '请尝试其他关键词' : '点击上方按钮上传文件'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-800">{file.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {file.type === 'application/pdf' ? 'PDF' : 'Word'} 文件
                        </span>
                        <span className="text-sm text-gray-300">•</span>
                        <span className={`text-sm ${getProcessingStatusColor(file.processing_status)}`}>
                          {getProcessingStatusText(file.processing_status)}
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
                    <a
                      href={file.url}
                      download
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="下载"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting === file.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="删除"
                    >
                      {isDeleting === file.id ? (
                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}