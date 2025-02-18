export interface Category {
  id: number;
  name: string;
  order_index: number;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  answer: string;
  explanation: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
} 