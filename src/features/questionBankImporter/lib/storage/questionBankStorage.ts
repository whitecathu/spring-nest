import type { QuestionBank } from '../../types/question';

const STORAGE_KEY = 'spring-nest-question-bank-v1';
const DB_NAME = 'spring-nest-question-bank';
const DB_VERSION = 1;
const STORE_NAME = 'banks';

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

function getIndexedDb(): IDBFactory | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.indexedDB;
}

function parseBank(raw: string): QuestionBank {
  const parsed = JSON.parse(raw) as QuestionBank;
  if (!parsed || !Array.isArray(parsed.questions) || typeof parsed.reviewMeta !== 'object') {
    throw new Error('存储结构不完整');
  }
  return parsed;
}

function openDatabase(): Promise<IDBDatabase> {
  const indexedDb = getIndexedDb();
  if (!indexedDb) {
    return Promise.reject(new QuestionBankStorageError('IndexedDB 不可用。'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new QuestionBankStorageError('IndexedDB 打开失败。'));
  });
}

async function readFromIndexedDb(): Promise<QuestionBank | null> {
  const indexedDb = getIndexedDb();
  if (!indexedDb) return null;
  const db = await openDatabase();
  try {
    return await new Promise<QuestionBank | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(STORAGE_KEY);

      request.onsuccess = () => {
        const raw = request.result;
        if (typeof raw !== 'string') {
          resolve(null);
          return;
        }
        try {
          resolve(parseBank(raw));
        } catch (error) {
          reject(
            new QuestionBankStorageError(
              `IndexedDB 题库数据损坏。${error instanceof Error ? error.message : ''}`.trim(),
            ),
          );
        }
      };
      request.onerror = () =>
        reject(request.error ?? new QuestionBankStorageError('IndexedDB 读取失败。'));
    });
  } finally {
    db.close();
  }
}

async function writeToIndexedDb(raw: string): Promise<void> {
  const indexedDb = getIndexedDb();
  if (!indexedDb) return;
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new QuestionBankStorageError('IndexedDB 保存失败。'));
      transaction.objectStore(STORE_NAME).put(raw, STORAGE_KEY);
    });
  } finally {
    db.close();
  }
}

async function deleteFromIndexedDb(): Promise<void> {
  const indexedDb = getIndexedDb();
  if (!indexedDb) return;
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new QuestionBankStorageError('IndexedDB 清理失败。'));
      transaction.objectStore(STORE_NAME).delete(STORAGE_KEY);
    });
  } finally {
    db.close();
  }
}

export const questionBankStorage = {
  async load(): Promise<QuestionBank | null> {
    const storage = getStorage();
    if (storage) {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          return parseBank(raw);
        } catch (error) {
          storage.removeItem(STORAGE_KEY);
          const fallback = await readFromIndexedDb();
          if (fallback) return fallback;
          throw new QuestionBankStorageError(
            `本地题库数据损坏，已清理。${error instanceof Error ? error.message : ''}`.trim(),
          );
        }
      }
    }
    return readFromIndexedDb();
  },

  save(bank: QuestionBank): void {
    const storage = getStorage();
    const raw = JSON.stringify(bank);
    try {
      storage?.setItem(STORAGE_KEY, raw);
    } catch (error) {
      if (!getIndexedDb()) {
        throw new QuestionBankStorageError(
          `保存本地题库失败：${error instanceof Error ? error.message : '可能是浏览器空间不足'}`,
        );
      }
    }
    void writeToIndexedDb(raw).catch(() => undefined);
  },

  clear(): void {
    getStorage()?.removeItem(STORAGE_KEY);
    void deleteFromIndexedDb().catch(() => undefined);
  },
};
