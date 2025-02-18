import { supabase } from '../lib/supabase';
import { Post, CreatePostDTO, UpdatePostDTO, PostFilters } from '../types/post';

const DEFAULT_PAGE_SIZE = 10;

export const postService = {
  async getPosts(filters: PostFilters = {}): Promise<{ data: Post[]; count: number }> {
    const {
      page = 1,
      per_page = DEFAULT_PAGE_SIZE,
      status,
      search,
      author_id,
      is_featured,
      orderBy = { column: 'created_at', order: 'desc' }
    } = filters;

    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' });

    // 应用过滤条件
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    if (author_id) {
      query = query.eq('author_id', author_id);
    }
    if (typeof is_featured === 'boolean') {
      query = query.eq('is_featured', is_featured);
    }

    // 应用排序和分页
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await query
      .order(orderBy.column, { ascending: orderBy.order === 'asc' })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      data: data as Post[],
      count: count || 0
    };
  },

  async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as Post;
  },

  async createPost(post: CreatePostDTO & { author_id: string }): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        ...post,
        status: post.status || 'draft',
        is_featured: post.is_featured || false
      }])
      .select()
      .single();

    if (error) {
      console.error('创建文章失败:', error);
      throw error;
    }

    return data as Post;
  },

  async updatePost({ id, ...post }: UpdatePostDTO): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update(post)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Post;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async updatePostStatus(id: string, status: Post['status']): Promise<Post> {
    return this.updatePost({ id, status });
  },

  async incrementViewCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_post_view_count', { post_id: id });
    
    if (error) {
      throw error;
    }
  }
}; 