import type { StateCreator } from 'zustand';
import { appConfig } from '../config/appConfig';
import { localQuestionBankClient } from '../lib/api/localQuestionBankClient';
import { questionBankStorage } from '../lib/storage/questionBankStorage';
import { createId } from '../lib/utils/id';
import { createReviewMeta, mergeUniqueQuestions } from '../lib/utils/normalize';
import type { ImportedFileReport, Question } from '../types/question';
import {
  advanceReviewPlan,
  applyRecallResult,
  createMetaMap,
  createReviewSessionSnapshot,
  defaultReviewPlan,
  normalizeReviewPlan,
  normalizeReviewSession,
  readBackupQuestionBank,
} from './questionBankLogic';
import { ensureBank, updateBank } from './questionBankPersistence';
import { defaultFilters } from './questionBankState';
import type {
  AppView,
  QuestionBankState,
  QuestionFilters,
  ReviewMode,
  SortMode,
} from './questionBankState';
import type { ReviewPlan } from '../types/question';

export const createQuestionBankStore: StateCreator<QuestionBankState> = (set, get) => ({
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
});
