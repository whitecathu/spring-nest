import { useState, useCallback, useEffect } from 'react';
import { getUserId } from '../services/authService';
import { getFavorites, toggleFavorite, isFavorited } from '../services/favoriteService';

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
    setFavoriteIds(getFavorites(userId));
    return nowFavorited;
  }, []);

  const checkFavorited = useCallback((itemId: string): boolean => {
    return isFavorited(getUserId(), itemId);
  }, []);

  return { favoriteIds, toggle, checkFavorited };
}
