import { supabase } from '../lib/supabase';
import {
  BOOKKEEPING_STORAGE_KEY,
  deserializeBookkeepingEntries,
  type BookkeepingEntry,
} from '../lib/bookkeeping';
import { BOOKKEEPING_CATEGORIES_KEY, getDefaultCategories, type CategoryConfig } from '../lib/bookkeepingCategories';
import type { BudgetConfig } from '../lib/bookkeepingBudgets';
import type { RecurringRule } from '../lib/bookkeepingRecurring';
import type { Ledger } from '../lib/bookkeepingLedgers';

/** Upload all bookkeeping entries to Supabase */
export async function syncBookkeepingToCloud(
  userId: string,
  entries: BookkeepingEntry[],
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('bookkeeping_entries').delete().eq('user_id', userId);
    if (entries.length > 0) {
      const rows = entries.map((entry) => ({
        id: entry.id,
        user_id: userId,
        type: entry.type,
        amount: entry.amount,
        category: entry.category,
        date: entry.date,
        account: entry.account,
        note: entry.note,
        tags: entry.tags ?? [],
        ledger_id: entry.ledgerId ?? null,
        created_at: entry.createdAt,
      }));
      await supabase.from('bookkeeping_entries').insert(rows);
    }
  } catch {
    // Silently fail - localStorage is the source of truth
  }
}

/** Download bookkeeping entries from Supabase */
export async function syncBookkeepingFromCloud(userId: string): Promise<BookkeepingEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('bookkeeping_entries')
      .select('id, type, amount, category, date, account, note, tags, ledger_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      type: row.type as 'expense' | 'income',
      amount: row.amount as number,
      category: row.category as string,
      date: row.date as string,
      account: row.account as string,
      note: (row.note as string) ?? '',
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      ledgerId: (row.ledger_id as string) || undefined,
      createdAt: row.created_at as number,
    }));
  } catch {
    return [];
  }
}

/** Merge localStorage guest bookkeeping entries to cloud */
export async function mergeGuestBookkeeping(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const localRaw = localStorage.getItem(BOOKKEEPING_STORAGE_KEY);
    const localEntries = deserializeBookkeepingEntries(localRaw);
    if (localEntries.length === 0) return;

    const cloudEntries = await syncBookkeepingFromCloud(userId);
    const cloudIds = new Set(cloudEntries.map((e) => e.id));
    const newEntries = localEntries.filter((e) => !cloudIds.has(e.id));

    if (newEntries.length > 0) {
      const merged = [...cloudEntries, ...newEntries].sort((a, b) => b.createdAt - a.createdAt);
      await syncBookkeepingToCloud(userId, merged);
    }
  } catch {
    // Silently fail
  }
}

/** Load bookkeeping from cloud, merge with local, save to localStorage */
export async function loadBookkeepingFromCloud(userId: string): Promise<BookkeepingEntry[]> {
  if (!supabase) return [];
  try {
    const cloudEntries = await syncBookkeepingFromCloud(userId);
    if (cloudEntries.length > 0) {
      localStorage.setItem(BOOKKEEPING_STORAGE_KEY, JSON.stringify(cloudEntries));
      return cloudEntries;
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Budgets Sync ──────────────────────────────────────────────────────────

const BUDGETS_KEY = 'spring_nest_bookkeeping_budgets';

export async function syncBudgetsToCloud(userId: string, budgets: BudgetConfig): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('bookkeeping_budgets').delete().eq('user_id', userId);
    const entries = Object.entries(budgets).filter(([, v]) => v > 0);
    if (entries.length > 0) {
      await supabase.from('bookkeeping_budgets').insert(
        entries.map(([category, amount]) => ({
          user_id: userId,
          category,
          monthly_amount: amount,
        })),
      );
    }
  } catch {}
}

export async function syncBudgetsFromCloud(userId: string): Promise<BudgetConfig> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('bookkeeping_budgets')
      .select('category, monthly_amount')
      .eq('user_id', userId);
    if (error || !data) return {};
    const result: BudgetConfig = {};
    for (const row of data) {
      result[row.category as string] = row.monthly_amount as number;
    }
    return result;
  } catch {
    return {};
  }
}

export async function mergeGuestBudgets(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const raw = localStorage.getItem(BUDGETS_KEY);
    if (!raw) return;
    const local = JSON.parse(raw) as BudgetConfig;
    if (Object.keys(local).length === 0) return;
    const cloud = await syncBudgetsFromCloud(userId);
    const merged = { ...cloud, ...local };
    await syncBudgetsToCloud(userId, merged);
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(merged));
  } catch {}
}

export async function loadBudgetsFromCloud(userId: string): Promise<BudgetConfig> {
  if (!supabase) return {};
  try {
    const cloud = await syncBudgetsFromCloud(userId);
    if (Object.keys(cloud).length > 0) {
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(cloud));
      return cloud;
    }
    return {};
  } catch {
    return {};
  }
}

// ─── Categories Sync ───────────────────────────────────────────────────────

export async function syncCategoriesToCloud(userId: string, config: CategoryConfig): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('bookkeeping_categories').delete().eq('user_id', userId);
    const rows = [
      ...config.expense.map((name, i) => ({ user_id: userId, type: 'expense', name, sort_order: i })),
      ...config.income.map((name, i) => ({ user_id: userId, type: 'income', name, sort_order: i })),
    ];
    if (rows.length > 0) {
      await supabase.from('bookkeeping_categories').insert(rows);
    }
  } catch {}
}

export async function syncCategoriesFromCloud(userId: string): Promise<CategoryConfig | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('bookkeeping_categories')
      .select('type, name, sort_order')
      .eq('user_id', userId);
    if (error || !data || data.length === 0) return null;
    const expense = data
      .filter((r) => r.type === 'expense')
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((r) => r.name as string);
    const income = data
      .filter((r) => r.type === 'income')
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((r) => r.name as string);
    if (expense.length === 0 && income.length === 0) return null;
    return { expense: expense.length > 0 ? expense : getDefaultCategories().expense, income: income.length > 0 ? income : getDefaultCategories().income };
  } catch {
    return null;
  }
}

export async function mergeGuestCategories(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const raw = localStorage.getItem(BOOKKEEPING_CATEGORIES_KEY);
    if (!raw) return;
    const local = JSON.parse(raw) as CategoryConfig;
    const cloud = await syncCategoriesFromCloud(userId);
    const merged: CategoryConfig = {
      expense: cloud?.expense ?? local.expense,
      income: cloud?.income ?? local.income,
    };
    await syncCategoriesToCloud(userId, merged);
    localStorage.setItem(BOOKKEEPING_CATEGORIES_KEY, JSON.stringify(merged));
  } catch {}
}

export async function loadCategoriesFromCloud(userId: string): Promise<CategoryConfig | null> {
  if (!supabase) return null;
  try {
    const cloud = await syncCategoriesFromCloud(userId);
    if (cloud) {
      localStorage.setItem(BOOKKEEPING_CATEGORIES_KEY, JSON.stringify(cloud));
      return cloud;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Recurring Rules Sync ──────────────────────────────────────────────────

const RECURRING_KEY = 'spring_nest_bookkeeping_recurring';

export async function syncRecurringToCloud(userId: string, rules: RecurringRule[]): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('bookkeeping_recurring').delete().eq('user_id', userId);
    if (rules.length > 0) {
      await supabase.from('bookkeeping_recurring').insert(
        rules.map((r) => ({
          id: r.id,
          user_id: userId,
          type: r.type,
          amount: r.amount,
          category: r.category,
          account: r.account,
          note: r.note,
          tags: r.tags,
          ledger_id: null,
          day_of_month: r.dayOfMonth,
          active: r.active,
          last_generated: r.lastGenerated,
          created_at: new Date(r.createdAt).toISOString(),
        })),
      );
    }
  } catch {}
}

export async function syncRecurringFromCloud(userId: string): Promise<RecurringRule[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('bookkeeping_recurring')
      .select('id, type, amount, category, account, note, tags, day_of_month, active, last_generated, created_at')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      type: row.type as 'expense' | 'income',
      amount: row.amount as number,
      category: row.category as string,
      account: row.account as string,
      note: (row.note as string) ?? '',
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      dayOfMonth: row.day_of_month as number,
      active: row.active as boolean,
      lastGenerated: (row.last_generated as string) ?? '',
      createdAt: new Date(row.created_at as string).getTime(),
    }));
  } catch {
    return [];
  }
}

export async function mergeGuestRecurring(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    if (!raw) return;
    const local = JSON.parse(raw) as RecurringRule[];
    if (local.length === 0) return;
    const cloud = await syncRecurringFromCloud(userId);
    const cloudIds = new Set(cloud.map((r) => r.id));
    const newRules = local.filter((r) => !cloudIds.has(r.id));
    const merged = [...cloud, ...newRules];
    await syncRecurringToCloud(userId, merged);
    localStorage.setItem(RECURRING_KEY, JSON.stringify(merged));
  } catch {}
}

export async function loadRecurringFromCloud(userId: string): Promise<RecurringRule[]> {
  if (!supabase) return [];
  try {
    const cloud = await syncRecurringFromCloud(userId);
    if (cloud.length > 0) {
      localStorage.setItem(RECURRING_KEY, JSON.stringify(cloud));
      return cloud;
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Ledgers Sync ──────────────────────────────────────────────────────────

const LEDGERS_KEY = 'spring_nest_bookkeeping_ledgers';

export async function syncLedgersToCloud(userId: string, ledgers: Ledger[]): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('bookkeeping_ledgers').delete().eq('user_id', userId);
    if (ledgers.length > 0) {
      await supabase.from('bookkeeping_ledgers').insert(
        ledgers.map((l) => ({
          id: l.id,
          user_id: userId,
          owner_id: userId,
          name: l.name,
          emoji: l.emoji,
        })),
      );
    }
  } catch {}
}

export async function syncLedgersFromCloud(userId: string): Promise<Ledger[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('bookkeeping_ledgers')
      .select('id, name, emoji, created_at')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      emoji: (row.emoji as string) ?? '',
      createdAt: new Date(row.created_at as string).getTime(),
    }));
  } catch {
    return [];
  }
}

export async function mergeGuestLedgers(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const raw = localStorage.getItem(LEDGERS_KEY);
    if (!raw) return;
    const local = JSON.parse(raw) as Ledger[];
    if (local.length === 0) return;
    const cloud = await syncLedgersFromCloud(userId);
    const cloudIds = new Set(cloud.map((l) => l.id));
    const newLedgers = local.filter((l) => !cloudIds.has(l.id));
    const merged = [...cloud, ...newLedgers];
    await syncLedgersToCloud(userId, merged);
    localStorage.setItem(LEDGERS_KEY, JSON.stringify(merged));
  } catch {}
}

export async function loadLedgersFromCloud(userId: string): Promise<Ledger[]> {
  if (!supabase) return [];
  try {
    const cloud = await syncLedgersFromCloud(userId);
    if (cloud.length > 0) {
      localStorage.setItem(LEDGERS_KEY, JSON.stringify(cloud));
      return cloud;
    }
    return [];
  } catch {
    return [];
  }
}
