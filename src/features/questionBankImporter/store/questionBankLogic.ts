import { createReviewMeta } from '../lib/utils/normalize';
import type {
  Difficulty,
  Question,
  QuestionBank,
  QuestionType,
  ReviewMeta,
  ReviewPlan,
  ReviewRecallResult,
  ReviewSessionSnapshot,
} from '../types/question';
import type { QuestionBankState, ReviewMode } from './questionBankState';

export const defaultReviewPlan: ReviewPlan = {
  dailyTarget: 30,
  sessionMinutes: 15,
  todayAnswered: 0,
  streakDays: 0,
};

export function createMetaMap(
  questions: Question[],
  existing: Record<string, ReviewMeta>,
): Record<string, ReviewMeta> {
  return questions.reduce<Record<string, ReviewMeta>>((acc, question) => {
    acc[question.id] = existing[question.id] ?? createReviewMeta(question.id);
    return acc;
  }, {});
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

export function applyRecallResult(
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

export function createReviewSessionSnapshot(
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

export function advanceReviewPlan(plan: ReviewPlan): ReviewPlan {
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

export function readBackupQuestionBank(
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
