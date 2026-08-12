export interface SyncReceipt {
  count: number;
  syncedAt: string;
}

export const SYNC_ERROR_EVENT = 'spring-nest:sync-error';

export type SyncResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: string;
      message: string;
      retryable: boolean;
    };

interface ErrorLike {
  code?: unknown;
  message?: unknown;
}

const RETRYABLE_CODES = new Set([
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '08P01',
  '40001',
  '40P01',
  '53300',
  '57P01',
  '57P02',
  '57P03',
  'PGRST000',
  'PGRST001',
  'PGRST002',
  'PGRST003',
]);

export function syncSuccess<T>(data: T): SyncResult<T> {
  return { ok: true, data };
}

export function syncFailure(
  error: unknown,
  fallbackCode = 'SYNC_FAILED',
  fallbackMessage = '云同步失败，请稍后重试',
): SyncResult<never> {
  const candidate = typeof error === 'object' && error !== null ? (error as ErrorLike) : undefined;
  const code =
    typeof candidate?.code === 'string' && candidate.code.trim() ? candidate.code : fallbackCode;
  const message =
    typeof candidate?.message === 'string' && candidate.message.trim()
      ? candidate.message
      : error instanceof Error && error.message
        ? error.message
        : fallbackMessage;
  const normalizedMessage = message.toLowerCase();
  const retryable =
    RETRYABLE_CODES.has(code) ||
    code.startsWith('08') ||
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('connection') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('fetch');

  return { ok: false, code, message, retryable };
}

export function supabaseUnavailable<T>(): SyncResult<T> {
  return {
    ok: false,
    code: 'SUPABASE_NOT_CONFIGURED',
    message: '云同步尚未配置，本地数据不受影响',
    retryable: false,
  };
}

export function createSyncReceipt(count = 0): SyncReceipt {
  return { count, syncedAt: new Date().toISOString() };
}

export function publishSyncFailure(result: SyncResult<unknown>): void {
  if (
    result.ok !== false ||
    typeof window === 'undefined' ||
    typeof window.dispatchEvent !== 'function'
  ) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(SYNC_ERROR_EVENT, {
      detail: {
        code: result.code,
        message: result.message,
        retryable: result.retryable,
      },
    }),
  );
}

export function parseSyncReceipt(data: unknown): SyncResult<SyncReceipt> {
  if (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as { count?: unknown }).count === 'number' &&
    Number.isInteger((data as { count: number }).count) &&
    (data as { count: number }).count >= 0 &&
    typeof (data as { syncedAt?: unknown }).syncedAt === 'string'
  ) {
    return syncSuccess({
      count: (data as { count: number }).count,
      syncedAt: (data as { syncedAt: string }).syncedAt,
    });
  }

  return syncFailure(
    { code: 'INVALID_SYNC_RESPONSE', message: '云端返回了无效的同步结果' },
    'INVALID_SYNC_RESPONSE',
  );
}
