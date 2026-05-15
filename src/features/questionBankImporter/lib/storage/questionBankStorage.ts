import type { QuestionBank } from '../../types/question';

const STORAGE_KEY = 'spring-nest-question-bank-v1';

export class QuestionBankStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuestionBankStorageError';
  }
}

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

export const questionBankStorage = {
  load(): QuestionBank | null {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as QuestionBank;
      if (!parsed || !Array.isArray(parsed.questions) || typeof parsed.reviewMeta !== 'object') {
        throw new Error('存储结构不完整');
      }
      return parsed;
    } catch (error) {
      storage.removeItem(STORAGE_KEY);
      throw new QuestionBankStorageError(
        `本地题库数据损坏，已清理。${error instanceof Error ? error.message : ''}`.trim(),
      );
    }
  },

  save(bank: QuestionBank): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(bank));
    } catch (error) {
      throw new QuestionBankStorageError(
        `保存本地题库失败：${error instanceof Error ? error.message : '可能是浏览器空间不足'}`,
      );
    }
  },

  clear(): void {
    getStorage()?.removeItem(STORAGE_KEY);
  },
};
