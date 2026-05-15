export type QuestionType = 'single' | 'multiple' | 'judge' | 'short' | 'flashcard';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  sourceFile: string;
  sourcePath?: string;
  type: QuestionType;
  question: string;
  options?: string[];
  answer?: string | string[];
  explanation?: string;
  tags?: string[];
  difficulty?: Difficulty;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewMeta {
  questionId: string;
  favorite: boolean;
  wrongCount: number;
  correctCount: number;
  lastReviewedAt?: string;
  lastAnsweredCorrect?: boolean;
  masteryLevel: number;
}

export interface ImportedFileReport {
  id: string;
  name: string;
  path?: string;
  extension: string;
  size: number;
  status: 'pending' | 'parsing' | 'success' | 'warning' | 'error';
  message?: string;
  questionCount: number;
  warnings: string[];
  children?: ImportedFileReport[];
}

export interface QuestionBank {
  id: string;
  name: string;
  questions: Question[];
  reviewMeta: Record<string, ReviewMeta>;
  importedFiles: ImportedFileReport[];
  createdAt: string;
  updatedAt: string;
}

export interface ParseResult {
  questions: Question[];
  files: ImportedFileReport[];
  warnings: string[];
  errors: string[];
}
