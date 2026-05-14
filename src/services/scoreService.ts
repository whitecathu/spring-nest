import { supabase } from '../lib/supabase';
import { syncScoreToCloud, getLeaderboard, type LeaderboardEntry } from './cloudSyncService';

export type { LeaderboardEntry };

const SCORE_KEYS: Record<string, string> = {
  '2048': 'spring_nest_2048_best',
  memory: 'spring_nest_memory_best',
  whackamole: 'spring_nest_whackamole_best',
};

/** Get best score for a game (localStorage first, then cloud if logged in) */
export function getBestScore(gameSlug: string): number {
  const key = SCORE_KEYS[gameSlug];
  if (!key) return 0;
  try {
    return JSON.parse(localStorage.getItem(key) || '0') as number;
  } catch {
    return 0;
  }
}

/** Save best score to localStorage + sync to cloud if logged in */
export function saveBestScore(gameSlug: string, score: number, userId?: string): void {
  const key = SCORE_KEYS[gameSlug];
  if (!key) return;

  const currentBest = getBestScore(gameSlug);
  if (score <= currentBest) return; // Only save if it's a new best

  localStorage.setItem(key, JSON.stringify(score));

  // Sync to cloud if user is logged in and Supabase is configured
  if (userId && userId !== 'guest' && supabase) {
    syncScoreToCloud(userId, gameSlug, score).catch(() => {
      // Silently fail - localStorage is the source of truth
    });
  }
}

/** Fetch leaderboard from Supabase */
export async function fetchLeaderboard(gameSlug: string, limit = 20): Promise<LeaderboardEntry[]> {
  return getLeaderboard(gameSlug, limit);
}
