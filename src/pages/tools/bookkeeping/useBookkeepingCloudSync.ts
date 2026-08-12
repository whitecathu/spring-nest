import { useCallback, useEffect, useRef, useState } from 'react';
import type { BookkeepingEntry } from '../../../lib/bookkeeping';
import type { BudgetConfig } from '../../../lib/bookkeepingBudgets';
import type { CategoryConfig } from '../../../lib/bookkeepingCategories';
import type { Ledger } from '../../../lib/bookkeepingLedgers';
import type { RecurringRule } from '../../../lib/bookkeepingRecurring';
import {
  syncBookkeepingToCloud,
  syncBudgetsToCloud,
  syncCategoriesToCloud,
  syncLedgersToCloud,
  syncRecurringToCloud,
} from '../../../services/bookkeepingSyncService';

export type BookkeepingSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface BookkeepingSyncError {
  code: string;
  message: string;
  retryable: boolean;
}

interface BookkeepingCloudSyncInput {
  enabled: boolean;
  userId?: string;
  entries: BookkeepingEntry[];
  budgets: BudgetConfig;
  categories: CategoryConfig;
  recurringRules: RecurringRule[];
  ledgers: Ledger[];
}

export function useBookkeepingCloudSync({
  enabled,
  userId,
  entries,
  budgets,
  categories,
  recurringRules,
  ledgers,
}: BookkeepingCloudSyncInput) {
  const [status, setStatus] = useState<BookkeepingSyncStatus>('idle');
  const [lastError, setLastError] = useState<BookkeepingSyncError | null>(null);
  const requestIdRef = useRef(0);

  const syncAll = useCallback(async () => {
    if (!enabled || !userId) {
      setStatus('idle');
      setLastError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('syncing');
    setLastError(null);

    try {
      const results = await Promise.all([
        syncBookkeepingToCloud(userId, entries),
        syncBudgetsToCloud(userId, budgets),
        syncCategoriesToCloud(userId, categories),
        syncRecurringToCloud(userId, recurringRules),
        syncLedgersToCloud(userId, ledgers),
      ]);
      if (requestId !== requestIdRef.current) return;

      for (const result of results) {
        if (result.ok === false) {
          setLastError({
            code: result.code,
            message: result.message,
            retryable: result.retryable,
          });
          setStatus('error');
          return;
        }
      }

      setStatus('synced');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLastError({
        code: 'SYNC_FAILED',
        message: error instanceof Error ? error.message : '云同步失败，请稍后重试',
        retryable: true,
      });
      setStatus('error');
    }
  }, [budgets, categories, enabled, entries, ledgers, recurringRules, userId]);

  useEffect(() => {
    void syncAll();
  }, [syncAll]);

  return {
    status,
    lastError,
    retry: syncAll,
  };
}
