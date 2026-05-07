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

/** Gentle spring — soft, dreamy (decorative, background) */
export const springGentle = { type: 'spring' as const, stiffness: 200, damping: 20, mass: 1.2 };

/** Quick spring — fast micro-interactions (tooltips, ripples, badges) */
export const springQuick = { type: 'spring' as const, stiffness: 600, damping: 30, mass: 0.5 };

// ── Transition Presets ──────────────────────────────────────
/** Standard fade-in-up for scroll reveals */
export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

/** Stagger container — add to parent, children use fadeInUp */
export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
};

/** Scale-in for cards and modals */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
  transition: springSmooth,
};

/** Slide-in from left */
export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: springSmooth,
};

/** Slide-in from right */
export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: springSmooth,
};

/** Fade + scale-in for micro-interactions (badges, tooltips, small UI) */
export const fadeScaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: springQuick,
};

/** Slide-up with spring physics (modals, bottom sheets) */
export const slideUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: springSmooth },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

// ── Loading State Presets ────────────────────────────────────
/** Floating particles around a loading indicator */
export const particleFloat = (x: number, y: number, delay: number) => ({
  animate: {
    x: [0, x, 0],
    y: [0, y, 0],
    opacity: [0, 0.6, 0],
    scale: [0.5, 1, 0.5],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    delay,
    ease: 'easeInOut' as const,
  },
});

/** Progress bar sliding animation */
export const progressSlide = {
  animate: { x: ['-100%', '100%'] },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
};

// ── Hover/Interaction Presets ───────────────────────────────
/** Card hover — lift + subtle scale */
export const hoverLift = {
  whileHover: { y: -8, scale: 1.02, transition: springBouncy },
  whileTap: { scale: 0.97, transition: springSnappy },
};

/** Button press — satisfying squish */
export const buttonPress = {
  whileHover: { scale: 1.05, transition: springBouncy },
  whileTap: { scale: 0.93, transition: { ...springBouncy, stiffness: 600 } },
};

/** Icon wiggle on hover */
export const iconWiggle = {
  whileHover: { rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } },
};

// ── Page Transition ─────────────────────────────────────────
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
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

/** Returns the given motion config, or instant no-op if reduced motion is preferred */
export function withReducedMotion<T extends Record<string, unknown>>(
  config: T,
  reduced: boolean,
): T | { initial: false; animate: {}; transition: { duration: 0 } } {
  if (reduced) {
    return { initial: false, animate: {}, transition: { duration: 0 } };
  }
  return config;
}
