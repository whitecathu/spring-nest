/**
 * Centralized animation presets for Spring Nest.
 * "Q弹丝滑" = bouncy springs + silky smooth transitions.
 */

import { useState, useEffect } from 'react';

// ── Spring Presets ──────────────────────────────────────────
/** Bouncy spring — playful, elastic feedback (buttons, cards) */
export const springBouncy = { type: 'spring' as const, stiffness: 400, damping: 15, mass: 0.8 };

/** Smooth spring — elegant, controlled (page elements, modals) */
export const springSmooth = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 };

/** Snappy spring — fast, responsive (hover, focus) */
export const springSnappy = { type: 'spring' as const, stiffness: 500, damping: 25, mass: 0.6 };

// ── Shared Grid Variants (Games & Tools) ────────────────────
/** Staggered container for card grids with smooth exit */
export const gridContainerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
  exit: {
    transition: { staggerChildren: 0.025, staggerDirection: -1 },
  },
};

/** Card entrance: spring-bouncy rise with scale */
export const gridCardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.92 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -12,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

// ── Page Transition ─────────────────────────────────────────
/** Route-level page transition — fade + slide-up */
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
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
