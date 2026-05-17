import { describe, expect, it } from 'vitest';
import { games } from '../data/games';
import { tools } from '../data/tools';
import {
  backgroundProfiles,
  gameBackgroundProfilesBySlug,
  getBackgroundProfileForLocation,
  getSlugFromRoute,
  toolBackgroundProfilesBySlug,
} from '../lib/backgroundProfiles';

describe('backgroundProfiles', () => {
  it('maps every tool slug to an existing background profile', () => {
    for (const tool of tools) {
      const slug = getSlugFromRoute(tool.route);
      const profileKey = toolBackgroundProfilesBySlug[slug];
      expect(profileKey, `${slug} is missing a background profile`).toBeTruthy();
      expect(backgroundProfiles[profileKey]).toBeTruthy();
    }
  });

  it('maps every game slug to an existing background profile', () => {
    for (const game of games) {
      const slug = getSlugFromRoute(game.route);
      const profileKey = gameBackgroundProfilesBySlug[slug];
      expect(profileKey, `${slug} is missing a background profile`).toBeTruthy();
      expect(backgroundProfiles[profileKey]).toBeTruthy();
    }
  });

  it('selects route-level atmospheres and detail-specific profiles', () => {
    expect(getBackgroundProfileForLocation('/').key).toBe('home-garden');
    expect(getBackgroundProfileForLocation('/tools').key).toBe('tools-flow');
    expect(getBackgroundProfileForLocation('/tools/calculator').key).toBe('calculator-grid');
    expect(getBackgroundProfileForLocation('/games').key).toBe('games-playful');
    expect(getBackgroundProfileForLocation('/games/bubble-pop').key).toBe('bubble-rise');
    expect(getBackgroundProfileForLocation('/favorites').key).toBe('favorites-glow');
    expect(getBackgroundProfileForLocation('/profile').key).toBe('settings-minimal');
    expect(getBackgroundProfileForLocation('/about').key).toBe('settings-minimal');
    expect(getBackgroundProfileForLocation('/offline').key).toBe('offline-cabin');
    expect(getBackgroundProfileForLocation('/missing-route').key).toBe('not-found-path');
  });

  it('quietly changes search atmosphere when no results are expected', () => {
    expect(getBackgroundProfileForLocation('/search', '?q=2048').key).toBe('search-focus');
    expect(getBackgroundProfileForLocation('/search', '?q=not-a-real-spring-nest-item').key).toBe(
      'empty-quiet',
    );
  });
});
