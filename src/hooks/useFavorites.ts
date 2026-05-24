import { useState, useCallback, useEffect } from 'react';
import { getUserId } from '../services/authService';
import { getFavorites, toggleFavorite, toggleFavoriteSync, isFavorited } from '../services/favoriteService';
import { trackFavorite } from '../lib/analytics';

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
    setFavoriteIds(getFavorites(userId));
    // Fire-and-forget cloud sync
    toggleFavoriteSync(userId, itemId).catch(() => {});
    return nowFavorited;
  }, []);

  const checkFavorited = useCallback((itemId: string): boolean => {
    return isFavorited(getUserId(), itemId);
  }, []);

  return { favoriteIds, toggle, checkFavorited };
}
