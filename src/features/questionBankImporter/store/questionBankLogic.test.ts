import { describe, expect, it } from 'vitest';
import type { Question, ReviewMeta } from '../types/question';
import {
  applyRecallResult,
  defaultReviewPlan,
  normalizeReviewPlan,
  normalizeReviewSession,
  selectFilteredQuestions,
} from './questionBankLogic';

const question: Question = {
  id: 'q1',
  sourceFile: 'chapter-one.txt',
  type: 'single',
  question: 'A focused characterization question',
  options: ['A', 'B'],
  answer: 'A',
  chapter: 'Chapter 1',
  tags: ['characterization'],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const meta: ReviewMeta = {
  questionId: question.id,
  favorite: false,
  wrongCount: 0,
  correctCount: 0,
  masteryLevel: 50,
};

describe('question bank pure logic', () => {
  it('normalizes plan and session boundaries without store state', () => {
    expect(normalizeReviewPlan({ dailyTarget: 999, sessionMinutes: 0 })).toMatchObject({
      dailyTarget: 300,
      sessionMinutes: 1,
      todayAnswered: 0,
      streakDays: 0,
    });

    expect(
      normalizeReviewSession(
        {
          questionIds: ['missing', question.id],
          index: 99,
          mode: 'analysis',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
        [question],
      ),
    ).toEqual({
      questionIds: [question.id],
      index: 0,
      mode: 'analysis',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(defaultReviewPlan.dailyTarget).toBe(30);
  });

  it('applies recall scheduling as a deterministic pure operation', () => {
    const answeredAt = new Date('2026-01-02T12:00:00.000Z');
    const updated = applyRecallResult(meta, 'remember', answeredAt);

    expect(updated).toMatchObject({
      wrongCount: 0,
      correctCount: 1,
      lastReviewedAt: answeredAt.toISOString(),
      lastAnsweredCorrect: true,
      masteryLevel: 68,
      confidence: 4,
      intervalDays: 2,
      dueAt: '2026-01-04T12:00:00.000Z',
      lapses: 0,
      lastResult: 'remember',
    });
  });

  it('filters and sorts independently of Zustand actions', () => {
    const laterQuestion = {
      ...question,
      id: 'q2',
      question: 'Another question',
      chapter: 'Chapter 2',
      createdAt: '2026-01-03T00:00:00.000Z',
    };

    expect(
      selectFilteredQuestions({
        questions: [question, laterQuestion],
        reviewMeta: {
          q1: meta,
          q2: { ...meta, questionId: 'q2', favorite: true },
        },
        activeFilters: {
          type: 'all',
          sourceFile: '',
          chapter: '',
          tag: '',
          favoriteOnly: true,
          wrongOnly: false,
        },
        searchQuery: '',
        sortMode: 'recent',
      }),
    ).toEqual([laterQuestion]);
  });
});
