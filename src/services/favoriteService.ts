import { supabase } from '../lib/supabase';
import { syncFavoritesToCloud, syncFavoritesFromCloud } from './cloudSyncService';

const STORAGE_FAVORITES_KEY = 'spring_nest_favorites';

interface FavoritesData {
  [userId: string]: string[]; // userId -> array of item IDs
}

function getFavoritesData(): FavoritesData {
  try {
    const data = localStorage.getItem(STORAGE_FAVORITES_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    // Ensure all values are arrays of strings
    const result: FavoritesData = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        result[key] = value.filter((v): v is string => typeof v === 'string');
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveFavoritesData(data: FavoritesData): void {
  localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(data));
}

export function getFavorites(userId: string): string[] {
  const data = getFavoritesData();
  return data[userId] || [];
}

export function addFavorite(userId: string, itemId: string): void {
  const data = getFavoritesData();
  if (!data[userId]) {
    data[userId] = [];
  }
  if (!data[userId].includes(itemId)) {
    data[userId].push(itemId);
    saveFavoritesData(data);
  }
}

export function removeFavorite(userId: string, itemId: string): void {
  const data = getFavoritesData();
  if (data[userId]) {
    data[userId] = data[userId].filter(id => id !== itemId);
    saveFavoritesData(data);
  }
}

export function isFavorited(userId: string, itemId: string): boolean {
  const data = getFavoritesData();
  return data[userId]?.includes(itemId) ?? false;
}

export function toggleFavorite(userId: string, itemId: string): boolean {
  if (isFavorited(userId, itemId)) {
    removeFavorite(userId, itemId);
    return false;
  } else {
    addFavorite(userId, itemId);
    return true;
  }
}

// ─── Sync-Aware Versions ────────────────────────────────────────────────────

/** Add favorite with cloud sync */
export async function addFavoriteSync(userId: string, itemId: string): Promise<void> {
  addFavorite(userId, itemId);
  if (supabase && userId !== 'guest') {
    const favorites = getFavorites(userId);
    await syncFavoritesToCloud(userId, favorites);
  }
}

/** Remove favorite with cloud sync */
export async function removeFavoriteSync(userId: string, itemId: string): Promise<void> {
  removeFavorite(userId, itemId);
  if (supabase && userId !== 'guest') {
    const favorites = getFavorites(userId);
    await syncFavoritesToCloud(userId, favorites);
  }
}

/** Toggle favorite with cloud sync */
export async function toggleFavoriteSync(userId: string, itemId: string): Promise<boolean> {
  const nowFavorited = toggleFavorite(userId, itemId);
  if (supabase && userId !== 'guest') {
    const favorites = getFavorites(userId);
    await syncFavoritesToCloud(userId, favorites);
  }
  return nowFavorited;
}

/** Merge guest favorites to cloud after login */
export async function mergeGuestFavorites(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const guestFavorites = getFavorites('guest');
    if (guestFavorites.length === 0) return;

    // Get existing cloud favorites
    const cloudFavorites = await syncFavoritesFromCloud(userId);
    const merged = [...new Set([...cloudFavorites, ...guestFavorites])];
    await syncFavoritesToCloud(userId, merged);

    // Also save merged list to the user's localStorage
    const data = getFavoritesData();
    data[userId] = merged;
    saveFavoritesData(data);
  } catch {
    // Silently fail
  }
}

/** Load favorites from cloud and merge with local */
export async function loadFavoritesFromCloud(userId: string): Promise<string[]> {
  if (!supabase || userId === 'guest') return getFavorites(userId);
  try {
    const cloudFavorites = await syncFavoritesFromCloud(userId);
    const localFavorites = getFavorites(userId);
    const merged = [...new Set([...localFavorites, ...cloudFavorites])];

    // Save merged list locally
    const data = getFavoritesData();
    data[userId] = merged;
    saveFavoritesData(data);

    // Sync merged list back to cloud
    await syncFavoritesToCloud(userId, merged);

    return merged;
  } catch {
    return getFavorites(userId);
  }
}
