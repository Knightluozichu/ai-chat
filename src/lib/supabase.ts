import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmqreoeqzqdaqdtgqzkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcXJlb2VxenFkYXFkdGdxemtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTc0NDcsImV4cCI6MjA1NDg5MzQ0N30.TtiwMoyWq2QWvmZNdzRMf3pf-DbCV6qaFS-uRnpEwu4';

export const supabase = createClient(supabaseUrl, supabaseKey);