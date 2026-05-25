import type { BookkeepingEntry } from './bookkeeping';

export interface RecurringRule {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  account: string;
  note: string;
  tags: string[];
  dayOfMonth: number;
  lastGenerated: string; // YYYY-MM format
  active: boolean;
  createdAt: number;
}

export interface RecurringDraft {
  type: 'expense' | 'income';
  amount: string;
  category: string;
  account: string;
  note: string;
  tags: string[];
  dayOfMonth: string;
}

const STORAGE_KEY = 'spring_nest_bookkeeping_recurring';

export function loadRecurringRules(): RecurringRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RecurringRule =>
        typeof r === 'object' &&
        r !== null &&
        typeof r.id === 'string' &&
        (r.type === 'expense' || r.type === 'income') &&
        typeof r.amount === 'number' &&
        typeof r.dayOfMonth === 'number',
    );
  } catch {
    // localStorage may be unavailable or data corrupted
    return [];
  }
}

export function saveRecurringRules(rules: RecurringRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function createRecurringRule(
  draft: RecurringDraft,
  options: { id?: string; now?: number } = {},
): RecurringRule | null {
  const amount = parseFloat(draft.amount.replace(/,/g, ''));
  const dayOfMonth = parseInt(draft.dayOfMonth, 10);
  const category = draft.category.trim();
  const date = new Date();
  const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  if (!amount || amount <= 0 || !category || isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)
    return null;

  return {
    id:
      options.id ??
      `recurring_${options.now ?? Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: draft.type,
    amount,
    category,
    account: draft.account.trim() || '现金',
    note: draft.note.trim(),
    tags: (draft.tags ?? []).map((t) => t.trim()).filter(Boolean),
    dayOfMonth,
    lastGenerated: currentMonth,
    active: true,
    createdAt: options.now ?? Date.now(),
  };
}

export function updateRecurringRule(
  rules: RecurringRule[],
  id: string,
  updates: Partial<Omit<RecurringRule, 'id' | 'createdAt'>>,
): RecurringRule[] {
  return rules.map((r) => (r.id === id ? { ...r, ...updates } : r));
}

export function deleteRecurringRule(rules: RecurringRule[], id: string): RecurringRule[] {
  return rules.filter((r) => r.id !== id);
}

/**
 * Process recurring rules: generate entries for the current month if not yet generated.
 * Returns new entries to add and updated rules.
 */
export function processRecurringEntries(
  rules: RecurringRule[],
  existingEntries: BookkeepingEntry[],
): { newEntries: BookkeepingEntry[]; updatedRules: RecurringRule[] } {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = now.getDate();
  const newEntries: BookkeepingEntry[] = [];
  let hasChanges = false;

  const updatedRules = rules.map((rule) => {
    if (!rule.active) return rule;
    if (rule.lastGenerated >= currentMonth) return rule;
    // Only generate if the day has passed
    if (today < rule.dayOfMonth) return rule;

    // Check if an entry already exists for this rule this month
    const dayStr = String(rule.dayOfMonth).padStart(2, '0');
    const entryDate = `${currentMonth}-${dayStr}`;
    const alreadyExists = existingEntries.some(
      (e) =>
        e.date === entryDate &&
        e.category === rule.category &&
        e.amount === rule.amount &&
        e.type === rule.type &&
        e.note === (rule.note || `自动: ${rule.category}`),
    );
    if (alreadyExists) return rule;

    const timestamp = Date.now() + newEntries.length;
    newEntries.push({
      id: `recurring_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      type: rule.type,
      amount: rule.amount,
      category: rule.category,
      date: entryDate,
      account: rule.account,
      note: rule.note || `自动: ${rule.category}`,
      tags: [...rule.tags],
      createdAt: timestamp,
    });

    hasChanges = true;
    return { ...rule, lastGenerated: currentMonth };
  });

  return { newEntries, updatedRules: hasChanges ? updatedRules : rules };
}
