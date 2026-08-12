import { appConfig } from '../config/appConfig';
import { questionBankStorage } from '../lib/storage/questionBankStorage';
import { createId } from '../lib/utils/id';
import type { QuestionBank } from '../types/question';
import { defaultReviewPlan, normalizeReviewPlan } from './questionBankLogic';
import type { QuestionBankState } from './questionBankState';

export function createEmptyBank(): QuestionBank {
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

export function ensureBank(state: QuestionBankState): QuestionBank {
  return state.currentBank ?? createEmptyBank();
}

export function updateBank(
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
