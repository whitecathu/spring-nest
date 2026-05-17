import { describe, expect, it } from 'vitest';
import {
  createBookkeepingEntry,
  deserializeBookkeepingEntries,
  filterBookkeepingEntries,
  parseBookkeepingAmount,
  summarizeBookkeeping,
  toBookkeepingCsv,
  type BookkeepingEntry,
} from '../lib/bookkeeping';

const entries: BookkeepingEntry[] = [
  {
    id: 'a',
    type: 'expense',
    amount: 32.8,
    category: '餐饮',
    date: '2026-05-15',
    account: '微信',
    note: '午餐',
    createdAt: 3,
  },
  {
    id: 'b',
    type: 'income',
    amount: 5200,
    category: '工资',
    date: '2026-05-14',
    account: '银行卡',
    note: '五月工资',
    createdAt: 2,
  },
  {
    id: 'c',
    type: 'expense',
    amount: 126.5,
    category: '学习',
    date: '2026-04-30',
    account: '银行卡',
    note: '课程,资料',
    createdAt: 1,
  },
];

describe('bookkeeping helpers', () => {
  it('parses and validates positive money amounts', () => {
    expect(parseBookkeepingAmount('1,234.567')).toBe(1234.57);
    expect(parseBookkeepingAmount('0')).toBe(0);
    expect(parseBookkeepingAmount('-8')).toBe(0);
    expect(parseBookkeepingAmount('abc')).toBe(0);
  });

  it('creates normalized entries from drafts', () => {
    const entry = createBookkeepingEntry(
      {
        type: 'expense',
        amount: '18.9',
        category: ' 交通 ',
        date: '2026-05-15',
        account: '',
        note: ' 地铁 ',
      },
      { id: 'fixed', now: 100 },
    );

    expect(entry).toEqual({
      id: 'fixed',
      type: 'expense',
      amount: 18.9,
      category: '交通',
      date: '2026-05-15',
      account: '现金',
      note: '地铁',
      createdAt: 100,
    });
    expect(
      createBookkeepingEntry({
        type: 'expense',
        amount: '',
        category: '餐饮',
        date: '2026-05-15',
        account: '现金',
        note: '',
      }),
    ).toBeNull();
  });

  it('filters by month, type, and query', () => {
    expect(
      filterBookkeepingEntries(entries, { month: '2026-05' }).map((entry) => entry.id),
    ).toEqual(['a', 'b']);
    expect(
      filterBookkeepingEntries(entries, { month: '2026-05', type: 'income' }).map(
        (entry) => entry.id,
      ),
    ).toEqual(['b']);
    expect(filterBookkeepingEntries(entries, { query: '资料' }).map((entry) => entry.id)).toEqual([
      'c',
    ]);
  });

  it('summarizes monthly income, expense, balance, and category ratios', () => {
    const summary = summarizeBookkeeping(filterBookkeepingEntries(entries, { month: '2026-05' }));

    expect(summary.income).toBe(5200);
    expect(summary.expense).toBe(32.8);
    expect(summary.balance).toBe(5167.2);
    expect(summary.dailyExpense).toBe(32.8);
    expect(summary.categoryTotals).toEqual([{ category: '餐饮', total: 32.8, ratio: 1 }]);
  });

  it('exports csv with escaped cells', () => {
    const csv = toBookkeepingCsv(entries);

    expect(csv.split('\n')[0]).toBe('date,type,category,amount,account,note');
    expect(csv).toContain('2026-04-30,expense,学习,126.50,银行卡,"课程,资料"');
  });

  it('drops malformed persisted entries', () => {
    const raw = JSON.stringify([
      entries[0],
      { id: 'bad', type: 'expense', amount: '32', category: '餐饮' },
    ]);

    expect(deserializeBookkeepingEntries(raw)).toEqual([entries[0]]);
    expect(deserializeBookkeepingEntries('{bad json')).toEqual([]);
  });
});
