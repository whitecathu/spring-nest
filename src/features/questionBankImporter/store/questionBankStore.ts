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
  ReviewPlan,
  ReviewSessionMode,
  ReviewSessionSnapshot,
  QuestionType,
  ReviewMeta,
  ReviewRecallResult,
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
  reviewPlan: ReviewPlan;
  lastReviewSession?: ReviewSessionSnapshot;
  currentReviewQuestionIds: string[];
  currentReviewIndex: number;
  activeView: AppView;
  isParsing: boolean;
  storageError?: string;
  toast?: ToastState;
  actions: {
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
  };
}

const defaultFilters: QuestionFilters = {
  type: 'all',
  sourceFile: '',
  chapter: '',
  tag: '',
  favoriteOnly: false,
  wrongOnly: false,
};

export const defaultReviewPlan: ReviewPlan = {
  dailyTarget: 30,
  sessionMinutes: 15,
  todayAnswered: 0,
  streakDays: 0,
};

function createEmptyBank(): QuestionBank {
  const now = new Date().toISOString();
  return {
    id: createId('bank'),
    name: appConfig.appName,
    questions: [],
    reviewMeta: {},
    reviewPlan: defaultReviewPlan,
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
  | 'currentBank'
  | 'questions'
  | 'reviewMeta'
  | 'importedFiles'
  | 'reviewPlan'
  | 'lastReviewSession'
  | 'storageError'
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
      reviewPlan: normalizeReviewPlan(withTimestamp.reviewPlan),
      lastReviewSession: withTimestamp.lastReviewSession,
      storageError: undefined,
    };
  } catch (error) {
    return {
      currentBank: withTimestamp,
      questions: withTimestamp.questions,
      reviewMeta: withTimestamp.reviewMeta,
      importedFiles: withTimestamp.importedFiles,
      reviewPlan: normalizeReviewPlan(withTimestamp.reviewPlan),
      lastReviewSession: withTimestamp.lastReviewSession,
      storageError: error instanceof Error ? error.message : '本地保存失败',
    };
  }
}

function scoreMastery(meta: ReviewMeta, correct: boolean): number {
  const delta = correct ? 18 : -24;
  return Math.max(0, Math.min(100, meta.masteryLevel + delta));
}

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function nextIntervalDays(meta: ReviewMeta, result: ReviewRecallResult): number {
  const current = Math.max(0, meta.intervalDays ?? 0);
  if (result === 'remember' || result === 'correct') {
    return current <= 0 ? 2 : Math.min(30, current * 2);
  }
  if (result === 'vague') return Math.max(1, Math.min(3, current || 1));
  return 1;
}

function nextConfidence(result: ReviewRecallResult): 1 | 2 | 3 | 4 | 5 {
  if (result === 'remember' || result === 'correct') return 4;
  if (result === 'vague') return 2;
  return 1;
}

function isPositiveRecall(result: ReviewRecallResult): boolean {
  return result === 'remember' || result === 'correct';
}

function applyRecallResult(
  meta: ReviewMeta,
  result: ReviewRecallResult,
  answeredAt: Date,
): ReviewMeta {
  const positive = isPositiveRecall(result);
  const intervalDays = nextIntervalDays(meta, result);
  return {
    ...meta,
    wrongCount: meta.wrongCount + (positive ? 0 : 1),
    correctCount: meta.correctCount + (positive ? 1 : 0),
    lastReviewedAt: answeredAt.toISOString(),
    lastWrongAt: positive ? meta.lastWrongAt : answeredAt.toISOString(),
    lastAnsweredCorrect: positive,
    masteryLevel: scoreMastery(meta, positive),
    confidence: nextConfidence(result),
    intervalDays,
    dueAt: addDays(answeredAt, intervalDays),
    lapses: (meta.lapses ?? 0) + (positive ? 0 : 1),
    lastResult: result,
  };
}

function localDateKey(date = new Date()): string {
  return date.toLocaleDateString('en-CA');
}

function previousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

export function normalizeReviewPlan(value: unknown): ReviewPlan {
  const plan = typeof value === 'object' && value !== null ? (value as Partial<ReviewPlan>) : {};
  const dailyTarget = Number(plan.dailyTarget);
  const sessionMinutes = Number(plan.sessionMinutes);
  const todayAnswered = Number(plan.todayAnswered);
  const streakDays = Number(plan.streakDays);

  return {
    dailyTarget: Number.isFinite(dailyTarget)
      ? Math.max(1, Math.min(300, Math.round(dailyTarget)))
      : defaultReviewPlan.dailyTarget,
    sessionMinutes: Number.isFinite(sessionMinutes)
      ? Math.max(1, Math.min(180, Math.round(sessionMinutes)))
      : defaultReviewPlan.sessionMinutes,
    todayAnswered: Number.isFinite(todayAnswered) ? Math.max(0, Math.round(todayAnswered)) : 0,
    streakDays: Number.isFinite(streakDays) ? Math.max(0, Math.round(streakDays)) : 0,
    lastStudiedDate: typeof plan.lastStudiedDate === 'string' ? plan.lastStudiedDate : undefined,
    updatedAt: typeof plan.updatedAt === 'string' ? plan.updatedAt : undefined,
  };
}

function isReviewMode(value: unknown): value is ReviewMode {
  return value === 'quiz' || value === 'memorize' || value === 'analysis';
}

export function normalizeReviewSession(
  value: unknown,
  questions: Question[],
): ReviewSessionSnapshot | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const snapshot = value as Partial<ReviewSessionSnapshot>;
  const knownIds = new Set(questions.map((question) => question.id));
  const questionIds = Array.isArray(snapshot.questionIds)
    ? snapshot.questionIds.filter((id): id is string => typeof id === 'string' && knownIds.has(id))
    : [];
  if (!questionIds.length) return undefined;
  const index = Number(snapshot.index);
  return {
    questionIds,
    index: Number.isFinite(index)
      ? Math.max(0, Math.min(questionIds.length - 1, Math.round(index)))
      : 0,
    mode: isReviewMode(snapshot.mode) ? snapshot.mode : 'quiz',
    updatedAt:
      typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : new Date().toISOString(),
  };
}

function createReviewSessionSnapshot(
  state: Pick<QuestionBankState, 'questions' | 'currentReviewQuestionIds' | 'reviewMode'>,
  index: number,
  mode = state.reviewMode,
  ids = state.currentReviewQuestionIds,
): ReviewSessionSnapshot | undefined {
  const knownIds = new Set(state.questions.map((question) => question.id));
  const questionIds = (ids.length ? ids : state.questions.map((question) => question.id)).filter(
    (id) => knownIds.has(id),
  );
  if (!questionIds.length) return undefined;
  return {
    questionIds,
    index: Math.max(0, Math.min(questionIds.length - 1, index)),
    mode,
    updatedAt: new Date().toISOString(),
  };
}

function advanceReviewPlan(plan: ReviewPlan): ReviewPlan {
  const today = localDateKey();
  const lastDate = plan.lastStudiedDate;
  const isSameDay = lastDate === today;
  const isYesterday = lastDate === previousDateKey(today);

  return {
    ...plan,
    todayAnswered: isSameDay ? plan.todayAnswered + 1 : 1,
    streakDays: isSameDay ? plan.streakDays : isYesterday ? Math.max(1, plan.streakDays + 1) : 1,
    lastStudiedDate: today,
    updatedAt: new Date().toISOString(),
  };
}

function isQuestion(value: unknown): value is Question {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Question).id === 'string' &&
    typeof (value as Question).question === 'string' &&
    typeof (value as Question).sourceFile === 'string' &&
    typeof (value as Question).createdAt === 'string'
  );
}

function readBackupQuestionBank(
  value: unknown,
): Pick<QuestionBank, 'questions' | 'reviewMeta' | 'reviewPlan' | 'lastReviewSession'> {
  if (
    typeof value !== 'object' ||
    value === null ||
    !Array.isArray((value as QuestionBank).questions)
  ) {
    throw new Error('备份文件需要包含 questions 数组。');
  }

  const questions = (value as QuestionBank).questions.filter(isQuestion);
  if (!questions.length) {
    throw new Error('备份文件中没有可导入的题目。');
  }

  const reviewMeta =
    typeof (value as QuestionBank).reviewMeta === 'object' && (value as QuestionBank).reviewMeta
      ? ((value as QuestionBank).reviewMeta as Record<string, ReviewMeta>)
      : {};

  const reviewPlan = normalizeReviewPlan((value as QuestionBank).reviewPlan);
  const lastReviewSession = normalizeReviewSession(
    (value as QuestionBank).lastReviewSession,
    questions,
  );

  return { questions, reviewMeta, reviewPlan, lastReviewSession };
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
  reviewPlan: defaultReviewPlan,
  lastReviewSession: undefined,
  currentReviewQuestionIds: [],
  currentReviewIndex: 0,
  activeView: 'workbench',
  isParsing: false,
  actions: {
    async loadFromStorage() {
      try {
        const loaded = await localQuestionBankClient.loadQuestionBank();
        if (!loaded) return;
        const reviewMeta = createMetaMap(loaded.questions, loaded.reviewMeta ?? {});
        const reviewPlan = normalizeReviewPlan(loaded.reviewPlan);
        const lastReviewSession = normalizeReviewSession(
          loaded.lastReviewSession,
          loaded.questions,
        );
        const bank = { ...loaded, reviewMeta, reviewPlan, lastReviewSession };
        set({
          currentBank: bank,
          questions: bank.questions,
          reviewMeta: bank.reviewMeta,
          reviewPlan,
          lastReviewSession,
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

    importReviewedQuestions(
      questions: Question[],
      sourceName: string,
      warnings: string[] = [],
      files: ImportedFileReport[] = [],
    ) {
      if (!questions.length) {
        if (files.length) {
          set((state) => {
            const bank = ensureBank(state);
            return {
              ...updateBank(state, () => ({
                ...bank,
                importedFiles: [...files, ...bank.importedFiles],
              })),
              activeView: 'import',
              toast: {
                kind: files.some((file) => file.status === 'error') ? 'error' : 'warning',
                message: warnings.length ? warnings[0] : '未识别出可导入的题目。',
              },
            };
          });
          return;
        }
        set({
          toast: { kind: 'warning', message: '预览中没有可导入的题目。' },
        });
        return;
      }
      set((state) => {
        const bank = ensureBank(state);
        const mergedQuestions = mergeUniqueQuestions(bank.questions, questions);
        const added = mergedQuestions.length - bank.questions.length;
        const reviewMeta = createMetaMap(mergedQuestions, bank.reviewMeta);
        const reports = files.length
          ? files
          : [
              {
                id: createId('file'),
                name: sourceName,
                extension: 'text',
                size: questions.reduce((total, question) => total + question.question.length, 0),
                status: warnings.length ? 'warning' : 'success',
                message: `预览确认导入：新增 ${added} 题。`,
                questionCount: questions.length,
                warnings,
              } satisfies ImportedFileReport,
            ];
        return {
          ...updateBank(state, () => ({
            ...bank,
            questions: mergedQuestions,
            reviewMeta,
            importedFiles: [...reports, ...bank.importedFiles],
          })),
          activeView: 'workbench',
          toast: {
            kind: added ? 'success' : 'warning',
            message: added ? `已导入 ${added} 题。` : '没有新增题目，可能已存在。',
          },
        };
      });
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
      set((state) => {
        const bank = ensureBank(state);
        const current = bank.reviewMeta[questionId] ?? createReviewMeta(questionId);
        const reviewMeta = {
          ...bank.reviewMeta,
          [questionId]: {
            ...current,
            wrongCount: Math.max(1, current.wrongCount),
            lastWrongAt: new Date().toISOString(),
            lastAnsweredCorrect: false,
          },
        };
        return {
          ...updateBank(state, () => ({ ...bank, reviewMeta })),
          toast: { kind: 'warning', message: '已加入错题本。' },
        };
      });
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
          [questionId]: applyRecallResult(current, correct ? 'correct' : 'wrong', new Date()),
        };
        const reviewPlan = advanceReviewPlan(state.reviewPlan);
        return {
          ...updateBank(state, () => ({ ...bank, reviewMeta, reviewPlan })),
          reviewPlan,
        };
      });
    },

    recordRecall(questionId, result) {
      set((state) => {
        const bank = ensureBank(state);
        const current = bank.reviewMeta[questionId] ?? createReviewMeta(questionId);
        const reviewMeta = {
          ...bank.reviewMeta,
          [questionId]: applyRecallResult(current, result, new Date()),
        };
        const reviewPlan = advanceReviewPlan(state.reviewPlan);
        return {
          ...updateBank(state, () => ({ ...bank, reviewMeta, reviewPlan })),
          reviewPlan,
        };
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
        reviewPlan: defaultReviewPlan,
        lastReviewSession: undefined,
        activeView: 'workbench',
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
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(url);
      }, 1500);
      set({ toast: { kind: 'success', message: 'JSON 已导出。' } });
    },

    async importBackupJson(file: File) {
      try {
        const parsed = JSON.parse(await file.text()) as unknown;
        const backup = readBackupQuestionBank(parsed);
        set((state) => {
          const bank = ensureBank(state);
          const questions = mergeUniqueQuestions(bank.questions, backup.questions);
          const reviewMeta = createMetaMap(questions, {
            ...bank.reviewMeta,
            ...backup.reviewMeta,
          });
          const reviewPlan = normalizeReviewPlan({
            ...state.reviewPlan,
            ...backup.reviewPlan,
          });
          const lastReviewSession =
            backup.lastReviewSession ?? normalizeReviewSession(state.lastReviewSession, questions);
          const report: ImportedFileReport = {
            id: createId('file'),
            name: file.name,
            extension: 'json',
            size: file.size,
            status: 'success',
            message: `备份导入完成：读取 ${backup.questions.length} 题，当前题库 ${questions.length} 题。`,
            questionCount: backup.questions.length,
            warnings: [],
          };
          return {
            ...updateBank(state, () => ({
              ...bank,
              questions,
              reviewMeta,
              reviewPlan,
              lastReviewSession,
              importedFiles: [report, ...bank.importedFiles],
            })),
            reviewPlan,
            lastReviewSession,
            activeView: 'workbench',
            toast: {
              kind: 'success',
              message: `备份已导入：当前题库 ${questions.length} 题。`,
            },
          };
        });
      } catch (error) {
        set({
          toast: {
            kind: 'error',
            message: error instanceof Error ? error.message : '备份导入失败。',
          },
        });
      }
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
      set((state) => {
        const snapshot = createReviewSessionSnapshot(state, state.currentReviewIndex, mode);
        if (!snapshot || state.activeView !== 'review') return { reviewMode: mode };
        const bank = ensureBank(state);
        return {
          ...updateBank(state, () => ({ ...bank, lastReviewSession: snapshot })),
          reviewMode: mode,
          lastReviewSession: snapshot,
        };
      });
    },

    updateReviewPlan(plan: Partial<Pick<ReviewPlan, 'dailyTarget' | 'sessionMinutes'>>) {
      set((state) => {
        const bank = ensureBank(state);
        const reviewPlan = normalizeReviewPlan({ ...state.reviewPlan, ...plan });
        return {
          ...updateBank(state, () => ({ ...bank, reviewPlan })),
          reviewPlan,
          toast: { kind: 'success', message: '复习目标已保存。' },
        };
      });
    },

    setActiveView(view: AppView) {
      set({ activeView: view });
    },

    startReview(questionIds?: string[], mode?: ReviewMode) {
      set((state) => {
        const ids = questionIds?.length
          ? questionIds
          : state.questions.map((question) => question.id);
        const reviewMode = mode ?? state.reviewMode;
        const snapshot = createReviewSessionSnapshot(state, 0, reviewMode, ids);
        if (!snapshot) return {};
        const bank = ensureBank(state);
        return {
          ...updateBank(state, () => ({ ...bank, lastReviewSession: snapshot })),
          currentReviewQuestionIds: snapshot.questionIds,
          currentReviewIndex: snapshot.index,
          reviewMode: snapshot.mode,
          lastReviewSession: snapshot,
          activeView: 'review',
        };
      });
    },

    resumeReview() {
      set((state) => {
        const snapshot = normalizeReviewSession(state.lastReviewSession, state.questions);
        if (!snapshot) {
          return {
            toast: { kind: 'warning', message: '没有可继续的复习进度。' },
          };
        }
        return {
          currentReviewQuestionIds: snapshot.questionIds,
          currentReviewIndex: snapshot.index,
          reviewMode: snapshot.mode,
          activeView: 'review',
          lastReviewSession: snapshot,
        };
      });
    },

    nextQuestion() {
      set((state) => {
        const currentReviewIndex = Math.min(
          state.currentReviewIndex + 1,
          Math.max(0, (state.currentReviewQuestionIds.length || state.questions.length) - 1),
        );
        const snapshot = createReviewSessionSnapshot(state, currentReviewIndex);
        if (!snapshot) return { currentReviewIndex };
        const bank = ensureBank(state);
        return {
          ...updateBank(state, () => ({ ...bank, lastReviewSession: snapshot })),
          currentReviewIndex,
          lastReviewSession: snapshot,
        };
      });
    },

    previousQuestion() {
      set((state) => {
        const currentReviewIndex = Math.max(0, state.currentReviewIndex - 1);
        const snapshot = createReviewSessionSnapshot(state, currentReviewIndex);
        if (!snapshot) return { currentReviewIndex };
        const bank = ensureBank(state);
        return {
          ...updateBank(state, () => ({ ...bank, lastReviewSession: snapshot })),
          currentReviewIndex,
          lastReviewSession: snapshot,
        };
      });
    },

    randomQuestion() {
      const total = get().currentReviewQuestionIds.length || get().questions.length;
      if (!total) return;
      set((state) => {
        const currentReviewIndex = Math.floor(Math.random() * total);
        const snapshot = createReviewSessionSnapshot(state, currentReviewIndex);
        if (!snapshot) return { currentReviewIndex };
        const bank = ensureBank(state);
        return {
          ...updateBank(state, () => ({ ...bank, lastReviewSession: snapshot })),
          currentReviewIndex,
          lastReviewSession: snapshot,
        };
      });
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
      question.chapter,
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
    if (state.activeFilters.chapter && question.chapter !== state.activeFilters.chapter)
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
    blank: '填空',
    short: '简答',
    flashcard: '背诵卡',
  };
  return labels[type];
}

export function getDifficultyLabel(difficulty?: Difficulty): string {
  if (!difficulty) return '未分级';
  return { easy: '简单', medium: '中等', hard: '困难' }[difficulty];
}
