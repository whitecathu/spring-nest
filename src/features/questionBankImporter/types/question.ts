export type QuestionType = 'single' | 'multiple' | 'judge' | 'blank' | 'short' | 'flashcard';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ReviewSessionMode = 'quiz' | 'memorize' | 'analysis';

export type ReviewRecallResult = 'remember' | 'vague' | 'forgot' | 'correct' | 'wrong';

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
  chapter?: string;
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
  lastWrongAt?: string;
  lastAnsweredCorrect?: boolean;
  masteryLevel: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
  intervalDays?: number;
  dueAt?: string;
  lapses?: number;
  lastResult?: ReviewRecallResult;
}

export interface ReviewPlan {
  dailyTarget: number;
  sessionMinutes: number;
  todayAnswered: number;
  streakDays: number;
  lastStudiedDate?: string;
  updatedAt?: string;
}

export interface ReviewSessionSnapshot {
  questionIds: string[];
  index: number;
  mode: ReviewSessionMode;
  updatedAt: string;
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
  reviewPlan?: ReviewPlan;
  lastReviewSession?: ReviewSessionSnapshot;
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
