import { supabase } from '../lib/supabase';
import {
  BOOKKEEPING_STORAGE_KEY,
  deserializeBookkeepingEntries,
  type BookkeepingEntry,
} from '../lib/bookkeeping';
import {
  BOOKKEEPING_CATEGORIES_KEY,
  getDefaultCategories,
  type CategoryConfig,
} from '../lib/bookkeepingCategories';
import type { BudgetConfig } from '../lib/bookkeepingBudgets';
import type { RecurringRule } from '../lib/bookkeepingRecurring';
import type { Ledger } from '../lib/bookkeepingLedgers';
import {
  createSyncReceipt,
  parseSyncReceipt,
  supabaseUnavailable,
  syncFailure,
  syncSuccess,
  type SyncReceipt,
  type SyncResult,
} from './syncResult';

type ReplaceRpcName =
  | 'replace_user_bookkeeping_entries'
  | 'replace_user_bookkeeping_budgets'
  | 'replace_user_bookkeeping_categories'
  | 'replace_user_bookkeeping_recurring'
  | 'replace_user_bookkeeping_ledgers';

async function replaceCollection(
  rpcName: ReplaceRpcName,
  items: Record<string, unknown>[],
): Promise<SyncResult<SyncReceipt>> {
  if (!supabase) return supabaseUnavailable();

  try {
    const { data, error } = await supabase.rpc(rpcName, { items });
    if (error) return syncFailure(error);
    return parseSyncReceipt(data);
  } catch (error) {
    return syncFailure(error);
  }
}

function noopSync(): SyncResult<SyncReceipt> {
  return syncSuccess(createSyncReceipt(0));
}

/** Atomically replace the user's personal bookkeeping entries. Ownership is derived by the RPC. */
export async function syncBookkeepingToCloud(
  _userId: string,
  entries: BookkeepingEntry[],
): Promise<SyncResult<SyncReceipt>> {
  return replaceCollection(
    'replace_user_bookkeeping_entries',
    entries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      date: entry.date,
      account: entry.account,
      note: entry.note,
      tags: entry.tags ?? [],
      ledger_id: entry.ledgerId ?? null,
      created_at: entry.createdAt,
    })),
  );
}

export async function syncBookkeepingFromCloud(
  userId: string,
): Promise<SyncResult<BookkeepingEntry[]>> {
  if (!supabase) return supabaseUnavailable();

  try {
    const { data, error } = await supabase
      .from('bookkeeping_entries')
      .select('id, type, amount, category, date, account, note, tags, ledger_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return syncFailure(error);

    return syncSuccess(
      (data ?? []).map((row) => ({
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
      })),
    );
  } catch (error) {
    return syncFailure(error);
  }
}

export async function mergeGuestBookkeeping(userId: string): Promise<SyncResult<SyncReceipt>> {
  try {
    const localEntries = deserializeBookkeepingEntries(
      localStorage.getItem(BOOKKEEPING_STORAGE_KEY),
    );
    if (localEntries.length === 0) return noopSync();

    const cloudResult = await syncBookkeepingFromCloud(userId);
    if (cloudResult.ok === false) return cloudResult;
    const cloudIds = new Set(cloudResult.data.map((entry) => entry.id));
    const newEntries = localEntries.filter((entry) => !cloudIds.has(entry.id));
    if (newEntries.length === 0) return noopSync();

    return syncBookkeepingToCloud(
      userId,
      [...cloudResult.data, ...newEntries].sort((a, b) => b.createdAt - a.createdAt),
    );
  } catch (error) {
    return syncFailure(error, 'LOCAL_DATA_INVALID', '本地记账数据无法读取');
  }
}

export async function loadBookkeepingFromCloud(
  userId: string,
): Promise<SyncResult<BookkeepingEntry[]>> {
  const result = await syncBookkeepingFromCloud(userId);
  if (result.ok === false) return result;
  if (result.data.length > 0) {
    localStorage.setItem(BOOKKEEPING_STORAGE_KEY, JSON.stringify(result.data));
  }
  return result;
}

// ─── Budgets Sync ──────────────────────────────────────────────────────────

const BUDGETS_KEY = 'spring_nest_bookkeeping_budgets';

export async function syncBudgetsToCloud(
  _userId: string,
  budgets: BudgetConfig,
): Promise<SyncResult<SyncReceipt>> {
  return replaceCollection(
    'replace_user_bookkeeping_budgets',
    Object.entries(budgets)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({ category, monthly_amount: amount })),
  );
}

export async function syncBudgetsFromCloud(userId: string): Promise<SyncResult<BudgetConfig>> {
  if (!supabase) return supabaseUnavailable();

  try {
    const { data, error } = await supabase
      .from('bookkeeping_budgets')
      .select('category, monthly_amount')
      .eq('user_id', userId);
    if (error) return syncFailure(error);

    const budgets: BudgetConfig = {};
    for (const row of data ?? []) {
      budgets[row.category as string] = row.monthly_amount as number;
    }
    return syncSuccess(budgets);
  } catch (error) {
    return syncFailure(error);
  }
}

export async function mergeGuestBudgets(userId: string): Promise<SyncResult<SyncReceipt>> {
  try {
    const raw = localStorage.getItem(BUDGETS_KEY);
    if (!raw) return noopSync();
    const local = JSON.parse(raw) as BudgetConfig;
    if (Object.keys(local).length === 0) return noopSync();

    const cloudResult = await syncBudgetsFromCloud(userId);
    if (cloudResult.ok === false) return cloudResult;
    const merged = { ...cloudResult.data, ...local };
    const result = await syncBudgetsToCloud(userId, merged);
    if (result.ok) localStorage.setItem(BUDGETS_KEY, JSON.stringify(merged));
    return result;
  } catch (error) {
    return syncFailure(error, 'LOCAL_DATA_INVALID', '本地预算数据无法读取');
  }
}

export async function loadBudgetsFromCloud(userId: string): Promise<SyncResult<BudgetConfig>> {
  const result = await syncBudgetsFromCloud(userId);
  if (result.ok === false) return result;
  if (Object.keys(result.data).length > 0) {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(result.data));
  }
  return result;
}

// ─── Categories Sync ───────────────────────────────────────────────────────

export async function syncCategoriesToCloud(
  _userId: string,
  config: CategoryConfig,
): Promise<SyncResult<SyncReceipt>> {
  return replaceCollection('replace_user_bookkeeping_categories', [
    ...config.expense.map((name, sortOrder) => ({
      type: 'expense',
      name,
      sort_order: sortOrder,
    })),
    ...config.income.map((name, sortOrder) => ({
      type: 'income',
      name,
      sort_order: sortOrder,
    })),
  ]);
}

export async function syncCategoriesFromCloud(
  userId: string,
): Promise<SyncResult<CategoryConfig | null>> {
  if (!supabase) return supabaseUnavailable();

  try {
    const { data, error } = await supabase
      .from('bookkeeping_categories')
      .select('type, name, sort_order')
      .eq('user_id', userId);
    if (error) return syncFailure(error);
    if (!data?.length) return syncSuccess(null);

    const expense = data
      .filter((row) => row.type === 'expense')
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((row) => row.name as string);
    const income = data
      .filter((row) => row.type === 'income')
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((row) => row.name as string);

    if (expense.length === 0 && income.length === 0) return syncSuccess(null);
    const defaults = getDefaultCategories();
    return syncSuccess({
      expense: expense.length > 0 ? expense : defaults.expense,
      income: income.length > 0 ? income : defaults.income,
    });
  } catch (error) {
    return syncFailure(error);
  }
}

export async function mergeGuestCategories(userId: string): Promise<SyncResult<SyncReceipt>> {
  try {
    const raw = localStorage.getItem(BOOKKEEPING_CATEGORIES_KEY);
    if (!raw) return noopSync();
    const local = JSON.parse(raw) as CategoryConfig;
    const cloudResult = await syncCategoriesFromCloud(userId);
    if (cloudResult.ok === false) return cloudResult;
    const merged: CategoryConfig = {
      expense: cloudResult.data?.expense ?? local.expense,
      income: cloudResult.data?.income ?? local.income,
    };
    const result = await syncCategoriesToCloud(userId, merged);
    if (result.ok) {
      localStorage.setItem(BOOKKEEPING_CATEGORIES_KEY, JSON.stringify(merged));
    }
    return result;
  } catch (error) {
    return syncFailure(error, 'LOCAL_DATA_INVALID', '本地分类数据无法读取');
  }
}

export async function loadCategoriesFromCloud(
  userId: string,
): Promise<SyncResult<CategoryConfig | null>> {
  const result = await syncCategoriesFromCloud(userId);
  if (result.ok === false) return result;
  if (result.data) {
    localStorage.setItem(BOOKKEEPING_CATEGORIES_KEY, JSON.stringify(result.data));
  }
  return result;
}

// ─── Recurring Rules Sync ──────────────────────────────────────────────────

const RECURRING_KEY = 'spring_nest_bookkeeping_recurring';

export async function syncRecurringToCloud(
  _userId: string,
  rules: RecurringRule[],
): Promise<SyncResult<SyncReceipt>> {
  return replaceCollection(
    'replace_user_bookkeeping_recurring',
    rules.map((rule) => ({
      id: rule.id,
      type: rule.type,
      amount: rule.amount,
      category: rule.category,
      account: rule.account,
      note: rule.note,
      tags: rule.tags ?? [],
      ledger_id: null,
      day_of_month: rule.dayOfMonth,
      active: rule.active,
      last_generated: rule.lastGenerated,
      created_at: new Date(rule.createdAt).toISOString(),
    })),
  );
}

export async function syncRecurringFromCloud(userId: string): Promise<SyncResult<RecurringRule[]>> {
  if (!supabase) return supabaseUnavailable();

  try {
    const { data, error } = await supabase
      .from('bookkeeping_recurring')
      .select(
        'id, type, amount, category, account, note, tags, day_of_month, active, last_generated, created_at',
      )
      .eq('user_id', userId);
    if (error) return syncFailure(error);

    return syncSuccess(
      (data ?? []).map((row) => ({
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
      })),
    );
  } catch (error) {
    return syncFailure(error);
  }
}

export async function mergeGuestRecurring(userId: string): Promise<SyncResult<SyncReceipt>> {
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    if (!raw) return noopSync();
    const local = JSON.parse(raw) as RecurringRule[];
    if (local.length === 0) return noopSync();

    const cloudResult = await syncRecurringFromCloud(userId);
    if (cloudResult.ok === false) return cloudResult;
    const cloudIds = new Set(cloudResult.data.map((rule) => rule.id));
    const newRules = local.filter((rule) => !cloudIds.has(rule.id));
    const merged = [...cloudResult.data, ...newRules];
    const result = await syncRecurringToCloud(userId, merged);
    if (result.ok) localStorage.setItem(RECURRING_KEY, JSON.stringify(merged));
    return result;
  } catch (error) {
    return syncFailure(error, 'LOCAL_DATA_INVALID', '本地周期记账数据无法读取');
  }
}

export async function loadRecurringFromCloud(userId: string): Promise<SyncResult<RecurringRule[]>> {
  const result = await syncRecurringFromCloud(userId);
  if (result.ok === false) return result;
  if (result.data.length > 0) {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(result.data));
  }
  return result;
}

// ─── Ledgers Sync ──────────────────────────────────────────────────────────

const LEDGERS_KEY = 'spring_nest_bookkeeping_ledgers';

export async function syncLedgersToCloud(
  _userId: string,
  ledgers: Ledger[],
): Promise<SyncResult<SyncReceipt>> {
  return replaceCollection(
    'replace_user_bookkeeping_ledgers',
    ledgers.map((ledger) => ({
      id: ledger.id,
      name: ledger.name,
      emoji: ledger.emoji,
      created_at: new Date(ledger.createdAt).toISOString(),
    })),
  );
}

export async function syncLedgersFromCloud(userId: string): Promise<SyncResult<Ledger[]>> {
  if (!supabase) return supabaseUnavailable();

  try {
    const { data, error } = await supabase
      .from('bookkeeping_ledgers')
      .select('id, name, emoji, created_at')
      .eq('user_id', userId);
    if (error) return syncFailure(error);

    return syncSuccess(
      (data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
        emoji: (row.emoji as string) ?? '',
        createdAt: new Date(row.created_at as string).getTime(),
      })),
    );
  } catch (error) {
    return syncFailure(error);
  }
}

export async function mergeGuestLedgers(userId: string): Promise<SyncResult<SyncReceipt>> {
  try {
    const raw = localStorage.getItem(LEDGERS_KEY);
    if (!raw) return noopSync();
    const local = JSON.parse(raw) as Ledger[];
    if (local.length === 0) return noopSync();

    const cloudResult = await syncLedgersFromCloud(userId);
    if (cloudResult.ok === false) return cloudResult;
    const cloudIds = new Set(cloudResult.data.map((ledger) => ledger.id));
    const newLedgers = local.filter((ledger) => !cloudIds.has(ledger.id));
    const merged = [...cloudResult.data, ...newLedgers];
    const result = await syncLedgersToCloud(userId, merged);
    if (result.ok) localStorage.setItem(LEDGERS_KEY, JSON.stringify(merged));
    return result;
  } catch (error) {
    return syncFailure(error, 'LOCAL_DATA_INVALID', '本地账本数据无法读取');
  }
}

export async function loadLedgersFromCloud(userId: string): Promise<SyncResult<Ledger[]>> {
  const result = await syncLedgersFromCloud(userId);
  if (result.ok === false) return result;
  if (result.data.length > 0) {
    localStorage.setItem(LEDGERS_KEY, JSON.stringify(result.data));
  }
  return result;
}
