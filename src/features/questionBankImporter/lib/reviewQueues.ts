import type { Question, ReviewMeta, ReviewPlan } from '../types/question';
import { createReviewMeta } from './utils/normalize';

export interface ReviewQueueSummary {
  dueQuestions: Question[];
  weakQuestions: Question[];
  wrongQuestions: Question[];
  newQuestions: Question[];
  completionRate: number;
  targetRemaining: number;
  estimatedMinutes: number;
}

export interface ReviewWorkbenchSummary extends ReviewQueueSummary {
  suggestedQuestions: Question[];
  favoriteQuestions: Question[];
  frequentWrongQuestions: Question[];
  averageMastery: number;
  unreviewedCount: number;
  quickReviewCount: number;
  actionLabel: string;
}

function daysSince(dateString?: string, now = new Date()): number {
  if (!dateString) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(dateString);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  const elapsed = now.getTime() - timestamp;
  return Math.max(0, Math.floor(elapsed / 86_400_000));
}

function dueAfterDays(meta: ReviewMeta): number {
  if (!meta.lastReviewedAt) return 0;
  if (meta.lastAnsweredCorrect === false || meta.wrongCount >= 2) return 1;
  if (meta.masteryLevel < 45) return 1;
  if (meta.masteryLevel < 70) return 2;
  if (meta.masteryLevel < 88) return 4;
  return 7;
}

function getMeta(questionId: string, reviewMeta: Record<string, ReviewMeta>) {
  return reviewMeta[questionId] ?? createReviewMeta(questionId);
}

function reviewPriority(question: Question, reviewMeta: Record<string, ReviewMeta>, now: Date) {
  const meta = getMeta(question.id, reviewMeta);
  const elapsedDays = daysSince(meta.lastReviewedAt, now);
  const wrongWeight = meta.lastAnsweredCorrect === false ? 70 : Math.min(meta.wrongCount * 18, 54);
  const masteryWeight = 100 - meta.masteryLevel;
  const staleWeight = Math.min(elapsedDays, 14) * 3;
  const newWeight = meta.lastReviewedAt ? 0 : 42;
  return wrongWeight + masteryWeight + staleWeight + newWeight;
}

export function getTodayReviewQueue(
  questions: Question[],
  reviewMeta: Record<string, ReviewMeta>,
  limit = 60,
  now = new Date(),
): Question[] {
  const due = questions.filter((question) => {
    const meta = getMeta(question.id, reviewMeta);
    return daysSince(meta.lastReviewedAt, now) >= dueAfterDays(meta);
  });

  const source = due.length ? due : questions;
  return [...source]
    .sort((a, b) => reviewPriority(b, reviewMeta, now) - reviewPriority(a, reviewMeta, now))
    .slice(0, limit);
}

export function getReviewQueueSummary(
  questions: Question[],
  reviewMeta: Record<string, ReviewMeta>,
  reviewPlan: ReviewPlan,
  now = new Date(),
): ReviewQueueSummary {
  const wrongQuestions = questions.filter(
    (question) => getMeta(question.id, reviewMeta).wrongCount > 0,
  );
  const weakQuestions = questions.filter((question) => {
    const meta = getMeta(question.id, reviewMeta);
    return meta.masteryLevel < 70 || meta.lastAnsweredCorrect === false;
  });
  const newQuestions = questions.filter(
    (question) => !getMeta(question.id, reviewMeta).lastReviewedAt,
  );
  const dueQuestions = getTodayReviewQueue(
    questions,
    reviewMeta,
    reviewPlan.dailyTarget || 30,
    now,
  );
  const targetRemaining = Math.max(0, reviewPlan.dailyTarget - reviewPlan.todayAnswered);
  const completionRate = reviewPlan.dailyTarget
    ? Math.min(100, Math.round((reviewPlan.todayAnswered / reviewPlan.dailyTarget) * 100))
    : 0;

  return {
    dueQuestions,
    weakQuestions,
    wrongQuestions,
    newQuestions,
    completionRate,
    targetRemaining,
    estimatedMinutes: Math.max(3, Math.ceil(dueQuestions.length * 0.55)),
  };
}

export function getReviewWorkbenchSummary(
  questions: Question[],
  reviewMeta: Record<string, ReviewMeta>,
  reviewPlan: ReviewPlan,
  now = new Date(),
): ReviewWorkbenchSummary {
  const summary = getReviewQueueSummary(questions, reviewMeta, reviewPlan, now);
  const suggestedQuestions = summary.dueQuestions.length
    ? summary.dueQuestions
    : questions.slice(0, reviewPlan.dailyTarget || 30);
  const favoriteQuestions = questions.filter(
    (question) => getMeta(question.id, reviewMeta).favorite,
  );
  const frequentWrongQuestions = summary.wrongQuestions.filter(
    (question) => getMeta(question.id, reviewMeta).wrongCount >= 2,
  );
  const unreviewedCount = summary.newQuestions.length;
  const averageMastery = questions.length
    ? Math.round(
        questions.reduce(
          (total, question) => total + getMeta(question.id, reviewMeta).masteryLevel,
          0,
        ) / questions.length,
      )
    : 0;
  const quickReviewCount = Math.min(
    suggestedQuestions.length,
    Math.max(1, reviewPlan.dailyTarget || 30),
  );

  return {
    ...summary,
    suggestedQuestions,
    favoriteQuestions,
    frequentWrongQuestions,
    averageMastery,
    unreviewedCount,
    quickReviewCount,
    actionLabel: questions.length ? `本次建议 ${quickReviewCount} 题` : '先导入题库',
  };
}
