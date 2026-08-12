import { supabase } from '../lib/supabase';
import { getFavorites } from './favoriteService';
import {
  mergeGuestBookkeeping,
  mergeGuestBudgets,
  mergeGuestCategories,
  mergeGuestRecurring,
  mergeGuestLedgers,
} from './bookkeepingSyncService';
import {
  createSyncReceipt,
  parseSyncReceipt,
  supabaseUnavailable,
  syncFailure,
  syncSuccess,
  type SyncReceipt,
  type SyncResult,
} from './syncResult';

// ─── Favorites Sync ─────────────────────────────────────────────────────────

/** Upload favorites to Supabase */
export async function syncFavoritesToCloud(
  _userId: string,
  favorites: string[],
): Promise<SyncResult<SyncReceipt>> {
  if (!supabase) return supabaseUnavailable();
  try {
    const { data, error } = await supabase.rpc('replace_user_favorites', {
      items: favorites.map((itemId) => ({
        item_id: itemId,
        item_type: itemId.startsWith('game-') ? 'game' : 'tool',
      })),
    });
    if (error) return syncFailure(error);
    return parseSyncReceipt(data);
  } catch (error) {
    return syncFailure(error);
  }
}

/** Download favorites from Supabase */
export async function syncFavoritesFromCloud(userId: string): Promise<SyncResult<string[]>> {
  if (!supabase) return supabaseUnavailable();
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('item_id')
      .eq('user_id', userId);
    if (error) return syncFailure(error);
    return syncSuccess((data ?? []).map((row) => row.item_id as string));
  } catch (error) {
    return syncFailure(error);
  }
}

// ─── Game Scores Sync ───────────────────────────────────────────────────────

/** Upload a game score to Supabase */
export async function syncScoreToCloud(
  userId: string,
  gameSlug: string,
  score: number,
): Promise<SyncResult<SyncReceipt>> {
  if (!supabase) return supabaseUnavailable();
  try {
    let changedCount = 0;
    // Check if a score already exists for this user+game
    const { data: existing, error: readError } = await supabase
      .from('game_scores')
      .select('id, score')
      .eq('user_id', userId)
      .eq('game_slug', gameSlug)
      .maybeSingle();
    if (readError) return syncFailure(readError);

    if (existing) {
      // Only update if new score is higher
      if (score > (existing.score as number)) {
        const { error } = await supabase
          .from('game_scores')
          .update({ score })
          .eq('id', existing.id as string);
        if (error) return syncFailure(error);
        changedCount = 1;
      }
    } else {
      const { error } = await supabase.from('game_scores').insert({
        user_id: userId,
        game_slug: gameSlug,
        score,
      });
      if (error) return syncFailure(error);
      changedCount = 1;
    }
    return syncSuccess(createSyncReceipt(changedCount));
  } catch (error) {
    return syncFailure(error);
  }
}

/** Download all game scores for a user from Supabase */
export async function syncScoresFromCloud(
  userId: string,
): Promise<SyncResult<Record<string, number>>> {
  if (!supabase) return supabaseUnavailable();
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('game_slug, score')
      .eq('user_id', userId);
    if (error) return syncFailure(error);
    const result: Record<string, number> = {};
    for (const row of data ?? []) {
      result[row.game_slug as string] = row.score as number;
    }
    return syncSuccess(result);
  } catch (error) {
    return syncFailure(error);
  }
}

// ─── Settings Sync ──────────────────────────────────────────────────────────

interface UserSettings {
  theme: string;
  language: string;
}

/** Upload settings to Supabase */
export async function syncSettingsToCloud(
  userId: string,
  settings: UserSettings,
): Promise<SyncResult<SyncReceipt>> {
  if (!supabase) return supabaseUnavailable();
  try {
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      theme: settings.theme,
      language: settings.language,
      updated_at: new Date().toISOString(),
    });
    if (error) return syncFailure(error);
    return syncSuccess(createSyncReceipt(1));
  } catch (error) {
    return syncFailure(error);
  }
}

/** Download settings from Supabase */
export async function syncSettingsFromCloud(
  userId: string,
): Promise<SyncResult<UserSettings | null>> {
  if (!supabase) return supabaseUnavailable();
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('theme, language')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return syncFailure(error);
    if (!data) return syncSuccess(null);
    return syncSuccess({
      theme: data.theme as string,
      language: data.language as string,
    });
  } catch (error) {
    return syncFailure(error);
  }
}

// ─── Guest Data Merge ───────────────────────────────────────────────────────

/** Merge localStorage guest data to cloud after login */
export async function mergeGuestData(userId: string): Promise<SyncResult<SyncReceipt[]>> {
  if (!supabase) return supabaseUnavailable();
  try {
    const receipts: SyncReceipt[] = [];

    // Merge favorites
    const guestFavorites = getFavorites('guest');
    if (guestFavorites.length > 0) {
      // Get existing cloud favorites to avoid duplicates
      const cloudResult = await syncFavoritesFromCloud(userId);
      if (cloudResult.ok === false) return cloudResult;
      const merged = [...new Set([...cloudResult.data, ...guestFavorites])];
      const favoritesResult = await syncFavoritesToCloud(userId, merged);
      if (favoritesResult.ok === false) return favoritesResult;
      receipts.push(favoritesResult.data);
    }

    // Merge game scores
    const gameKeys = [
      { slug: '2048', key: 'spring_nest_2048_best' },
      { slug: 'memory', key: 'spring_nest_memory_best' },
      { slug: 'whackamole', key: 'spring_nest_whackamole_best' },
    ];
    for (const game of gameKeys) {
      try {
        const localScore = JSON.parse(localStorage.getItem(game.key) || '0') as number;
        if (localScore > 0) {
          const scoreResult = await syncScoreToCloud(userId, game.slug, localScore);
          if (scoreResult.ok === false) return scoreResult;
          receipts.push(scoreResult.data);
        }
      } catch {
        // Skip malformed entries
      }
    }

    // Merge settings
    const theme = localStorage.getItem('spring_nest_theme') || 'system';
    const language = localStorage.getItem('spring_nest_lang') || 'zh';
    const settingsResult = await syncSettingsToCloud(userId, { theme, language });
    if (settingsResult.ok === false) return settingsResult;
    receipts.push(settingsResult.data);

    for (const syncOperation of [
      mergeGuestBookkeeping,
      mergeGuestBudgets,
      mergeGuestCategories,
      mergeGuestRecurring,
      mergeGuestLedgers,
    ]) {
      const result = await syncOperation(userId);
      if (result.ok === false) return result;
      receipts.push(result.data);
    }

    return syncSuccess(receipts);
  } catch (error) {
    return syncFailure(error);
  }
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  username: string;
  score: number;
  created_at: string;
}

/** Get leaderboard for a specific game */
export async function getLeaderboard(gameSlug: string, limit = 20): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('user_id, score, created_at')
      .eq('game_slug', gameSlug)
      .order('score', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    const userIds = [...new Set(data.map((row) => row.user_id as string))];
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase.rpc(
        'list_public_profile_cards',
        {
          ids: userIds,
        },
      );
      if (profileError) return [];
      profiles?.forEach((profile: { id: string; username?: string | null }) => {
        profileMap.set(profile.id, profile.username || 'Anonymous');
      });
    }
    return data.map((row) => ({
      username: profileMap.get(row.user_id as string) || 'Anonymous',
      score: row.score as number,
      created_at: row.created_at as string,
    }));
  } catch {
    return [];
  }
}

// ─── Admin Stats ────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalFavorites: number;
  totalScores: number;
  totalSettings: number;
}

/** Get admin statistics */
export async function getAdminStats(): Promise<AdminStats> {
  if (!supabase) {
    return { totalUsers: 0, totalFavorites: 0, totalScores: 0, totalSettings: 0 };
  }
  try {
    const { data, error } = await supabase.rpc('admin_dashboard_stats');
    if (error || !data || typeof data !== 'object') {
      return { totalUsers: 0, totalFavorites: 0, totalScores: 0, totalSettings: 0 };
    }
    const stats = data as Record<string, number>;
    return {
      totalUsers: stats.totalUsers ?? 0,
      totalFavorites: stats.totalFavorites ?? 0,
      totalScores: stats.totalScores ?? 0,
      totalSettings: stats.totalSettings ?? 0,
    };
  } catch {
    return { totalUsers: 0, totalFavorites: 0, totalScores: 0, totalSettings: 0 };
  }
}

/** Get total user count */
export async function getUserCount(): Promise<number> {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
