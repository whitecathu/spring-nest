import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: supabaseMock,
}));

import { syncFavoritesToCloud } from './cloudSyncService';
import {
  mergeGuestBookkeeping,
  syncBookkeepingFromCloud,
  syncBookkeepingToCloud,
  syncBudgetsToCloud,
  syncCategoriesToCloud,
  syncLedgersToCloud,
  syncRecurringToCloud,
} from './bookkeepingSyncService';

describe('atomic cloud replacement RPCs', () => {
  beforeEach(() => {
    localStorage.clear();
    supabaseMock.rpc.mockReset();
    supabaseMock.from.mockReset();
    supabaseMock.rpc.mockResolvedValue({
      data: { count: 1, syncedAt: '2026-07-29T00:00:00.000Z' },
      error: null,
    });
  });

  it('replaces favorites through the authenticated RPC without sending userId', async () => {
    const result = await syncFavoritesToCloud('client-supplied-user-id', [
      'game-2048',
      'unit-converter',
    ]);

    expect(supabaseMock.rpc).toHaveBeenCalledWith('replace_user_favorites', {
      items: [
        { item_id: 'game-2048', item_type: 'game' },
        { item_id: 'unit-converter', item_type: 'tool' },
      ],
    });
    expect(JSON.stringify(supabaseMock.rpc.mock.calls[0])).not.toContain('client-supplied-user-id');
    expect(result).toEqual({
      ok: true,
      data: { count: 1, syncedAt: '2026-07-29T00:00:00.000Z' },
    });
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('returns an observable retryable failure when an RPC reports an error', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { code: '08006', message: 'connection failure' },
    });

    const result = await syncFavoritesToCloud('user-id', ['unit-converter']);

    expect(result).toEqual({
      ok: false,
      code: '08006',
      message: 'connection failure',
      retryable: true,
    });
  });

  it('replaces entries with one RPC call instead of delete-then-insert', async () => {
    const result = await syncBookkeepingToCloud('user-id', [
      {
        id: 'entry-1',
        type: 'expense',
        amount: 12.5,
        category: '餐饮',
        date: '2026-07-29',
        account: '现金',
        note: '午餐',
        tags: ['工作日'],
        ledgerId: 'ledger-1',
        createdAt: 1_753_747_200_000,
      },
    ]);

    expect(supabaseMock.rpc).toHaveBeenCalledWith('replace_user_bookkeeping_entries', {
      items: [
        {
          id: 'entry-1',
          type: 'expense',
          amount: 12.5,
          category: '餐饮',
          date: '2026-07-29',
          account: '现金',
          note: '午餐',
          tags: ['工作日'],
          ledger_id: 'ledger-1',
          created_at: 1_753_747_200_000,
        },
      ],
    });
    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it.each([
    [
      'replace_user_bookkeeping_budgets',
      () => syncBudgetsToCloud('user-id', { 餐饮: 800, 交通: 0 }),
      [{ category: '餐饮', monthly_amount: 800 }],
    ],
    [
      'replace_user_bookkeeping_categories',
      () =>
        syncCategoriesToCloud('user-id', {
          expense: ['餐饮'],
          income: ['工资'],
        }),
      [
        { type: 'expense', name: '餐饮', sort_order: 0 },
        { type: 'income', name: '工资', sort_order: 0 },
      ],
    ],
    [
      'replace_user_bookkeeping_recurring',
      () =>
        syncRecurringToCloud('user-id', [
          {
            id: 'recurring-1',
            type: 'expense',
            amount: 20,
            category: '订阅',
            account: '银行卡',
            note: '',
            tags: ['固定'],
            dayOfMonth: 8,
            active: true,
            lastGenerated: '2026-07',
            createdAt: 1_753_747_200_000,
          },
        ]),
      [
        {
          id: 'recurring-1',
          type: 'expense',
          amount: 20,
          category: '订阅',
          account: '银行卡',
          note: '',
          tags: ['固定'],
          ledger_id: null,
          day_of_month: 8,
          active: true,
          last_generated: '2026-07',
          created_at: '2025-07-29T00:00:00.000Z',
        },
      ],
    ],
    [
      'replace_user_bookkeeping_ledgers',
      () =>
        syncLedgersToCloud('user-id', [
          { id: 'ledger-1', name: '日常账本', emoji: '🌱', createdAt: 1_753_747_200_000 },
        ]),
      [
        {
          id: 'ledger-1',
          name: '日常账本',
          emoji: '🌱',
          created_at: '2025-07-29T00:00:00.000Z',
        },
      ],
    ],
  ])('uses %s and derives ownership on the server', async (rpcName, invoke, items) => {
    await invoke();

    expect(supabaseMock.rpc).toHaveBeenLastCalledWith(rpcName, { items });
    expect(JSON.stringify(supabaseMock.rpc.mock.calls.at(-1))).not.toContain('user-id');
  });
});

describe('cloud reads expose Supabase failures', () => {
  it('returns SyncResult error instead of converting a query failure to empty data', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST301', message: 'JWT expired' },
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    supabaseMock.from.mockReturnValue({ select });

    const result = await syncBookkeepingFromCloud('user-id');

    expect(result).toEqual({
      ok: false,
      code: 'PGRST301',
      message: 'JWT expired',
      retryable: false,
    });
  });

  it('preserves local-first data when a replacement RPC fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    supabaseMock.from.mockReturnValue({ select });
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { code: '08006', message: 'connection failure' },
    });
    const localEntries = [
      {
        id: 'local-entry',
        type: 'expense',
        amount: 8,
        category: '餐饮',
        date: '2026-07-29',
        account: '现金',
        note: '',
        tags: [],
        createdAt: 1_753_747_200_000,
      },
    ];
    const serialized = JSON.stringify(localEntries);
    localStorage.setItem('spring_nest_bookkeeping_entries', serialized);

    const result = await mergeGuestBookkeeping('user-id');

    expect(result).toMatchObject({ ok: false, code: '08006', retryable: true });
    expect(localStorage.getItem('spring_nest_bookkeeping_entries')).toBe(serialized);
  });
});
