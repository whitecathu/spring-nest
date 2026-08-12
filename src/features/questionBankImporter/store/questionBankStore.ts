import { create } from 'zustand';
import { createQuestionBankStore } from './questionBankActions';

export const useQuestionBankStore = create(createQuestionBankStore);

export {
  defaultReviewPlan,
  getDifficultyLabel,
  getQuestionTypeLabel,
  normalizeReviewPlan,
  normalizeReviewSession,
  selectFilteredQuestions,
} from './questionBankLogic';
export type {
  AppView,
  QuestionBankState,
  QuestionFilters,
  ReviewMode,
  SortMode,
  ToastState,
} from './questionBankState';
