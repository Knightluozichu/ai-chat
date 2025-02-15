import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { langchainClient } from '../lib/langchain';
import toast from 'react-hot-toast';

export interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  processed_at?: string;
  created_at: string;
}

interface KnowledgeState {
  files: File[];
  loading: boolean;
  searchQuery: string;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  loadFiles: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  subscribeToFileUpdates: () => () => void;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  files: [],
  loading: false,
  searchQuery: '',

  uploadFile: async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('仅支持 PDF 和 Word 文档');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('文件大小不能超过 10MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('files')
        .insert([{
          user_id: user.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          processing_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        files: [data, ...state.files]
      }));

      // 触发文档处理（使用 langchainClient）
      try {
        await langchainClient.processDocument({
          file_id: data.id,
          url: publicUrl,
          user_id: user.id  // 添加 user_id 参数
        });
        console.log('文档处理请求成功');
      } catch (error: any) {
        console.error('文档处理请求失败:', error);
        
        // 更新文件状态为错误
        await supabase
          .from('files')
          .update({
            processing_status: 'error',
            error_message: error.message || '文档处理服务暂时不可用，请稍后重试'
          })
          .eq('id', data.id);
      }

      toast.success('文件上传成功');
    } catch (error: any) {
      toast.error(error.message || '文件上传失败');
      throw error;
    }
  },

  deleteFile: async (id: string) => {
    try {
      // 先获取文件信息
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 从 Storage 中删除文件
      const filePath = new URL(file.url).pathname.split('/').pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([`${file.user_id}/${filePath}`]);

        if (storageError) {
          console.error('删除存储文件失败:', storageError);
          // 继续删除数据库记录
        }
      }

      // 删除数据库记录（会级联删除 document_chunks）
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      set(state => ({
        files: state.files.filter(file => file.id !== id)
      }));

      toast.success('文件已删除');
    } catch (error: any) {
      toast.error(error.message || '删除失败');
      throw error;
    }
  },

  loadFiles: async () => {
    try {
      set({ loading: true });

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ files: data || [], loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(error.message || '加载文件失败');
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  subscribeToFileUpdates: () => {
    // 订阅文件状态更新
    const subscription = supabase
      .channel('files-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files'
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          switch (eventType) {
            case 'INSERT':
              set(state => ({
                files: [newRecord, ...state.files]
              }));
              break;
            
            case 'UPDATE':
              set(state => ({
                files: state.files.map(file =>
                  file.id === newRecord.id ? { ...file, ...newRecord } : file
                )
              }));

              // 处理完成或失败时显示通知
              if (newRecord.processing_status === 'completed') {
                toast.success('文档处理完成');
              } else if (newRecord.processing_status === 'error') {
                toast.error('文档处理失败: ' + (newRecord.error_message || '未知错误'));
              }
              break;
            
            case 'DELETE':
              set(state => ({
                files: state.files.filter(file => file.id !== oldRecord.id)
              }));
              break;
          }
        }
      )
      .subscribe();

    // 返回取消订阅函数
    return () => {
      subscription.unsubscribe();
    };
  }
}));