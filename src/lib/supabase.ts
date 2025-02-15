import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fmqreoeqzqdaqdtgqzkc.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcXJlb2VxenFkYXFkdGdxemtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTc0NDcsImV4cCI6MjA1NDg5MzQ0N30.TtiwMoyWq2QWvmZNdzRMf3pf-DbCV6qaFS-uRnpEwu4';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage // 显式指定使用 localStorage
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});