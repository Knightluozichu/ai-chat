import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  isFileLoading: boolean;
  searchQuery: string;
  uploadFile: (file: Blob) => Promise<void>;
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

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  files: [],
  loading: false,
  isFileLoading: false,
  searchQuery: '',

  uploadFile: async (file: Blob) => {
    console.log('开始上传文件:', (file as any).name);
    set({ isFileLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      if (!ALLOWED_TYPES.includes((file as any).type)) {
        throw new Error('仅支持 PDF 和 Word 文档');
      }

      if ((file as any).size > MAX_FILE_SIZE) {
        throw new Error('文件大小不能超过 10MB');
      }

      const fileExt = (file as any).name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 上传文件到存储
      console.log('开始上传到 Supabase 存储');
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('上传失败:', uploadError);
        throw uploadError;
      }

      console.log('文件上传成功');

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      // 创建文件记录
      const { data: fileRecord, error } = await supabase
        .from('files')
        .insert([{
          user_id: user.id,
          name: (file as any).name,
          size: (file as any).size,
          type: (file as any).type,
          url: publicUrl,
          processing_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // 开始处理文档
      console.log('开始处理文档');
      try {
        await supabase
          .from('files')
          .update({
            processing_status: 'processing'
          })
          .eq('id', fileRecord.id);
      } catch (error: any) {
        console.error('文档处理失败:', error);
        await supabase
          .from('files')
          .update({
            processing_status: 'error',
            error_message: error.message || '文档处理服务暂时不可用，请稍后重试'
          })
          .eq('id', fileRecord.id);
          
        throw error;
      }

    } catch (error: any) {
      console.error('文件上传过程失败:', error);
      throw error;
    } finally {
      set({ isFileLoading: false });
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

      // 从存储中删除文件
      const filePath = new URL(file.url).pathname.split('/').pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([`${file.user_id}/${filePath}`]);

        if (storageError) {
          console.error('删除存储文件失败:', storageError);
        }
      }

      // 删除数据库记录
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      set(state => ({
        files: state.files.filter(file => file.id !== id)
      }));
    } catch (error: any) {
      throw error;
    }
  },

  loadFiles: async () => {
    console.log('开始加载文件列表');
    try {
      set({ loading: true });

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('加载文件失败:', error);
        throw error;
      }

      console.log('文件加载成功:', data.length + '个文件');
      set({ files: data, loading: false });
    } catch (error: any) {
      console.error('加载文件失败:', error);
      set({ loading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  subscribeToFileUpdates: () => {
    console.log('初始化文件更新订阅');
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
          console.log('收到文件更新:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          switch (eventType) {
            case 'INSERT':
              console.log('新文件添加:', newRecord);
              set(state => ({
                ...state,
                files: [newRecord as File, ...state.files]
              }));
              break;
            
            case 'UPDATE':
              console.log('文件状态更新:', {
                id: newRecord.id,
                oldStatus: oldRecord.processing_status,
                newStatus: newRecord.processing_status
              });
              
              set(state => ({
                ...state,
                files: state.files.map(file =>
                  file.id === newRecord.id ? { ...file, ...newRecord as File } : file
                )
              }));

              // 状态变更通知
              if (oldRecord.processing_status !== newRecord.processing_status) {
                if (newRecord.processing_status === 'completed') {
                  console.log('文档处理完成');
                } else if (newRecord.processing_status === 'error') {
                  console.log('文档处理失败: ' + (newRecord.error_message || '未知错误'));
                }
              }
              break;
            
            case 'DELETE':
              console.log('文件删除:', oldRecord);
              set(state => ({
                ...state,
                files: state.files.filter(file => file.id !== oldRecord.id)
              }));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      console.log('清理文件更新订阅');
      subscription.unsubscribe();
    };
  }
}));