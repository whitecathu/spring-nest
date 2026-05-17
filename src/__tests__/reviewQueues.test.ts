import { describe, expect, it } from 'vitest';
import {
  getReviewQueueSummary,
  getReviewWorkbenchSummary,
  getTodayReviewQueue,
} from '../features/questionBankImporter/lib/reviewQueues';
import type {
  Question,
  ReviewMeta,
  ReviewPlan,
} from '../features/questionBankImporter/types/question';

const now = new Date('2026-05-17T08:00:00.000Z');

function makeQuestion(id: string): Question {
  return {
    id,
    sourceFile: 'sample.txt',
    type: 'flashcard',
    question: `题目 ${id}`,
    answer: `答案 ${id}`,
    createdAt: '2026-05-01T00:00:00.000Z',
  };
}

function makeMeta(questionId: string, patch: Partial<ReviewMeta>): ReviewMeta {
  return {
    questionId,
    favorite: false,
    wrongCount: 0,
    correctCount: 0,
    masteryLevel: 50,
    ...patch,
  };
}

const plan: ReviewPlan = {
  dailyTarget: 3,
  sessionMinutes: 15,
  todayAnswered: 1,
  streakDays: 4,
};

describe('review queue helpers', () => {
  it('prioritizes new, wrong, and low-mastery questions for today', () => {
    const questions = ['new', 'wrong', 'weak', 'stable'].map(makeQuestion);
    const reviewMeta = {
      wrong: makeMeta('wrong', {
        wrongCount: 2,
        lastAnsweredCorrect: false,
        lastReviewedAt: '2026-05-16T08:00:00.000Z',
        masteryLevel: 30,
      }),
      weak: makeMeta('weak', {
        lastAnsweredCorrect: true,
        lastReviewedAt: '2026-05-15T08:00:00.000Z',
        masteryLevel: 45,
      }),
      stable: makeMeta('stable', {
        lastAnsweredCorrect: true,
        lastReviewedAt: '2026-05-17T07:00:00.000Z',
        masteryLevel: 95,
      }),
    };

    const queue = getTodayReviewQueue(questions, reviewMeta, 3, now);

    expect(queue.map((question) => question.id)).toEqual(['new', 'wrong', 'weak']);
  });

  it('summarizes completion, due, weak, and wrong counts for the dashboard', () => {
    const questions = ['new', 'wrong', 'weak', 'stable'].map(makeQuestion);
    const reviewMeta = {
      wrong: makeMeta('wrong', {
        wrongCount: 1,
        lastAnsweredCorrect: false,
        lastReviewedAt: '2026-05-16T08:00:00.000Z',
        masteryLevel: 35,
      }),
      weak: makeMeta('weak', {
        lastAnsweredCorrect: true,
        lastReviewedAt: '2026-05-15T08:00:00.000Z',
        masteryLevel: 60,
      }),
      stable: makeMeta('stable', {
        lastAnsweredCorrect: true,
        lastReviewedAt: '2026-05-17T07:00:00.000Z',
        masteryLevel: 92,
      }),
    };

    const summary = getReviewQueueSummary(questions, reviewMeta, plan, now);

    expect(summary.completionRate).toBe(33);
    expect(summary.targetRemaining).toBe(2);
    expect(summary.dueQuestions).toHaveLength(3);
    expect(summary.weakQuestions.map((question) => question.id)).toEqual(['new', 'wrong', 'weak']);
    expect(summary.wrongQuestions.map((question) => question.id)).toEqual(['wrong']);
  });

  it('summarizes practical workbench queues without daily check-in pressure', () => {
    const questions = ['new', 'wrong', 'weak', 'favorite', 'stable'].map(makeQuestion);
    const reviewMeta = {
      wrong: makeMeta('wrong', {
        wrongCount: 2,
        lastAnsweredCorrect: false,
        lastReviewedAt: '2026-05-16T08:00:00.000Z',
        masteryLevel: 30,
      }),
      weak: makeMeta('weak', {
        lastAnsweredCorrect: true,
        lastReviewedAt: '2026-05-15T08:00:00.000Z',
        masteryLevel: 56,
      }),
      favorite: makeMeta('favorite', {
        favorite: true,
        lastAnsweredCorrect: true,
        lastReviewedAt: '2026-05-14T08:00:00.000Z',
        masteryLevel: 82,
      }),
      stable: makeMeta('stable', {
        lastAnsweredCorrect: true,
        lastReviewedAt: '2026-05-17T07:00:00.000Z',
        masteryLevel: 94,
      }),
    };

    const summary = getReviewWorkbenchSummary(questions, reviewMeta, plan, now);

    expect(summary.suggestedQuestions.map((question) => question.id)).toEqual([
      'new',
      'wrong',
      'weak',
    ]);
    expect(summary.quickReviewCount).toBe(3);
    expect(summary.averageMastery).toBe(52);
    expect(summary.unreviewedCount).toBe(1);
    expect(summary.favoriteQuestions.map((question) => question.id)).toEqual(['favorite']);
    expect(summary.actionLabel).toBe('本次建议 3 题');
  });
});
