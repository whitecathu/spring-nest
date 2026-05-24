import { supabase } from '../lib/supabase';
import {
  BOOKKEEPING_STORAGE_KEY,
  deserializeBookkeepingEntries,
  type BookkeepingEntry,
} from '../lib/bookkeeping';

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
