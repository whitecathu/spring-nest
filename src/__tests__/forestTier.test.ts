import { describe, expect, it } from 'vitest';
import { tierAllowsParticles, tierAllowsVideo, type ForestTier } from '../lib/forest/forestTier';

describe('forestTier gates', () => {
  const cases: Array<[ForestTier, boolean, boolean]> = [
    ['high', true, true],
    ['mid', true, true],
    ['low', false, false],
  ];

  it.each(cases)('tier %s → video=%s particles=%s', (tier, video, particles) => {
    expect(tierAllowsVideo(tier)).toBe(video);
    expect(tierAllowsParticles(tier)).toBe(particles);
  });
});
