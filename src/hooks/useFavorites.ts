import { useState, useCallback, useEffect } from 'react';
import { getUserId } from '../services/authService';
import { syncFavoritesToCloud } from '../services/cloudSyncService';
import { getFavorites, toggleFavorite, isFavorited } from '../services/favoriteService';
import { trackFavorite } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { publishSyncFailure } from '../services/syncResult';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    return getFavorites(getUserId());
  });

  useEffect(() => {
    setFavoriteIds(getFavorites(getUserId()));
  }, []);

  const toggle = useCallback((itemId: string): boolean => {
    const userId = getUserId();
    const nowFavorited = toggleFavorite(userId, itemId);
    trackFavorite(itemId);
    const nextFavorites = getFavorites(userId);
    setFavoriteIds(nextFavorites);
    if (supabase && userId !== 'guest') {
      void syncFavoritesToCloud(userId, nextFavorites).then(publishSyncFailure);
    }
    return nowFavorited;
  }, []);

  const checkFavorited = useCallback((itemId: string): boolean => {
    return isFavorited(getUserId(), itemId);
  }, []);

  return { favoriteIds, toggle, checkFavorited };
}
