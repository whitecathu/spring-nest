import { describe, it, expect } from 'vitest';
import { search } from '../services/searchService';

describe('searchService', () => {
  describe('search by name', () => {
    it('should find 2048 game by exact name', () => {
      const results = search('2048');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe('game-1');
    });

    it('should find Calculator tool by name', () => {
      const results = search('计算器');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.item.id === 'tool-1')).toBe(true);
    });

    it('should find by English name', () => {
      const results = search('Pomodoro');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.item.id === 'tool-2')).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = search('CALCULATOR');
      expect(results.some((r) => r.item.id === 'tool-1')).toBe(true);
    });
  });

  describe('search by category', () => {
    it('should find items by Chinese category', () => {
      const results = search('益智解谜');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.item.category === '益智解谜')).toBe(true);
    });

    it('should find items by English category', () => {
      const results = search('Daily Utility');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('search by description', () => {
    it('should find by description keywords', () => {
      const results = search('合并');
      expect(results.some((r) => r.item.id === 'game-1')).toBe(true);
    });

    it('should find by English description', () => {
      const results = search('merge');
      expect(results.some((r) => r.item.id === 'game-1')).toBe(true);
    });
  });

  describe('search by tags', () => {
    it('should find by exact tag match', () => {
      const results = search('puzzle');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find by partial tag match', () => {
      const results = search('数字');
      expect(results.some((r) => r.item.id === 'game-1')).toBe(true);
    });
  });

  describe('empty and edge cases', () => {
    it('should return empty array for empty query', () => {
      expect(search('')).toHaveLength(0);
    });

    it('should return empty array for whitespace query', () => {
      expect(search('   ')).toHaveLength(0);
    });

    it('should return empty array for no matches', () => {
      const results = search('xyznonexistent123');
      expect(results).toHaveLength(0);
    });
  });

  describe('result ordering', () => {
    it('should sort results by relevance score', () => {
      const results = search('puzzle');
      expect(results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should give highest score to exact name matches', () => {
      const results = search('2048');
      expect(results[0].score).toBeGreaterThanOrEqual(100);
    });
  });
});
