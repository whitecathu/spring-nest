/**
 * Centralized animation presets for Spring Nest.
 * Motion stays on transform and opacity so the playful layer keeps a stable frame budget.
 */

import { useState, useEffect } from 'react';

// ── Spring Presets ──────────────────────────────────────────
/** Bouncy spring — playful, elastic feedback (buttons, cards) */
export const springBouncy = { type: 'spring' as const, stiffness: 400, damping: 15, mass: 0.8 };

/** Smooth spring — elegant, controlled (page elements, modals) */
export const springSmooth = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 };

/** Snappy spring — fast, responsive (hover, focus) */
export const springSnappy = { type: 'spring' as const, stiffness: 500, damping: 25, mass: 0.6 };

/** Weighted hover spring for 3D cards and magnetic controls */
export const springMagnetic = { type: 'spring' as const, stiffness: 180, damping: 22, mass: 0.35 };

/** Confident ease-out curve for cinematic entrances */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// ── Shared Grid Variants (Games & Tools) ────────────────────
/** Staggered container for card grids with smooth exit */
export const gridContainerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.035 },
  },
  exit: {
    transition: { staggerChildren: 0.018, staggerDirection: -1 },
  },
};

/** Card entrance: spatial matrix drop with transform-only motion */
export const gridCardVariants = {
  initial: {
    opacity: 0,
    y: 28,
    scale: 0.96,
    rotateX: -6,
    transformPerspective: 1100,
  },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { ...springBouncy, stiffness: 240, damping: 23 },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: -10,
    rotateX: 3,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

// ── Page Transition ─────────────────────────────────────────
/** Route-level page transition — spatial lift, no filters or layout animation */
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 22,
    scale: 0.985,
    rotateX: 3,
    transformPerspective: 1400,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.36, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.99,
    rotateX: -2,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

/** Tool page wrapper — fade + slide-up entrance, used by individual tool pages */
export const toolPageEnter = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

// ── Shared Loading Constants ─────────────────────────────────
/** Organic cubic-bezier easing — consistent across loading states */
export const softEase = [0.25, 0.1, 0.25, 1] as const;

/** Floating particle config for loading animations */
export const floatingParticles = [
  { x: -40, y: -30, delay: 0, size: 4 },
  { x: 35, y: -25, delay: 0.5, size: 3 },
  { x: -30, y: 25, delay: 1, size: 5 },
  { x: 40, y: 20, delay: 1.5, size: 3 },
  { x: 0, y: -40, delay: 0.8, size: 4 },
  { x: -20, y: 35, delay: 1.2, size: 3 },
];

// ── Reduced Motion ─────────────────────────────────────────
/** Hook that returns true when user prefers reduced motion */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
