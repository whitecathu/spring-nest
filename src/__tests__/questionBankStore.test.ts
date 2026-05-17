import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultReviewPlan,
  selectFilteredQuestions,
  useQuestionBankStore,
} from '../features/questionBankImporter/store/questionBankStore';
import type {
  ImportedFileReport,
  Question,
  ReviewMeta,
} from '../features/questionBankImporter/types/question';

const question: Question = {
  id: 'q1',
  sourceFile: 'sample.txt',
  type: 'single',
  question: '题干',
  options: ['A. 对', 'B. 错'],
  answer: 'A',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const meta: ReviewMeta = {
  questionId: 'q1',
  favorite: false,
  wrongCount: 0,
  correctCount: 2,
  lastReviewedAt: '2026-01-02T00:00:00.000Z',
  lastAnsweredCorrect: true,
  masteryLevel: 60,
};

const storageKey = 'spring-nest-question-bank-v1';

describe('question bank store review metadata', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useQuestionBankStore.setState({
      currentBank: {
        id: 'bank-1',
        name: '复习小筑',
        questions: [question],
        reviewMeta: { q1: meta },
        importedFiles: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      questions: [question],
      reviewMeta: { q1: meta },
      importedFiles: [],
      reviewPlan: defaultReviewPlan,
      activeView: 'workbench',
      toast: undefined,
    });
  });

  it('opens the practical review workbench by default', () => {
    useQuestionBankStore.setState({
      activeView: 'workbench',
    });

    expect(useQuestionBankStore.getState().activeView).toBe('workbench');
  });

  it('manual wrong tagging does not count as a reviewed wrong answer', () => {
    useQuestionBankStore.getState().actions.markWrong('q1');

    const updated = useQuestionBankStore.getState().reviewMeta.q1;
    expect(updated.wrongCount).toBe(1);
    expect(updated.correctCount).toBe(2);
    expect(updated.masteryLevel).toBe(60);
    expect(updated.lastReviewedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(updated.lastAnsweredCorrect).toBe(false);
  });

  it('imports exported JSON backups without replacing existing questions', async () => {
    const backupQuestion: Question = {
      ...question,
      id: 'q2',
      question: '备份题目',
      answer: 'B',
      createdAt: '2026-01-03T00:00:00.000Z',
    };
    const backupMeta: ReviewMeta = {
      questionId: 'q2',
      favorite: true,
      wrongCount: 3,
      correctCount: 1,
      masteryLevel: 20,
    };
    const file = new File(
      [
        JSON.stringify({
          id: 'backup-bank',
          name: '复习小筑',
          questions: [backupQuestion],
          reviewMeta: { q2: backupMeta },
          reviewPlan: {
            dailyTarget: 45,
            sessionMinutes: 25,
            todayAnswered: 12,
            streakDays: 5,
            lastStudiedDate: '2026-01-03',
          },
          importedFiles: [],
          createdAt: '2026-01-03T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        }),
      ],
      'backup.json',
      { type: 'application/json' },
    );

    await useQuestionBankStore.getState().actions.importBackupJson(file);

    const state = useQuestionBankStore.getState();
    expect(state.questions.map((item) => item.id)).toEqual(['q1', 'q2']);
    expect(state.reviewMeta.q2.favorite).toBe(true);
    expect(state.reviewMeta.q2.wrongCount).toBe(3);
    expect(state.reviewPlan.dailyTarget).toBe(45);
    expect(state.reviewPlan.sessionMinutes).toBe(25);
    expect(state.reviewPlan.streakDays).toBe(5);
    expect(state.activeView).toBe('workbench');
  });

  it('counts answered questions toward the local review plan', () => {
    useQuestionBankStore.getState().actions.recordAnswer('q1', true);

    const state = useQuestionBankStore.getState();
    expect(state.reviewPlan.todayAnswered).toBe(1);
    expect(state.reviewPlan.streakDays).toBe(1);
    expect(state.reviewMeta.q1.lastWrongAt).toBeUndefined();
    expect(state.currentBank?.reviewPlan?.todayAnswered).toBe(1);
  });

  it('records the latest wrong time when an answer is missed', () => {
    useQuestionBankStore.getState().actions.recordAnswer('q1', false);

    const state = useQuestionBankStore.getState();
    expect(state.reviewMeta.q1.wrongCount).toBe(1);
    expect(state.reviewMeta.q1.lastWrongAt).toBeTruthy();
  });

  it('records recall feedback for memorize mode without daily check-in language', () => {
    useQuestionBankStore.getState().actions.recordRecall('q1', 'vague');

    const state = useQuestionBankStore.getState();
    expect(state.reviewMeta.q1.lastResult).toBe('vague');
    expect(state.reviewMeta.q1.confidence).toBe(2);
    expect(state.reviewMeta.q1.intervalDays).toBe(1);
    expect(state.reviewMeta.q1.dueAt).toBeTruthy();
    expect(state.reviewMeta.q1.wrongCount).toBe(1);
    expect(state.reviewPlan.todayAnswered).toBe(1);
  });

  it('records remembered answers with longer review intervals', () => {
    useQuestionBankStore.getState().actions.recordRecall('q1', 'remember');

    const updated = useQuestionBankStore.getState().reviewMeta.q1;
    expect(updated.lastResult).toBe('remember');
    expect(updated.confidence).toBe(4);
    expect(updated.intervalDays).toBe(2);
    expect(updated.correctCount).toBe(3);
    expect(updated.lastAnsweredCorrect).toBe(true);
  });

  it('clamps saved review plan settings to practical ranges', () => {
    useQuestionBankStore.getState().actions.updateReviewPlan({
      dailyTarget: 999,
      sessionMinutes: 0,
    });

    const state = useQuestionBankStore.getState();
    expect(state.reviewPlan.dailyTarget).toBe(300);
    expect(state.reviewPlan.sessionMinutes).toBe(1);
  });

  it('filters question bank results by chapter', () => {
    const chapterQuestion: Question = {
      ...question,
      id: 'q2',
      question: '第二章题目',
      chapter: '第二章',
    };
    const filtered = selectFilteredQuestions({
      questions: [{ ...question, chapter: '第一章' }, chapterQuestion],
      reviewMeta: { q1: meta, q2: { ...meta, questionId: 'q2' } },
      activeFilters: {
        type: 'all',
        sourceFile: '',
        chapter: '第二章',
        tag: '',
        favoriteOnly: false,
        wrongOnly: false,
      },
      searchQuery: '',
      sortMode: 'recent',
    });

    expect(filtered).toEqual([chapterQuestion]);
  });

  it('persists and resumes the last review session after reload', async () => {
    const secondQuestion: Question = {
      ...question,
      id: 'q2',
      question: '第二题',
      answer: 'B',
    };
    useQuestionBankStore.setState({
      currentBank: {
        id: 'bank-1',
        name: '复习小筑',
        questions: [question, secondQuestion],
        reviewMeta: { q1: meta, q2: { ...meta, questionId: 'q2' } },
        importedFiles: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      questions: [question, secondQuestion],
      reviewMeta: { q1: meta, q2: { ...meta, questionId: 'q2' } },
      importedFiles: [],
      reviewPlan: defaultReviewPlan,
      lastReviewSession: undefined,
      currentReviewQuestionIds: [],
      currentReviewIndex: 0,
      reviewMode: 'quiz',
      activeView: 'workbench',
    });

    useQuestionBankStore.getState().actions.startReview(['q1', 'q2'], 'analysis');
    useQuestionBankStore.getState().actions.nextQuestion();

    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}');
    expect(saved.lastReviewSession).toMatchObject({
      questionIds: ['q1', 'q2'],
      index: 1,
      mode: 'analysis',
    });

    useQuestionBankStore.setState({
      currentBank: null,
      importedFiles: [],
      questions: [],
      reviewMeta: {},
      reviewPlan: defaultReviewPlan,
      lastReviewSession: undefined,
      currentReviewQuestionIds: [],
      currentReviewIndex: 0,
      reviewMode: 'quiz',
      activeView: 'workbench',
    });

    await useQuestionBankStore.getState().actions.loadFromStorage();
    useQuestionBankStore.getState().actions.resumeReview();

    const resumed = useQuestionBankStore.getState();
    expect(resumed.activeView).toBe('review');
    expect(resumed.reviewMode).toBe('analysis');
    expect(resumed.currentReviewQuestionIds).toEqual(['q1', 'q2']);
    expect(resumed.currentReviewIndex).toBe(1);
  });

  it('imports manually reviewed preview questions into the saved bank', () => {
    const reviewedQuestion: Question = {
      ...question,
      id: 'preview-q1',
      sourceFile: 'preview.txt',
      question: '预览修正后的题干',
      answer: '修正答案',
      explanation: '修正解析',
      createdAt: '2026-01-04T00:00:00.000Z',
    };

    useQuestionBankStore
      .getState()
      .actions.importReviewedQuestions([reviewedQuestion], 'paste-preview.txt', ['格式提示']);

    const state = useQuestionBankStore.getState();
    expect(state.activeView).toBe('workbench');
    expect(state.questions.some((item) => item.id === 'preview-q1')).toBe(true);
    expect(state.importedFiles[0]).toMatchObject({
      name: 'paste-preview.txt',
      status: 'warning',
      questionCount: 1,
    });
    expect(state.currentBank?.questions.some((item) => item.id === 'preview-q1')).toBe(true);
  });

  it('keeps parser file reports when confirmed file previews are imported', () => {
    const reviewedQuestion: Question = {
      ...question,
      id: 'file-preview-q1',
      sourceFile: 'questions.csv',
      question: '文件预览修正后的题干',
      answer: 'B',
      createdAt: '2026-01-04T00:00:00.000Z',
    };
    const report: ImportedFileReport = {
      id: 'file-report-1',
      name: 'questions.csv',
      extension: 'csv',
      size: 128,
      status: 'success',
      message: '解析完成',
      questionCount: 1,
      warnings: [],
    };

    useQuestionBankStore
      .getState()
      .actions.importReviewedQuestions([reviewedQuestion], 'questions.csv', [], [report]);

    const state = useQuestionBankStore.getState();
    expect(state.questions.some((item) => item.id === 'file-preview-q1')).toBe(true);
    expect(state.importedFiles[0]).toEqual(report);
    expect(state.currentBank?.importedFiles[0]).toEqual(report);
  });

  it('stores file parse reports even when no preview questions are available', () => {
    const report: ImportedFileReport = {
      id: 'file-report-empty',
      name: 'empty.pdf',
      extension: 'pdf',
      size: 256,
      status: 'warning',
      message: '需要先转为支持格式',
      questionCount: 0,
      warnings: ['需要先转为支持格式'],
    };

    useQuestionBankStore
      .getState()
      .actions.importReviewedQuestions([], 'empty.pdf', ['需要先转为支持格式'], [report]);

    const state = useQuestionBankStore.getState();
    expect(state.questions).toEqual([question]);
    expect(state.importedFiles[0]).toEqual(report);
    expect(state.toast?.kind).toBe('warning');
  });
});
