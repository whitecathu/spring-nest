import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookkeepingEntry } from '../../../lib/bookkeeping';
import type { BudgetConfig } from '../../../lib/bookkeepingBudgets';
import type { CategoryConfig } from '../../../lib/bookkeepingCategories';
import type { Ledger } from '../../../lib/bookkeepingLedgers';
import type { RecurringRule } from '../../../lib/bookkeepingRecurring';

const syncMocks = vi.hoisted(() => ({
  entries: vi.fn(),
  budgets: vi.fn(),
  categories: vi.fn(),
  recurring: vi.fn(),
  ledgers: vi.fn(),
}));

vi.mock('../../../services/bookkeepingSyncService', () => ({
  syncBookkeepingToCloud: syncMocks.entries,
  syncBudgetsToCloud: syncMocks.budgets,
  syncCategoriesToCloud: syncMocks.categories,
  syncRecurringToCloud: syncMocks.recurring,
  syncLedgersToCloud: syncMocks.ledgers,
}));

import { useBookkeepingCloudSync } from './useBookkeepingCloudSync';

const entries: BookkeepingEntry[] = [];
const budgets: BudgetConfig = {};
const categories: CategoryConfig = { expense: ['餐饮'], income: ['工资'] };
const recurringRules: RecurringRule[] = [];
const ledgers: Ledger[] = [];

const success = {
  ok: true as const,
  data: { count: 0, syncedAt: '2026-07-29T00:00:00.000Z' },
};

function getProps(enabled = true) {
  return {
    enabled,
    userId: enabled ? 'user-id' : undefined,
    entries,
    budgets,
    categories,
    recurringRules,
    ledgers,
  };
}

describe('useBookkeepingCloudSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of Object.values(syncMocks)) mock.mockResolvedValue(success);
  });

  it('checks every collection result and reports a successful sync', async () => {
    const { result } = renderHook(() => useBookkeepingCloudSync(getProps()));

    expect(result.current.status).toBe('syncing');
    await waitFor(() => expect(result.current.status).toBe('synced'));

    expect(syncMocks.entries).toHaveBeenCalledWith('user-id', entries);
    expect(syncMocks.budgets).toHaveBeenCalledWith('user-id', budgets);
    expect(syncMocks.categories).toHaveBeenCalledWith('user-id', categories);
    expect(syncMocks.recurring).toHaveBeenCalledWith('user-id', recurringRules);
    expect(syncMocks.ledgers).toHaveBeenCalledWith('user-id', ledgers);
    expect(result.current.lastError).toBeNull();
  });

  it('keeps the local state intact, exposes a failed result, and retries all collections', async () => {
    syncMocks.categories.mockResolvedValueOnce({
      ok: false,
      code: 'PGRST000',
      message: 'network unavailable',
      retryable: true,
    });

    const { result } = renderHook(() => useBookkeepingCloudSync(getProps()));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.lastError).toEqual({
      code: 'PGRST000',
      message: 'network unavailable',
      retryable: true,
    });
    expect(entries).toEqual([]);

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.status).toBe('synced');
    expect(syncMocks.categories).toHaveBeenCalledTimes(2);
    expect(syncMocks.entries).toHaveBeenCalledTimes(2);
  });

  it('does not contact the cloud when sync is unavailable', async () => {
    const { result } = renderHook(() => useBookkeepingCloudSync(getProps(false)));

    expect(result.current.status).toBe('idle');
    await act(async () => {
      await result.current.retry();
    });
    expect(Object.values(syncMocks).every((mock) => mock.mock.calls.length === 0)).toBe(true);
  });
});
