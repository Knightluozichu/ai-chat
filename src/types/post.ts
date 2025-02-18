export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  is_featured: boolean;
  reading_time?: number;
  view_count: number;
  author_id: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  seo_title?: string;
  seo_description?: string;
  status: PostStatus;
}

export interface CreatePostDTO {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  is_featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  status?: PostStatus;
  author_id: string;
}

export interface UpdatePostDTO extends Partial<CreatePostDTO> {
  id: string;
}

export interface PostFilters {
  page?: number;
  per_page?: number;
  status?: PostStatus;
  search?: string;
  author_id?: string;
  is_featured?: boolean;
  orderBy?: {
    column: keyof Post;
    order: 'asc' | 'desc';
  };
} 