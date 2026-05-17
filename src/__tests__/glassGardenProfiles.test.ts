import { describe, expect, it } from 'vitest';
import {
  getGlassGardenProfile,
  glassGardenProfiles,
} from '../components/animations/glassGarden/sceneProfiles';

describe('glass garden scene profiles', () => {
  it('defines startup as the richest short scene', () => {
    const startup = glassGardenProfiles.startup;
    expect(startup.scene).toBe('terrarium-emergence');
    expect(startup.soilClumps).toBeGreaterThan(glassGardenProfiles.home.soilClumps);
    expect(startup.dewDrops).toBeGreaterThan(glassGardenProfiles.detail.dewDrops);
  });

  it('keeps detail and tools quieter than home', () => {
    expect(glassGardenProfiles.detail.opacity).toBeLessThan(glassGardenProfiles.home.opacity);
    expect(glassGardenProfiles.tools.particleCount).toBeLessThan(
      glassGardenProfiles.games.particleCount,
    );
  });

  it('falls back to detail profile for unknown keys', () => {
    expect(getGlassGardenProfile('unknown-route')).toEqual(glassGardenProfiles.detail);
  });
});
