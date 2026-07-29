import { describe, expect, it } from 'vitest';
import { getGameCategoryBySlug } from '../lib/catalogRoutes';

function isGamePlayPath(pathname: string): boolean {
  const match = pathname.match(/^\/games\/([^/]+)/);
  const slug = match?.[1];
  if (!slug) return false;
  if (getGameCategoryBySlug(slug)) return false;
  return true;
}

describe('isGamePlayPath', () => {
  it('treats bare /games as non-gameplay', () => {
    expect(isGamePlayPath('/games')).toBe(false);
  });

  it('treats category list routes as non-gameplay', () => {
    expect(isGamePlayPath('/games/puzzle')).toBe(false);
    expect(isGamePlayPath('/games/action')).toBe(false);
  });

  it('treats concrete game slugs as gameplay', () => {
    expect(isGamePlayPath('/games/2048')).toBe(true);
    expect(isGamePlayPath('/games/snake')).toBe(true);
  });
});

describe('forest splash memory helpers', () => {
  it('exports stable key constants via module', async () => {
    const mod = await import('../lib/forest/forestSplashMemory');
    expect(mod.FOREST_SPLASH_KEY).toBe('spring_nest_forest_splash');
    expect(mod.FOREST_SPLASH_TTL_MS).toBeGreaterThan(0);
  });
});
