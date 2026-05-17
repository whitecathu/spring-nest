export type BookkeepingEntryType = 'expense' | 'income';

export interface BookkeepingEntry {
  id: string;
  type: BookkeepingEntryType;
  amount: number;
  category: string;
  date: string;
  account: string;
  note: string;
  createdAt: number;
}

export interface BookkeepingDraft {
  type: BookkeepingEntryType;
  amount: string;
  category: string;
  date: string;
  account: string;
  note: string;
}

export interface BookkeepingFilters {
  month?: string;
  type?: 'all' | BookkeepingEntryType;
  query?: string;
}

export interface BookkeepingCategoryTotal {
  category: string;
  total: number;
  ratio: number;
}

export interface BookkeepingSummary {
  income: number;
  expense: number;
  balance: number;
  dailyExpense: number;
  categoryTotals: BookkeepingCategoryTotal[];
}

export const BOOKKEEPING_STORAGE_KEY = 'spring_nest_bookkeeping_entries';

export function getTodayDate() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getCurrentMonth() {
  return getTodayDate().slice(0, 7);
}

export function getMonthKey(date: string) {
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '';
}

export function parseBookkeepingAmount(value: string) {
  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100) / 100;
}

export function createBookkeepingEntry(
  draft: BookkeepingDraft,
  options: { id?: string; now?: number } = {},
): BookkeepingEntry | null {
  const amount = parseBookkeepingAmount(draft.amount);
  const category = draft.category.trim();
  const date = draft.date.trim();

  if (!amount || !category || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const now = options.now ?? Date.now();
  return {
    id: options.id ?? `book_${now}_${Math.random().toString(36).slice(2, 8)}`,
    type: draft.type,
    amount,
    category,
    date,
    account: draft.account.trim() || '现金',
    note: draft.note.trim(),
    createdAt: now,
  };
}

export function filterBookkeepingEntries(
  entries: BookkeepingEntry[],
  filters: BookkeepingFilters = {},
) {
  const month = filters.month?.trim();
  const type = filters.type ?? 'all';
  const query = filters.query?.trim().toLowerCase() ?? '';

  return entries
    .filter((entry) => {
      if (month && getMonthKey(entry.date) !== month) return false;
      if (type !== 'all' && entry.type !== type) return false;
      if (!query) return true;
      return [entry.category, entry.account, entry.note, entry.date]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      const dateOrder = b.date.localeCompare(a.date);
      if (dateOrder !== 0) return dateOrder;
      return b.createdAt - a.createdAt;
    });
}

export function summarizeBookkeeping(entries: BookkeepingEntry[]): BookkeepingSummary {
  const income = entries
    .filter((entry) => entry.type === 'income')
    .reduce((total, entry) => total + entry.amount, 0);
  const expense = entries
    .filter((entry) => entry.type === 'expense')
    .reduce((total, entry) => total + entry.amount, 0);

  const categoryMap = new Map<string, number>();
  entries
    .filter((entry) => entry.type === 'expense')
    .forEach((entry) => {
      categoryMap.set(entry.category, (categoryMap.get(entry.category) ?? 0) + entry.amount);
    });

  const categoryTotals = [...categoryMap.entries()]
    .map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
      ratio: expense > 0 ? total / expense : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const activeExpenseDays = new Set(
    entries.filter((entry) => entry.type === 'expense').map((entry) => entry.date),
  ).size;

  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    balance: Math.round((income - expense) * 100) / 100,
    dailyExpense: activeExpenseDays > 0 ? Math.round((expense / activeExpenseDays) * 100) / 100 : 0,
    categoryTotals,
  };
}

export function deserializeBookkeepingEntries(raw: string | null): BookkeepingEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is BookkeepingEntry => {
      return (
        entry &&
        (entry.type === 'expense' || entry.type === 'income') &&
        typeof entry.id === 'string' &&
        typeof entry.amount === 'number' &&
        Number.isFinite(entry.amount) &&
        typeof entry.category === 'string' &&
        typeof entry.date === 'string' &&
        typeof entry.account === 'string' &&
        typeof entry.note === 'string' &&
        typeof entry.createdAt === 'number'
      );
    });
  } catch {
    return [];
  }
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toBookkeepingCsv(entries: BookkeepingEntry[]) {
  const header = ['date', 'type', 'category', 'amount', 'account', 'note'];
  const rows = filterBookkeepingEntries(entries).map((entry) => [
    entry.date,
    entry.type,
    entry.category,
    entry.amount.toFixed(2),
    entry.account,
    entry.note,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
