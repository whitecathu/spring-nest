import { supabase } from '../lib/supabase';
import type { Ledger } from '../lib/bookkeepingLedgers';

/** Create a shared ledger in Supabase */
export async function createSharedLedger(
  ledger: Ledger,
  ownerId: string,
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('bookkeeping_ledgers').insert({
      id: ledger.id,
      owner_id: ownerId,
      name: ledger.name,
      emoji: ledger.emoji,
    });
    if (error) return false;

    // Add owner as member
    await supabase.from('ledger_members').insert({
      ledger_id: ledger.id,
      user_id: ownerId,
      role: 'owner',
    });
    return true;
  } catch {
    return false;
  }
}

/** Invite a user to a shared ledger by email */
export async function inviteToLedger(
  ledgerId: string,
  inviteeUserId: string,
  role: 'member' = 'member',
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('ledger_members').upsert({
      ledger_id: ledgerId,
      user_id: inviteeUserId,
      role,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Remove a member from a shared ledger */
export async function removeMember(ledgerId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('ledger_members')
      .delete()
      .eq('ledger_id', ledgerId)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/** Get all shared ledgers for a user */
export async function getSharedLedgers(userId: string): Promise<Ledger[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ledger_members')
      .select('bookkeeping_ledgers(id, name, emoji, created_at)')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data
      .map((row) => {
        const ledger = row.bookkeeping_ledgers as unknown as {
          id: string;
          name: string;
          emoji: string;
          created_at: string;
        } | null;
        if (!ledger) return null;
        return {
          id: ledger.id,
          name: ledger.name,
          emoji: ledger.emoji || '',
          createdAt: new Date(ledger.created_at).getTime(),
        };
      })
      .filter((l): l is Ledger => l !== null);
  } catch {
    return [];
  }
}

/** Get members of a shared ledger */
export async function getLedgerMembers(
  ledgerId: string,
): Promise<{ userId: string; role: string; username: string }[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ledger_members')
      .select('user_id, role, profiles(username)')
      .eq('ledger_id', ledgerId);
    if (error || !data) return [];
    return data.map((row) => ({
      userId: row.user_id as string,
      role: row.role as string,
      username: (row.profiles as unknown as { username: string })?.username || 'Unknown',
    }));
  } catch {
    return [];
  }
}
