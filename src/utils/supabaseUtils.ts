import { PostgrestBuilder, PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';

type SupabaseQuery = 
  | PostgrestBuilder<any, any>
  | PostgrestFilterBuilder<any, any, any, any>
  | PostgrestQueryBuilder<any, any>;

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export async function withTimeout<T>(promise: Promise<T>, timeout: number = 30000): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('请求超时')), timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}

export async function withSupabaseTimeout<T>(
  query: SupabaseQuery,
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });

  const queryPromise = (async () => {
    const response = await query as unknown as SupabaseResponse<T>;
    if (response.error) throw response.error;
    return response.data as T;
  })();

  try {
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error) {
    throw error;
  }
}
