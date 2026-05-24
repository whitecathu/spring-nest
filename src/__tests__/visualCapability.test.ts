import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canUseDesktopGlassGarden,
  getVisualCapability,
  type VisualCapabilityInput,
} from '../lib/visualCapability';

function baseInput(overrides: Partial<VisualCapabilityInput> = {}): VisualCapabilityInput {
  return {
    reducedMotion: false,
    coarsePointer: false,
    width: 1440,
    hardwareConcurrency: 8,
    webglAvailable: true,
    ...overrides,
  };
}

describe('visual capability detection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enables desktop 3d for a capable desktop context', () => {
    expect(canUseDesktopGlassGarden(baseInput())).toBe(true);
    expect(getVisualCapability(baseInput()).mode).toBe('desktop-3d');
  });

  it('falls back for reduced motion', () => {
    const result = getVisualCapability(baseInput({ reducedMotion: true }));
    expect(result.mode).toBe('lightweight');
    expect(result.reason).toBe('reduced-motion');
  });

  it('falls back for coarse pointers and narrow screens', () => {
    expect(getVisualCapability(baseInput({ coarsePointer: true })).reason).toBe('coarse-pointer');
    expect(getVisualCapability(baseInput({ width: 640 })).reason).toBe('narrow-viewport');
  });

  it('falls back when hardware is weak or WebGL is unavailable', () => {
    expect(getVisualCapability(baseInput({ hardwareConcurrency: 2 })).reason).toBe('low-power');
    expect(getVisualCapability(baseInput({ hardwareConcurrency: 4 })).reason).toBe('low-power');
    expect(getVisualCapability(baseInput({ webglAvailable: false })).reason).toBe('no-webgl');
  });
});
