import { describe, it, expect, beforeEach } from 'vitest';
import { getFavorites, addFavorite, removeFavorite, isFavorited, toggleFavorite } from '../services/favoriteService';

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  } as Storage;
});

describe('favoriteService', () => {
  const userId = 'user-1';

  describe('addFavorite', () => {
    it('should add an item to favorites', () => {
      addFavorite(userId, 'item-1');
      expect(getFavorites(userId)).toContain('item-1');
    });

    it('should not add duplicate items', () => {
      addFavorite(userId, 'item-1');
      addFavorite(userId, 'item-1');
      expect(getFavorites(userId)).toHaveLength(1);
    });

    it('should support multiple items', () => {
      addFavorite(userId, 'item-1');
      addFavorite(userId, 'item-2');
      addFavorite(userId, 'item-3');
      expect(getFavorites(userId)).toHaveLength(3);
    });
  });

  describe('removeFavorite', () => {
    it('should remove an item from favorites', () => {
      addFavorite(userId, 'item-1');
      addFavorite(userId, 'item-2');
      removeFavorite(userId, 'item-1');
      expect(getFavorites(userId)).toEqual(['item-2']);
    });

    it('should handle removing non-existent item', () => {
      addFavorite(userId, 'item-1');
      removeFavorite(userId, 'item-999');
      expect(getFavorites(userId)).toHaveLength(1);
    });

    it('should handle removing from user with no favorites', () => {
      expect(() => removeFavorite('new-user', 'item-1')).not.toThrow();
    });
  });

  describe('isFavorited', () => {
    it('should return true for favorited item', () => {
      addFavorite(userId, 'item-1');
      expect(isFavorited(userId, 'item-1')).toBe(true);
    });

    it('should return false for non-favorited item', () => {
      expect(isFavorited(userId, 'item-1')).toBe(false);
    });

    it('should return false for non-existent user', () => {
      expect(isFavorited('ghost-user', 'item-1')).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add item if not favorited', () => {
      const result = toggleFavorite(userId, 'item-1');
      expect(result).toBe(true);
      expect(getFavorites(userId)).toContain('item-1');
    });

    it('should remove item if already favorited', () => {
      addFavorite(userId, 'item-1');
      const result = toggleFavorite(userId, 'item-1');
      expect(result).toBe(false);
      expect(getFavorites(userId)).not.toContain('item-1');
    });
  });

  describe('data isolation', () => {
    it('should keep favorites separate per user', () => {
      addFavorite('user-a', 'item-1');
      addFavorite('user-b', 'item-2');
      expect(getFavorites('user-a')).toEqual(['item-1']);
      expect(getFavorites('user-b')).toEqual(['item-2']);
    });
  });

  describe('error recovery', () => {
    it('should handle corrupted localStorage data', () => {
      store['spring_nest_favorites'] = 'corrupt-{data';
      expect(getFavorites(userId)).toEqual([]);
    });

    it('should recover by returning empty array for corrupted data', () => {
      store['spring_nest_favorites'] = '{broken';
      addFavorite(userId, 'item-1');
      expect(getFavorites(userId)).toContain('item-1');
    });
  });
});
