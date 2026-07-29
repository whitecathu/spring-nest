/**
 * GSAP animation presets — replaces motion/react spring configs.
 * Maps framer-motion spring physics to GSAP easing curves.
 */

// ── Easing Presets ─────────────────────────────────────────
/** Bouncy — playful, elastic feedback (buttons, cards) */
export const easeBouncy = 'back.out(1.7)';
export const durationBouncy = 0.5;

/** Smooth — elegant, controlled (page elements, modals) */
export const easeSmooth = 'power3.out';
export const durationSmooth = 0.4;

/** Snappy — fast, responsive (hover, focus) */
export const easeSnappy = 'power2.out';
export const durationSnappy = 0.25;

/** Magnetic — weighted hover for 3D cards */
export const easeMagnetic = 'elastic.out(1, 0.5)';
export const durationMagnetic = 0.6;

/** Expo out — cinematic entrance */
export const easeExpoOut = 'expo.out';
export const durationExpoOut = 0.6;

/** Exit tight — fast exit */
export const easeExitTight = 'power4.in';
export const durationExitTight = 0.16;

/** Soft ease — organic cubic-bezier */
export const easeSoft = 'power1.inOut';

// ── Duration Constants ─────────────────────────────────────
export const durations = {
  fast: 0.16,
  normal: 0.28,
  slow: 0.48,
  ambient: 18,
} as const;

// ── Stagger Constants ──────────────────────────────────────
export const staggers = {
  tight: 0.025,
  normal: 0.045,
  relaxed: 0.075,
} as const;

// ── Combined Presets ───────────────────────────────────────
export interface GsapPreset {
  ease: string;
  duration: number;
  stagger?: number;
}

export const presets = {
  bouncy: { ease: easeBouncy, duration: durationBouncy },
  smooth: { ease: easeSmooth, duration: durationSmooth },
  snappy: { ease: easeSnappy, duration: durationSnappy },
  magnetic: { ease: easeMagnetic, duration: durationMagnetic },
  expoOut: { ease: easeExpoOut, duration: durationExpoOut },
  exitTight: { ease: easeExitTight, duration: durationExitTight },
} as const;

// ── Surface Motion Presets ─────────────────────────────────
export type SurfaceMotionTone = 'tool' | 'game' | 'playful' | 'quiet' | 'glassGarden';

export function getSurfacePreset(tone: SurfaceMotionTone = 'tool') {
  switch (tone) {
    case 'quiet':
      return { hover: {}, tap: { scale: 0.99 }, ...presets.magnetic };
    case 'game':
    case 'playful':
      return {
        hover: { y: -8, scale: 1 },
        tap: { scale: 0.97 },
        ease: easeBouncy,
        duration: durationBouncy,
      };
    case 'glassGarden':
      return {
        hover: { y: -4, scale: 1.008, rotateX: 1.2 },
        tap: { scale: 0.985 },
        ...presets.magnetic,
      };
    default: // tool
      return {
        hover: { y: -5, scale: 1 },
        tap: { scale: 0.98 },
        ...presets.magnetic,
      };
  }
}

// ── Route Motion Profile ───────────────────────────────────
export type RouteMotionKind = 'home' | 'tool' | 'game' | 'detail' | 'quiet';

export function getRouteMotionProfile(kind: RouteMotionKind) {
  const preset =
    kind === 'game'
      ? presets.bouncy
      : kind === 'tool' || kind === 'detail'
        ? presets.magnetic
        : presets.smooth;

  return {
    enter: {
      opacity: 0,
      y: kind === 'quiet' ? 8 : 18,
      scale: 1,
      duration: preset.duration,
      ease: preset.ease,
    },
    exit: {
      opacity: 0,
      y: -8,
      duration: durations.fast,
      ease: easeExitTight,
    },
  };
}

// ── Grid / List Stagger ────────────────────────────────────
export const gridStagger = {
  container: { stagger: staggers.normal, delay: staggers.tight },
  card: {
    enter: { opacity: 0, y: 28, scale: 0.96, duration: 0.5, ease: easeBouncy },
    exit: { opacity: 0, y: -10, duration: durations.fast, ease: easeExitTight },
  },
};

// ── Hero Orchestration ─────────────────────────────────────
export const heroStagger = {
  stage: { stagger: staggers.relaxed, delay: staggers.tight, duration: durations.slow, ease: easeExpoOut },
  item: { duration: 0.4, ease: easeSmooth },
  panel: { duration: 0.5, ease: easeSmooth },
};

// ── Loading Animation ──────────────────────────────────────
export const loadingConfig = {
  float: { duration: 1.8, repeat: -1, yoyo: true, ease: easeSoft },
  progress: { duration: 2, repeat: -1, ease: 'power1.inOut' },
  particle: { duration: 4, repeat: -1, ease: 'none' },
};

// ── Page Transition Variants ───────────────────────────────
export const pageTransitionVariants = getRouteMotionProfile('home');

export const presenceBlockVariants = {
  enter: { opacity: 0, y: 10, duration: durations.normal, ease: easeExpoOut },
  exit: { opacity: 0, y: -6, duration: durations.fast, ease: easeExitTight },
};

export const motionListVariants = {
  stagger: staggers.normal,
  delay: staggers.tight,
};

export const heroStageVariants = {
  stagger: staggers.relaxed,
  delay: staggers.tight,
  duration: durations.slow,
  ease: easeExpoOut,
};

export const heroItemVariants = {
  duration: 0.4,
  ease: easeSmooth,
};

export const heroPanelVariants = {
  duration: 0.5,
  ease: easeSmooth,
};

export const sectionRevealVariants = {
  duration: durations.normal,
  ease: easeExpoOut,
};

// ── Ambient Float ──────────────────────────────────────────
export function getAmbientFloatConfig(duration: number = durations.ambient, delay: number = 0) {
  return { duration, repeat: -1, delay, ease: easeSoft, yoyo: true };
}

// ── Floating Particles ─────────────────────────────────────
export const floatingParticles = [
  { x: -40, y: -30, delay: 0, size: 4 },
  { x: 35, y: -25, delay: 0.5, size: 3 },
  { x: -30, y: 25, delay: 1, size: 5 },
  { x: 40, y: 20, delay: 1.5, size: 3 },
  { x: 0, y: -40, delay: 0.8, size: 4 },
  { x: -20, y: 35, delay: 1.2, size: 3 },
];
