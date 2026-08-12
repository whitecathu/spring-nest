import type {
  ImportedFileReport,
  Question,
  QuestionBank,
  QuestionType,
  ReviewMeta,
  ReviewPlan,
  ReviewRecallResult,
  ReviewSessionMode,
  ReviewSessionSnapshot,
} from '../types/question';

export type AppView = 'workbench' | 'import' | 'bank' | 'review' | 'wrong' | 'settings';
export type SortMode = 'recent' | 'reviewed' | 'wrong' | 'mastery';
export type ReviewMode = ReviewSessionMode;

export interface QuestionFilters {
  type: 'all' | QuestionType;
  sourceFile: string;
  chapter: string;
  tag: string;
  favoriteOnly: boolean;
  wrongOnly: boolean;
}

export interface ToastState {
  kind: 'success' | 'warning' | 'error';
  message: string;
}

export interface QuestionBankActions {
  loadFromStorage: () => Promise<void>;
  importFiles: (files: File[]) => Promise<void>;
  importReviewedQuestions: (
    questions: Question[],
    sourceName: string,
    warnings?: string[],
    files?: ImportedFileReport[],
  ) => void;
  updateQuestion: (question: Question) => void;
  deleteQuestion: (questionId: string) => void;
  toggleFavorite: (questionId: string) => void;
  markWrong: (questionId: string) => void;
  removeWrong: (questionId: string) => void;
  recordAnswer: (questionId: string, correct: boolean) => void;
  recordRecall: (
    questionId: string,
    result: Exclude<ReviewRecallResult, 'correct' | 'wrong'>,
  ) => void;
  clearBank: () => void;
  exportJson: () => Promise<void>;
  importBackupJson: (file: File) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<QuestionFilters>) => void;
  setSortMode: (sortMode: SortMode) => void;
  setReviewMode: (mode: ReviewMode) => void;
  updateReviewPlan: (plan: Partial<Pick<ReviewPlan, 'dailyTarget' | 'sessionMinutes'>>) => void;
  setActiveView: (view: AppView) => void;
  startReview: (questionIds?: string[], mode?: ReviewMode) => void;
  resumeReview: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  randomQuestion: () => void;
  dismissToast: () => void;
}

export interface QuestionBankState {
  currentBank: QuestionBank | null;
  importedFiles: ImportedFileReport[];
  questions: Question[];
  reviewMeta: Record<string, ReviewMeta>;
  activeFilters: QuestionFilters;
  searchQuery: string;
  sortMode: SortMode;
  reviewMode: ReviewMode;
  reviewPlan: ReviewPlan;
  lastReviewSession?: ReviewSessionSnapshot;
  currentReviewQuestionIds: string[];
  currentReviewIndex: number;
  activeView: AppView;
  isParsing: boolean;
  storageError?: string;
  toast?: ToastState;
  actions: QuestionBankActions;
}

export const defaultFilters: QuestionFilters = {
  type: 'all',
  sourceFile: '',
  chapter: '',
  tag: '',
  favoriteOnly: false,
  wrongOnly: false,
};
