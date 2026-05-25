import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReviewWorkbench } from '../features/questionBankImporter/components/dashboard/ReviewWorkbench';
import {
  defaultReviewPlan,
  useQuestionBankStore,
} from '../features/questionBankImporter/store/questionBankStore';
import type { Question, ReviewMeta } from '../features/questionBankImporter/types/question';

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
  favorite: true,
  wrongCount: 1,
  correctCount: 0,
  masteryLevel: 35,
  lastAnsweredCorrect: false,
};

describe('ReviewWorkbench', () => {
  beforeEach(() => {
    useQuestionBankStore.setState({
      currentBank: null,
      questions: [],
      reviewMeta: {},
      importedFiles: [],
      reviewPlan: defaultReviewPlan,
      lastReviewSession: undefined,
      currentReviewQuestionIds: [],
      currentReviewIndex: 0,
      activeView: 'workbench',
      toast: undefined,
    });
  });

  it('renders a short import path for an empty bank', () => {
    render(<ReviewWorkbench />);

    expect(screen.getByRole('heading', { name: '先放进题库，再开始复习' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /选择文件/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /粘贴题库/ })).toBeTruthy();
    expect(screen.queryByText(/今日还差|连续复习|打卡|Pro|付费/)).toBeNull();
  });

  it('renders practical review actions for an existing bank', () => {
    useQuestionBankStore.setState({
      questions: [question],
      reviewMeta: { q1: meta },
      importedFiles: [
        {
          id: 'file-1',
          name: 'sample.txt',
          extension: 'txt',
          size: 128,
          status: 'success',
          message: '解析完成',
          questionCount: 1,
          warnings: [],
        },
      ],
      reviewPlan: { ...defaultReviewPlan, dailyTarget: 20 },
      activeView: 'workbench',
    });

    render(<ReviewWorkbench />);

    expect(screen.getByRole('heading', { name: '复习工作台' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /开始复习/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /快速抽查/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /错题重练/ })).toBeTruthy();
    expect(screen.getByText('本次建议 1 题')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '按题型复习与学习' })).toBeTruthy();
    expect(screen.getByText('单选')).toBeTruthy();
    expect(screen.getByRole('button', { name: '单选复习' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '单选学习' })).toBeTruthy();
    expect(screen.queryByText(/今日还差|连续复习|打卡|Pro|付费/)).toBeNull();
  });
});
