import { create } from 'zustand';
import { appConfig } from '../config/appConfig';
import { localQuestionBankClient } from '../lib/api/localQuestionBankClient';
import { questionBankStorage } from '../lib/storage/questionBankStorage';
import { createId } from '../lib/utils/id';
import { createReviewMeta, mergeUniqueQuestions } from '../lib/utils/normalize';
import type {
  Difficulty,
  ImportedFileReport,
  Question,
  QuestionBank,
  QuestionType,
  ReviewMeta,
} from '../types/question';

export type AppView = 'import' | 'bank' | 'review' | 'wrong' | 'settings';
export type SortMode = 'recent' | 'reviewed' | 'wrong' | 'mastery';
export type ReviewMode = 'quiz' | 'memorize';

export interface QuestionFilters {
  type: 'all' | QuestionType;
  sourceFile: string;
  tag: string;
  favoriteOnly: boolean;
  wrongOnly: boolean;
}

interface ToastState {
  kind: 'success' | 'warning' | 'error';
  message: string;
}

interface QuestionBankState {
  currentBank: QuestionBank | null;
  importedFiles: ImportedFileReport[];
  questions: Question[];
  reviewMeta: Record<string, ReviewMeta>;
  activeFilters: QuestionFilters;
  searchQuery: string;
  sortMode: SortMode;
  reviewMode: ReviewMode;
  currentReviewQuestionIds: string[];
  currentReviewIndex: number;
  activeView: AppView;
  isParsing: boolean;
  storageError?: string;
  toast?: ToastState;
  actions: {
    loadFromStorage: () => Promise<void>;
    importFiles: (files: File[]) => Promise<void>;
    updateQuestion: (question: Question) => void;
    deleteQuestion: (questionId: string) => void;
    toggleFavorite: (questionId: string) => void;
    markWrong: (questionId: string) => void;
    removeWrong: (questionId: string) => void;
    recordAnswer: (questionId: string, correct: boolean) => void;
    clearBank: () => void;
    exportJson: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<QuestionFilters>) => void;
    setSortMode: (sortMode: SortMode) => void;
    setReviewMode: (mode: ReviewMode) => void;
    setActiveView: (view: AppView) => void;
    startReview: (questionIds?: string[], mode?: ReviewMode) => void;
    nextQuestion: () => void;
    previousQuestion: () => void;
    randomQuestion: () => void;
    dismissToast: () => void;
  };
}

const defaultFilters: QuestionFilters = {
  type: 'all',
  sourceFile: '',
  tag: '',
  favoriteOnly: false,
  wrongOnly: false,
};

function createEmptyBank(): QuestionBank {
  const now = new Date().toISOString();
  return {
    id: createId('bank'),
    name: appConfig.appName,
    questions: [],
    reviewMeta: {},
    importedFiles: [],
    createdAt: now,
    updatedAt: now,
  };
}

function ensureBank(state: QuestionBankState): QuestionBank {
  return state.currentBank ?? createEmptyBank();
}

function createMetaMap(
  questions: Question[],
  existing: Record<string, ReviewMeta>,
): Record<string, ReviewMeta> {
  return questions.reduce<Record<string, ReviewMeta>>((acc, question) => {
    acc[question.id] = existing[question.id] ?? createReviewMeta(question.id);
    return acc;
  }, {});
}

function updateBank(
  state: QuestionBankState,
  updater: (bank: QuestionBank) => QuestionBank,
): Pick<
  QuestionBankState,
  'currentBank' | 'questions' | 'reviewMeta' | 'importedFiles' | 'storageError'
> {
  const updated = updater(ensureBank(state));
  const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
  try {
    questionBankStorage.save(withTimestamp);
    return {
      currentBank: withTimestamp,
      questions: withTimestamp.questions,
      reviewMeta: withTimestamp.reviewMeta,
      importedFiles: withTimestamp.importedFiles,
      storageError: undefined,
    };
  } catch (error) {
    return {
      currentBank: withTimestamp,
      questions: withTimestamp.questions,
      reviewMeta: withTimestamp.reviewMeta,
      importedFiles: withTimestamp.importedFiles,
      storageError: error instanceof Error ? error.message : '本地保存失败',
    };
  }
}

function scoreMastery(meta: ReviewMeta, correct: boolean): number {
  const delta = correct ? 18 : -24;
  return Math.max(0, Math.min(100, meta.masteryLevel + delta));
}

export const useQuestionBankStore = create<QuestionBankState>((set, get) => ({
  currentBank: null,
  importedFiles: [],
  questions: [],
  reviewMeta: {},
  activeFilters: defaultFilters,
  searchQuery: '',
  sortMode: 'recent',
  reviewMode: 'quiz',
  currentReviewQuestionIds: [],
  currentReviewIndex: 0,
  activeView: 'import',
  isParsing: false,
  actions: {
    async loadFromStorage() {
      try {
        const loaded = await localQuestionBankClient.loadQuestionBank();
        if (!loaded) return;
        const reviewMeta = createMetaMap(loaded.questions, loaded.reviewMeta ?? {});
        const bank = { ...loaded, reviewMeta };
        set({
          currentBank: bank,
          questions: bank.questions,
          reviewMeta: bank.reviewMeta,
          importedFiles: bank.importedFiles,
          storageError: undefined,
        });
      } catch (error) {
        set({
          storageError: error instanceof Error ? error.message : '本地数据读取失败',
          toast: { kind: 'warning', message: '本地数据读取失败，已回到空题库。' },
        });
      }
    },

    async importFiles(files: File[]) {
      if (!files.length) return;
      set({ isParsing: true, activeView: 'import' });
      try {
        const result = await localQuestionBankClient.parseFiles(files);
        set((state) => {
          const bank = ensureBank(state);
          const questions = mergeUniqueQuestions(bank.questions, result.questions);
          const reviewMeta = createMetaMap(questions, bank.reviewMeta);
          const importedFiles = [...result.files, ...bank.importedFiles];
          return {
            ...updateBank(state, () => ({
              ...bank,
              questions,
              reviewMeta,
              importedFiles,
            })),
            isParsing: false,
            toast: {
              kind: result.errors.length ? 'warning' : 'success',
              message: `导入完成：新增 ${questions.length - bank.questions.length} 题，${result.warnings.length} 条提示。`,
            },
          };
        });
      } catch (error) {
        set({
          isParsing: false,
          toast: {
            kind: 'error',
            message: error instanceof Error ? error.message : '解析失败',
          },
        });
      }
    },

    updateQuestion(question: Question) {
      set((state) => {
        const bank = ensureBank(state);
        const questions = bank.questions.map((item) =>
          item.id === question.id ? { ...question, updatedAt: new Date().toISOString() } : item,
        );
        return {
          ...updateBank(state, () => ({
            ...bank,
            questions,
            reviewMeta: createMetaMap(questions, bank.reviewMeta),
          })),
          toast: { kind: 'success', message: '题目已更新。' },
        };
      });
    },

    deleteQuestion(questionId: string) {
      set((state) => {
        const bank = ensureBank(state);
        const questions = bank.questions.filter((question) => question.id !== questionId);
        const reviewMeta = { ...bank.reviewMeta };
        delete reviewMeta[questionId];
        return {
          ...updateBank(state, () => ({
            ...bank,
            questions,
            reviewMeta,
          })),
          currentReviewQuestionIds: state.currentReviewQuestionIds.filter(
            (id) => id !== questionId,
          ),
          toast: { kind: 'warning', message: '题目已删除。' },
        };
      });
    },

    toggleFavorite(questionId: string) {
      set((state) => {
        const bank = ensureBank(state);
        const current = bank.reviewMeta[questionId] ?? createReviewMeta(questionId);
        const reviewMeta = {
          ...bank.reviewMeta,
          [questionId]: { ...current, favorite: !current.favorite },
        };
        return updateBank(state, () => ({ ...bank, reviewMeta }));
      });
    },

    markWrong(questionId: string) {
      get().actions.recordAnswer(questionId, false);
    },

    removeWrong(questionId: string) {
      set((state) => {
        const bank = ensureBank(state);
        const current = bank.reviewMeta[questionId] ?? createReviewMeta(questionId);
        const reviewMeta = {
          ...bank.reviewMeta,
          [questionId]: {
            ...current,
            wrongCount: 0,
            lastAnsweredCorrect: true,
          },
        };
        return {
          ...updateBank(state, () => ({ ...bank, reviewMeta })),
          toast: { kind: 'success', message: '已移出错题本。' },
        };
      });
    },

    recordAnswer(questionId: string, correct: boolean) {
      set((state) => {
        const bank = ensureBank(state);
        const current = bank.reviewMeta[questionId] ?? createReviewMeta(questionId);
        const reviewMeta = {
          ...bank.reviewMeta,
          [questionId]: {
            ...current,
            wrongCount: current.wrongCount + (correct ? 0 : 1),
            correctCount: current.correctCount + (correct ? 1 : 0),
            lastReviewedAt: new Date().toISOString(),
            lastAnsweredCorrect: correct,
            masteryLevel: scoreMastery(current, correct),
          },
        };
        return updateBank(state, () => ({ ...bank, reviewMeta }));
      });
    },

    clearBank() {
      questionBankStorage.clear();
      set({
        currentBank: null,
        importedFiles: [],
        questions: [],
        reviewMeta: {},
        currentReviewQuestionIds: [],
        currentReviewIndex: 0,
        activeFilters: defaultFilters,
        searchQuery: '',
        reviewMode: 'quiz',
        activeView: 'import',
        toast: { kind: 'warning', message: '本地题库已清空。' },
      });
    },

    async exportJson() {
      const bank = get().currentBank;
      if (!bank) {
        set({ toast: { kind: 'warning', message: '当前没有可导出的题库。' } });
        return;
      }
      const blob = await localQuestionBankClient.exportQuestionBank(bank);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${appConfig.appSlug}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      set({ toast: { kind: 'success', message: 'JSON 已导出。' } });
    },

    setSearchQuery(query: string) {
      set({ searchQuery: query });
    },

    setFilters(filters: Partial<QuestionFilters>) {
      set((state) => ({
        activeFilters: { ...state.activeFilters, ...filters },
      }));
    },

    setSortMode(sortMode: SortMode) {
      set({ sortMode });
    },

    setReviewMode(mode: ReviewMode) {
      set({ reviewMode: mode });
    },

    setActiveView(view: AppView) {
      set({ activeView: view });
    },

    startReview(questionIds?: string[], mode?: ReviewMode) {
      const ids = questionIds?.length
        ? questionIds
        : get().questions.map((question) => question.id);
      set({
        currentReviewQuestionIds: ids,
        currentReviewIndex: 0,
        reviewMode: mode ?? get().reviewMode,
        activeView: 'review',
      });
    },

    nextQuestion() {
      set((state) => ({
        currentReviewIndex: Math.min(
          state.currentReviewIndex + 1,
          Math.max(0, (state.currentReviewQuestionIds.length || state.questions.length) - 1),
        ),
      }));
    },

    previousQuestion() {
      set((state) => ({
        currentReviewIndex: Math.max(0, state.currentReviewIndex - 1),
      }));
    },

    randomQuestion() {
      const total = get().currentReviewQuestionIds.length || get().questions.length;
      if (!total) return;
      set({ currentReviewIndex: Math.floor(Math.random() * total) });
    },

    dismissToast() {
      set({ toast: undefined });
    },
  },
}));

export function selectFilteredQuestions(
  state: Pick<
    QuestionBankState,
    'questions' | 'reviewMeta' | 'activeFilters' | 'searchQuery' | 'sortMode'
  >,
): Question[] {
  const query = state.searchQuery.trim().toLowerCase();
  const filtered = state.questions.filter((question) => {
    const meta = state.reviewMeta[question.id] ?? createReviewMeta(question.id);
    const searchable = [
      question.question,
      Array.isArray(question.answer) ? question.answer.join(',') : question.answer,
      question.explanation,
      question.sourceFile,
      question.sourcePath,
      ...(question.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (state.activeFilters.type !== 'all' && question.type !== state.activeFilters.type)
      return false;
    if (state.activeFilters.sourceFile && question.sourceFile !== state.activeFilters.sourceFile)
      return false;
    if (state.activeFilters.tag && !(question.tags ?? []).includes(state.activeFilters.tag))
      return false;
    if (state.activeFilters.favoriteOnly && !meta.favorite) return false;
    if (state.activeFilters.wrongOnly && meta.wrongCount <= 0) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    const metaA = state.reviewMeta[a.id] ?? createReviewMeta(a.id);
    const metaB = state.reviewMeta[b.id] ?? createReviewMeta(b.id);
    if (state.sortMode === 'wrong') return metaB.wrongCount - metaA.wrongCount;
    if (state.sortMode === 'mastery') return metaA.masteryLevel - metaB.masteryLevel;
    if (state.sortMode === 'reviewed') {
      return Date.parse(metaB.lastReviewedAt ?? '0') - Date.parse(metaA.lastReviewedAt ?? '0');
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function getQuestionTypeLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    single: '单选',
    multiple: '多选',
    judge: '判断',
    short: '简答',
    flashcard: '背诵卡',
  };
  return labels[type];
}

export function getDifficultyLabel(difficulty?: Difficulty): string {
  if (!difficulty) return '未分级';
  return { easy: '简单', medium: '中等', hard: '困难' }[difficulty];
}
