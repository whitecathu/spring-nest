import { supabase } from '../lib/supabase';
import { getFavorites } from './favoriteService';
import { mergeGuestBookkeeping } from './bookkeepingSyncService';

// ─── Favorites Sync ─────────────────────────────────────────────────────────

/** Upload favorites to Supabase */
export async function syncFavoritesToCloud(userId: string, favorites: string[]): Promise<void> {
  if (!supabase) return;
  try {
    // Delete existing favorites for this user
    await supabase.from('favorites').delete().eq('user_id', userId);
    // Insert new favorites
    if (favorites.length > 0) {
      const rows = favorites.map((itemId) => ({
        user_id: userId,
        item_id: itemId,
      }));
      await supabase.from('favorites').insert(rows);
    }
  } catch {
    // Silently fail - localStorage is the source of truth
  }
}

/** Download favorites from Supabase */
export async function syncFavoritesFromCloud(userId: string): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('item_id')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data.map((row) => row.item_id as string);
  } catch {
    return [];
  }
}

// ─── Game Scores Sync ───────────────────────────────────────────────────────

/** Upload a game score to Supabase */
export async function syncScoreToCloud(
  userId: string,
  gameSlug: string,
  score: number,
): Promise<void> {
  if (!supabase) return;
  try {
    // Check if a score already exists for this user+game
    const { data: existing } = await supabase
      .from('game_scores')
      .select('id, score')
      .eq('user_id', userId)
      .eq('game_slug', gameSlug)
      .single();

    if (existing) {
      // Only update if new score is higher
      if (score > (existing.score as number)) {
        await supabase
          .from('game_scores')
          .update({ score })
          .eq('id', existing.id as string);
      }
    } else {
      await supabase.from('game_scores').insert({
        user_id: userId,
        game_slug: gameSlug,
        score,
      });
    }
  } catch {
    // Silently fail
  }
}

/** Download all game scores for a user from Supabase */
export async function syncScoresFromCloud(userId: string): Promise<Record<string, number>> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('game_slug, score')
      .eq('user_id', userId);
    if (error || !data) return {};
    const result: Record<string, number> = {};
    for (const row of data) {
      result[row.game_slug as string] = row.score as number;
    }
    return result;
  } catch {
    return {};
  }
}

// ─── Settings Sync ──────────────────────────────────────────────────────────

interface UserSettings {
  theme: string;
  language: string;
}

/** Upload settings to Supabase */
export async function syncSettingsToCloud(userId: string, settings: UserSettings): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('user_settings').upsert({
      user_id: userId,
      theme: settings.theme,
      language: settings.language,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Silently fail
  }
}

/** Download settings from Supabase */
export async function syncSettingsFromCloud(userId: string): Promise<UserSettings | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('theme, language')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return { theme: data.theme as string, language: data.language as string };
  } catch {
    return null;
  }
}

// ─── Guest Data Merge ───────────────────────────────────────────────────────

/** Merge localStorage guest data to cloud after login */
export async function mergeGuestData(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    // Merge favorites
    const guestFavorites = getFavorites('guest');
    if (guestFavorites.length > 0) {
      // Get existing cloud favorites to avoid duplicates
      const cloudFavorites = await syncFavoritesFromCloud(userId);
      const merged = [...new Set([...cloudFavorites, ...guestFavorites])];
      await syncFavoritesToCloud(userId, merged);
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
          await syncScoreToCloud(userId, game.slug, localScore);
        }
      } catch {
        // Skip malformed entries
      }
    }

    // Merge settings
    const theme = localStorage.getItem('spring_nest_theme') || 'system';
    const language = localStorage.getItem('spring_nest_lang') || 'zh';
    await syncSettingsToCloud(userId, { theme, language });

    // Merge bookkeeping entries
    await mergeGuestBookkeeping(userId);
  } catch {
    // Silently fail - localStorage data is preserved
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
      .select('score, created_at, profiles(username)')
      .eq('game_slug', gameSlug)
      .order('score', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      username: (row.profiles as unknown as { username: string })?.username || 'Anonymous',
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
    const [usersRes, favsRes, scoresRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('favorites').select('id', { count: 'exact', head: true }),
      supabase.from('game_scores').select('id', { count: 'exact', head: true }),
      supabase.from('user_settings').select('user_id', { count: 'exact', head: true }),
    ]);
    return {
      totalUsers: usersRes.count ?? 0,
      totalFavorites: favsRes.count ?? 0,
      totalScores: scoresRes.count ?? 0,
      totalSettings: settingsRes.count ?? 0,
    };
  } catch {
    return { totalUsers: 0, totalFavorites: 0, totalScores: 0, totalSettings: 0 };
  }
}

/** Get total user count */
export async function getUserCount(): Promise<number> {
  if (!supabase) return 0;
  try {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}
