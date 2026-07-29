import { useEffect, useState } from 'react';
import { detectWebGLAvailable } from '../visualCapability';

export type ForestTier = 'high' | 'mid' | 'low';

export type ForestTierInput = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  width: number;
  hardwareConcurrency: number;
  webglAvailable: boolean;
};

const MIN_DESKTOP_WIDTH = 900;
const MIN_HIGH_CORES = 4;
const TIER_RANK: Record<ForestTier, number> = { low: 0, mid: 1, high: 2 };
const TIER_BY_RANK: ForestTier[] = ['low', 'mid', 'high'];

function clampTier(tier: ForestTier, ceiling: ForestTier): ForestTier {
  return TIER_RANK[tier] <= TIER_RANK[ceiling] ? tier : ceiling;
}

function stepDown(tier: ForestTier): ForestTier {
  const rank = TIER_RANK[tier];
  return rank <= 0 ? 'low' : TIER_BY_RANK[rank - 1]!;
}

function stepUp(tier: ForestTier): ForestTier {
  const rank = TIER_RANK[tier];
  return rank >= 2 ? 'high' : TIER_BY_RANK[rank + 1]!;
}

/**
 * Capability ceiling for forest effects.
 * reducedMotion / coarse / narrow → low; ≤4 cores → mid; else high;
 * missing WebGL caps the result at mid.
 */
export function getForestTier(input: ForestTierInput): ForestTier {
  let tier: ForestTier = 'high';

  if (input.reducedMotion || input.coarsePointer || input.width < MIN_DESKTOP_WIDTH) {
    tier = 'low';
  } else if (input.hardwareConcurrency <= MIN_HIGH_CORES) {
    tier = 'mid';
  }

  if (!input.webglAvailable) {
    tier = clampTier(tier, 'mid');
  }

  return tier;
}

export function readForestTierInput(): ForestTierInput {
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
    hardwareConcurrency: navigator.hardwareConcurrency ?? MIN_HIGH_CORES,
    webglAvailable: detectWebGLAvailable(),
  };
}

/** Live capability tier from viewport / motion / pointer / cores / WebGL. */
export function useForestTier(): ForestTier {
  const [tier, setTier] = useState<ForestTier>(() => {
    if (typeof window === 'undefined') return 'low';
    return getForestTier(readForestTierInput());
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => setTier(getForestTier(readForestTierInput()));
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

  return tier;
}

export function tierAllowsVideo(tier: ForestTier): boolean {
  return tier !== 'low';
}

export function tierAllowsParticles(tier: ForestTier): boolean {
  return tier !== 'low';
}

export function tierAllowsCursor(tier: ForestTier): boolean {
  return tier !== 'low';
}

export function tierAllowsEggs(tier: ForestTier): boolean {
  return tier === 'high';
}

/** Particle budget: high 60 / mid 35 / low 0. */
export function particleCap(tier: ForestTier): number {
  if (tier === 'high') return 60;
  if (tier === 'mid') return 35;
  return 0;
}

const FPS_LOW = 45;
const FPS_HIGH = 60;
const LOW_STREAK = 3;
const STABLE_UPGRADE_MS = 5000;
const COOLDOWN_MS = 2500;

export type FpsTierController = {
  start: (initial: ForestTier, ceiling?: ForestTier) => void;
  stop: () => void;
  setCeiling: (ceiling: ForestTier) => void;
  getTier: () => ForestTier;
  /** Optional external sample if the host already owns an rAF loop. */
  sample: (now: number) => void;
};

/**
 * Adaptive FPS tier controller.
 * 3 consecutive frames &lt;45fps → downgrade one step;
 * 5s stable ≥60fps → upgrade one step (capped by ceiling);
 * changes enter a cooldown before the next shift.
 */
export function createFpsTierController(
  onTierChange: (tier: ForestTier) => void,
): FpsTierController {
  let current: ForestTier = 'high';
  let ceiling: ForestTier = 'high';
  let lastTime = 0;
  let lowStreak = 0;
  let stableHighMs = 0;
  let cooldownUntil = 0;
  let rafId = 0;
  let running = false;

  const emit = (next: ForestTier) => {
    const clamped = clampTier(next, ceiling);
    if (clamped === current) return;
    current = clamped;
    cooldownUntil =
      typeof performance !== 'undefined' ? performance.now() + COOLDOWN_MS : COOLDOWN_MS;
    lowStreak = 0;
    stableHighMs = 0;
    onTierChange(current);
  };

  const sample = (now: number) => {
    if (!lastTime) {
      lastTime = now;
      return;
    }

    const dt = Math.max(now - lastTime, 0.001);
    lastTime = now;
    const fps = 1000 / dt;

    if (now < cooldownUntil) {
      lowStreak = 0;
      stableHighMs = 0;
      return;
    }

    if (fps < FPS_LOW) {
      lowStreak += 1;
      stableHighMs = 0;
      if (lowStreak >= LOW_STREAK) {
        emit(stepDown(current));
      }
      return;
    }

    lowStreak = 0;

    if (fps >= FPS_HIGH) {
      stableHighMs += dt;
      if (stableHighMs >= STABLE_UPGRADE_MS) {
        emit(stepUp(current));
      }
    } else {
      stableHighMs = 0;
    }
  };

  const loop = (now: number) => {
    sample(now);
    if (running && typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(loop);
    }
  };

  return {
    start(initial, nextCeiling = initial) {
      current = clampTier(initial, nextCeiling);
      ceiling = nextCeiling;
      lastTime = 0;
      lowStreak = 0;
      stableHighMs = 0;
      cooldownUntil = 0;
      if (running) return;
      if (typeof requestAnimationFrame !== 'function') return;
      running = true;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      if (typeof cancelAnimationFrame === 'function' && rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = 0;
      lastTime = 0;
    },
    setCeiling(nextCeiling) {
      ceiling = nextCeiling;
      if (TIER_RANK[current] > TIER_RANK[ceiling]) {
        emit(ceiling);
      }
    },
    getTier: () => current,
    sample,
  };
}
