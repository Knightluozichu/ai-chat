import { create } from 'zustand';
import { Post, PostFilters } from '../types/post';
import { postService } from '../services/postService';
import toast from 'react-hot-toast';

interface PostState {
  posts: Post[];
  totalCount: number;
  loading: boolean;
  filters: PostFilters;
  selectedPost: Post | null;
  currentViewPost: Post | null;
  // 操作方法
  setPosts: (posts: Post[]) => void;
  setTotalCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<PostFilters>) => void;
  setSelectedPost: (post: Post | null) => void;
  setCurrentViewPost: (post: Post | null) => void;
  // 异步操作
  fetchPosts: () => Promise<void>;
  createPost: (title: string, authorId: string) => Promise<Post>;
  updatePost: (id: string, data: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  updatePostStatus: (id: string, status: Post['status']) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  totalCount: 0,
  loading: false,
  filters: {
    page: 1,
    per_page: 10,
    orderBy: {
      column: 'created_at',
      order: 'desc'
    }
  },
  selectedPost: null,
  currentViewPost: null,

  setPosts: (posts) => set({ posts }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setLoading: (loading) => set({ loading }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  setSelectedPost: (post) => set({ selectedPost: post }),
  setCurrentViewPost: (post) => set({ currentViewPost: post }),

  fetchPosts: async () => {
    const { filters } = get();
    set({ loading: true });
    try {
      const { data, count } = await postService.getPosts(filters);
      set({ posts: data, totalCount: count });
    } catch (error) {
      toast.error('获取文章列表失败');
      console.error('Failed to fetch posts:', error);
    } finally {
      set({ loading: false });
    }
  },

  createPost: async (title: string, authorId: string) => {
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      const post = await postService.createPost({
        title,
        slug,
        content: '',
        status: 'draft',
        author_id: authorId
      });

      const { posts } = get();
      set({ posts: [post, ...posts] });
      toast.success('文章创建成功');
      return post;
    } catch (error) {
      toast.error('创建文章失败');
      throw error;
    }
  },

  updatePost: async (id: string, data: Partial<Post>) => {
    try {
      const updatedPost = await postService.updatePost({ id, ...data });
      const { posts } = get();
      const updatedPosts = posts.map((post) =>
        post.id === id ? updatedPost : post
      );
      set({ posts: updatedPosts });
      toast.success('文章更新成功');
    } catch (error) {
      toast.error('更新文章失败');
      throw error;
    }
  },

  deletePost: async (id: string) => {
    try {
      await postService.deletePost(id);
      const { posts } = get();
      set({ posts: posts.filter((post) => post.id !== id) });
      toast.success('文章删除成功');
    } catch (error) {
      toast.error('删除文章失败');
      throw error;
    }
  },

  updatePostStatus: async (id: string, status: Post['status']) => {
    try {
      const updatedPost = await postService.updatePostStatus(id, status);
      const { posts } = get();
      const updatedPosts = posts.map((post) =>
        post.id === id ? updatedPost : post
      );
      set({ posts: updatedPosts });
      toast.success('文章状态更新成功');
    } catch (error) {
      toast.error('更新文章状态失败');
      throw error;
    }
  }
})); 