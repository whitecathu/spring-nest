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

// ── Page Transition ─────────────────────────────────────────
/** Tool page wrapper — fade + slide-up entrance, used by individual tool pages */
export const toolPageEnter = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

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
