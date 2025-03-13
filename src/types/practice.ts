export interface Category {
  id: number;
  name: string;
  order_index: number;
  created_at?: string;
  questions_count?: number;
}

export interface Question {
  id: string; // UUID
  category_id: number;
  title: string;
  content: string;
  answer: string;
  explanation?: string;
  created_at?: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
}