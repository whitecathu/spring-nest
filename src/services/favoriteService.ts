import { supabase } from '../lib/supabase';
import { syncFavoritesToCloud, syncFavoritesFromCloud } from './cloudSyncService';
import { reportError } from '../lib/errorReporting';
import {
  createSyncReceipt,
  publishSyncFailure,
  syncFailure,
  syncSuccess,
  type SyncReceipt,
  type SyncResult,
} from './syncResult';

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
    data[userId] = data[userId].filter((id) => id !== itemId);
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

function reportSyncFailure(result: SyncResult<unknown>, source: string) {
  if (result.ok === false) {
    publishSyncFailure(result);
    reportError(new Error(result.message), { source, code: result.code });
  }
}

/** Add favorite with cloud sync */
export async function addFavoriteSync(
  userId: string,
  itemId: string,
): Promise<SyncResult<SyncReceipt>> {
  addFavorite(userId, itemId);
  if (!supabase || userId === 'guest') return syncSuccess(createSyncReceipt(0));
  const result = await syncFavoritesToCloud(userId, getFavorites(userId));
  reportSyncFailure(result, 'addFavoriteSync');
  return result;
}

/** Remove favorite with cloud sync */
export async function removeFavoriteSync(
  userId: string,
  itemId: string,
): Promise<SyncResult<SyncReceipt>> {
  removeFavorite(userId, itemId);
  if (!supabase || userId === 'guest') return syncSuccess(createSyncReceipt(0));
  const result = await syncFavoritesToCloud(userId, getFavorites(userId));
  reportSyncFailure(result, 'removeFavoriteSync');
  return result;
}

/** Toggle favorite with cloud sync */
export async function toggleFavoriteSync(
  userId: string,
  itemId: string,
): Promise<SyncResult<{ favorited: boolean; receipt: SyncReceipt }>> {
  const nowFavorited = toggleFavorite(userId, itemId);
  if (!supabase || userId === 'guest') {
    return syncSuccess({ favorited: nowFavorited, receipt: createSyncReceipt(0) });
  }
  const result = await syncFavoritesToCloud(userId, getFavorites(userId));
  reportSyncFailure(result, 'toggleFavoriteSync');
  return result.ok === true
    ? syncSuccess({ favorited: nowFavorited, receipt: result.data })
    : result;
}

/** Merge guest favorites to cloud after login */
export async function mergeGuestFavorites(userId: string): Promise<SyncResult<string[]>> {
  if (!supabase) return syncSuccess(getFavorites(userId));
  try {
    const guestFavorites = getFavorites('guest');
    if (guestFavorites.length === 0) return syncSuccess(getFavorites(userId));

    // Get existing cloud favorites
    const cloudResult = await syncFavoritesFromCloud(userId);
    if (cloudResult.ok === false) return cloudResult;
    const merged = [...new Set([...cloudResult.data, ...guestFavorites])];

    // Also save merged list to the user's localStorage
    const data = getFavoritesData();
    data[userId] = merged;
    saveFavoritesData(data);

    const uploadResult = await syncFavoritesToCloud(userId, merged);
    if (uploadResult.ok === false) {
      reportSyncFailure(uploadResult, 'mergeGuestFavorites');
      return uploadResult;
    }
    return syncSuccess(merged);
  } catch (err) {
    reportError(err as Error, { source: 'mergeGuestFavorites' });
    return syncFailure(err);
  }
}

/** Load favorites from cloud and merge with local */
export async function loadFavoritesFromCloud(userId: string): Promise<SyncResult<string[]>> {
  if (!supabase || userId === 'guest') return syncSuccess(getFavorites(userId));
  try {
    const cloudResult = await syncFavoritesFromCloud(userId);
    if (cloudResult.ok === false) return cloudResult;
    const localFavorites = getFavorites(userId);
    const merged = [...new Set([...localFavorites, ...cloudResult.data])];

    // Save merged list locally
    const data = getFavoritesData();
    data[userId] = merged;
    saveFavoritesData(data);

    // Sync merged list back to cloud
    const uploadResult = await syncFavoritesToCloud(userId, merged);
    if (uploadResult.ok === false) {
      reportSyncFailure(uploadResult, 'loadFavoritesFromCloud');
      return uploadResult;
    }

    return syncSuccess(merged);
  } catch (err) {
    reportError(err as Error, { source: 'loadFavoritesFromCloud' });
    return syncFailure(err);
  }
}
