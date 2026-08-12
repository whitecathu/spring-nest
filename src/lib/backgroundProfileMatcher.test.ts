import { describe, expect, it } from 'vitest';
import { backgroundProfiles } from './backgroundProfileData';
import {
  gameBackgroundProfilesBySlug,
  getBackgroundProfileForLocation,
  getSlugFromRoute,
  toolBackgroundProfilesBySlug,
} from './backgroundProfileMatcher';

describe('background profile matcher module', () => {
  it('keeps route extraction and explicit mappings separate from profile data', () => {
    expect(getSlugFromRoute('/tools/calculator/')).toBe('calculator');
    expect(backgroundProfiles[toolBackgroundProfilesBySlug.calculator].key).toBe('calculator-grid');
    expect(backgroundProfiles[gameBackgroundProfilesBySlug['bubble-pop']].key).toBe('bubble-rise');
  });

  it('uses search results to select focus or empty atmospheres', () => {
    expect(getBackgroundProfileForLocation('/search', '?q=2048').key).toBe('search-focus');
    expect(getBackgroundProfileForLocation('/search', '?q=definitely-missing').key).toBe(
      'empty-quiet',
    );
  });
});
