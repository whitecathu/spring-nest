import { useEffect, useState } from 'react';

export type VisualCapabilityMode = 'desktop-3d' | 'lightweight';

export type VisualCapabilityReason =
  | 'capable'
  | 'server'
  | 'reduced-motion'
  | 'coarse-pointer'
  | 'narrow-viewport'
  | 'low-power'
  | 'no-webgl';

export type VisualCapabilityInput = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  width: number;
  hardwareConcurrency: number;
  webglAvailable: boolean;
};

export type VisualCapability = {
  mode: VisualCapabilityMode;
  reason: VisualCapabilityReason;
};

const MIN_DESKTOP_WIDTH = 900;
const MIN_HARDWARE_CONCURRENCY = 4;
let cachedWebGLAvailable: boolean | undefined;

export function canUseDesktopGlassGarden(input: VisualCapabilityInput) {
  return getVisualCapability(input).mode === 'desktop-3d';
}

export function getVisualCapability(input: VisualCapabilityInput): VisualCapability {
  if (input.reducedMotion) return { mode: 'lightweight', reason: 'reduced-motion' };
  if (input.coarsePointer) return { mode: 'lightweight', reason: 'coarse-pointer' };
  if (input.width < MIN_DESKTOP_WIDTH) return { mode: 'lightweight', reason: 'narrow-viewport' };
  if (input.hardwareConcurrency <= MIN_HARDWARE_CONCURRENCY) {
    return { mode: 'lightweight', reason: 'low-power' };
  }
  if (!input.webglAvailable) return { mode: 'lightweight', reason: 'no-webgl' };
  return { mode: 'desktop-3d', reason: 'capable' };
}

export function detectWebGLAvailable() {
  if (typeof cachedWebGLAvailable === 'boolean') return cachedWebGLAvailable;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    cachedWebGLAvailable = Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    );
    return cachedWebGLAvailable;
  } catch {
    cachedWebGLAvailable = false;
    return false;
  }
}

export function readVisualCapabilityInput(): VisualCapabilityInput {
  if (typeof window === 'undefined') {
    return {
      reducedMotion: true,
      coarsePointer: true,
      width: 0,
      hardwareConcurrency: 0,
      webglAvailable: false,
    };
  }

  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    width: window.innerWidth,
    hardwareConcurrency: navigator.hardwareConcurrency ?? MIN_HARDWARE_CONCURRENCY,
    webglAvailable: detectWebGLAvailable(),
  };
}

export function useVisualCapability() {
  const [capability, setCapability] = useState<VisualCapability>(() => {
    if (typeof window === 'undefined') return { mode: 'lightweight', reason: 'server' };
    return getVisualCapability(readVisualCapabilityInput());
  });

  useEffect(() => {
    const update = () => setCapability(getVisualCapability(readVisualCapabilityInput()));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    update();
    reducedMotion.addEventListener('change', update);
    coarsePointer.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      reducedMotion.removeEventListener('change', update);
      coarsePointer.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return capability;
}
