import { describe, expect, it } from 'vitest';
import {
  getRouteMotionProfile,
  getSurfaceMotionPreset,
  motionDurations,
  motionStaggers,
  springPlayful,
  springUtility,
} from '../lib/animations';

describe('motion design tokens', () => {
  it('defines stable duration and stagger scales', () => {
    expect(motionDurations.fast).toBeLessThan(motionDurations.normal);
    expect(motionDurations.normal).toBeLessThan(motionDurations.slow);
    expect(motionDurations.ambient).toBeGreaterThan(10);
    expect(motionStaggers.tight).toBeLessThan(motionStaggers.relaxed);
  });

  it('uses spring profiles that separate playful and utility motion', () => {
    expect(springPlayful.type).toBe('spring');
    expect(springUtility.type).toBe('spring');
    expect(springPlayful.stiffness).toBeGreaterThan(springUtility.stiffness);
    expect(springUtility.damping).toBeGreaterThan(springPlayful.damping);
  });

  it('returns route profiles by page family', () => {
    expect(getRouteMotionProfile('home').animate.transition).toMatchObject({
      type: 'spring',
    });
    expect(getRouteMotionProfile('game').animate.transition).toMatchObject({
      type: 'spring',
    });
    expect(getRouteMotionProfile('tool').animate.transition.damping).toBeGreaterThan(
      getRouteMotionProfile('game').animate.transition.damping,
    );
  });

  it('returns surface presets by interaction tone', () => {
    expect(getSurfaceMotionPreset('tool').hover.y).toBeLessThan(0);
    expect(getSurfaceMotionPreset('game').hover.y).toBeLessThan(
      getSurfaceMotionPreset('tool').hover.y,
    );
    expect(getSurfaceMotionPreset('quiet').hover.scale).toBe(1);
    expect(getSurfaceMotionPreset('glassGarden').hover.y).toBeLessThan(0);
    expect(getSurfaceMotionPreset('glassGarden').hover.scale).toBeGreaterThan(1);
  });
});
