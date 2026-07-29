/**
 * GSAP React hooks — replaces motion/react declarative API.
 * All hooks respect prefers-reduced-motion and clean up on unmount.
 */

import { useRef, useEffect, useCallback, useState, type RefCallback } from 'react';
import gsap from 'gsap';

// ── Reduced Motion ─────────────────────────────────────────
function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ── Core Ref Hook ──────────────────────────────────────────
/** Returns a ref that, when attached to an element, animates it with GSAP. */
export function useGsap<T extends HTMLElement = HTMLElement>(
  config: GsapAnimConfig,
): RefCallback<T> {
  const reducedMotion = useReducedMotion();
  const ref = useRef<T | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!ref.current || reducedMotion) return;
    const { from, to, duration = 0.4, ease = 'power2.out', delay = 0 } = config;

    if (from) gsap.set(ref.current, from);
    tweenRef.current = gsap.to(ref.current, { ...to, duration, ease, delay });

    return () => {
      tweenRef.current?.kill();
    };
  }, [reducedMotion, config]);

  return useCallback((node: T | null) => {
    ref.current = node;
  }, []);
}

interface GsapAnimConfig {
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  duration?: number;
  ease?: string;
  delay?: number;
}

// ── Simple Ref ─────────────────────────────────────────────
/** Returns a ref for manual GSAP control. */
export function useGsapRef<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  return ref;
}

// ── InView (IntersectionObserver) ──────────────────────────
interface UseInViewOptions {
  once?: boolean;
  margin?: string;
  amount?: number;
}

export function useInView<T extends HTMLElement>(
  options: UseInViewOptions = {},
): [RefCallback<T>, boolean] {
  const { once = false, margin = '0px' } = options;
  const [inView, setInView] = useState(false);
  const ref = useRef<T | null>(null);
  const hasTriggered = useRef(false);

  const callbackRef: RefCallback<T> = useCallback(
    (node: T | null) => {
      ref.current = node;
      if (!node) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          const visible = entry.isIntersecting;
          if (visible) {
            if (once && hasTriggered.current) return;
            hasTriggered.current = true;
          }
          setInView(visible);
        },
        { rootMargin: margin },
      );
      observer.observe(node);

      // Store observer for cleanup
      (node as any).__gsapObserver = observer;
    },
    [once, margin],
  );

  useEffect(() => {
    return () => {
      if (ref.current) {
        (ref.current as any).__gsapObserver?.disconnect();
      }
    };
  }, []);

  return [callbackRef, inView];
}

// ── Scroll Reveal ──────────────────────────────────────────
interface ScrollRevealOptions {
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
}

export function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {},
): RefCallback<T> {
  const {
    direction = 'up',
    delay = 0,
    duration = 0.5,
    distance = 24,
    once = true,
  } = options;
  const reducedMotion = useReducedMotion();
  const ref = useRef<T | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const callbackRef: RefCallback<T> = useCallback(
    (node: T | null) => {
      // Clean up previous
      if (ref.current) {
        (ref.current as any).__gsapScrollObserver?.disconnect();
      }
      tweenRef.current?.kill();
      ref.current = node;
      if (!node) return;

      if (reducedMotion) return;

      const offsets: Record<string, gsap.TweenVars> = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
      };

      gsap.set(node, { opacity: 0, ...offsets[direction] });

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            tweenRef.current = gsap.to(node, {
              opacity: 1,
              x: 0,
              y: 0,
              duration,
              delay,
              ease: 'power2.out',
            });
            if (once) observer.disconnect();
          } else if (!once) {
            gsap.set(node, { opacity: 0, ...offsets[direction] });
          }
        },
        { rootMargin: '-60px' },
      );
      observer.observe(node);
      (node as any).__gsapScrollObserver = observer;
    },
    [reducedMotion, direction, delay, duration, distance, once],
  );

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      if (ref.current) {
        (ref.current as any).__gsapScrollObserver?.disconnect();
      }
    };
  }, []);

  return callbackRef;
}

// ── Hover Scale ────────────────────────────────────────────
export function useHoverScale<T extends HTMLElement>(
  scale: number = 1.05,
  duration: number = 0.25,
): RefCallback<T> {
  const reducedMotion = useReducedMotion();
  const ref = useRef<T | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const callbackRef: RefCallback<T> = useCallback(
    (node: T | null) => {
      if (ref.current) {
        ref.current.removeEventListener('mouseenter', handleEnter);
        ref.current.removeEventListener('mouseleave', handleLeave);
      }
      tweenRef.current?.kill();
      ref.current = node;
      if (!node || reducedMotion) return;

      function handleEnter() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale, duration, ease: 'power2.out' });
      }
      function handleLeave() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale: 1, duration, ease: 'power2.out' });
      }

      node.addEventListener('mouseenter', handleEnter);
      node.addEventListener('mouseleave', handleLeave);
    },
    [reducedMotion, scale, duration],
  );

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      if (ref.current) {
        ref.current.removeEventListener('mouseenter', () => {});
        ref.current.removeEventListener('mouseleave', () => {});
      }
    };
  }, []);

  return callbackRef;
}

// ── Tap Scale ──────────────────────────────────────────────
export function useTapScale<T extends HTMLElement>(
  scale: number = 0.95,
  duration: number = 0.15,
): RefCallback<T> {
  const reducedMotion = useReducedMotion();
  const ref = useRef<T | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const callbackRef: RefCallback<T> = useCallback(
    (node: T | null) => {
      if (ref.current) {
        ref.current.removeEventListener('pointerdown', handleDown);
        ref.current.removeEventListener('pointerup', handleUp);
        ref.current.removeEventListener('pointerleave', handleUp);
      }
      tweenRef.current?.kill();
      ref.current = node;
      if (!node || reducedMotion) return;

      function handleDown() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale, duration, ease: 'power2.in' });
      }
      function handleUp() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale: 1, duration: 0.2, ease: 'back.out(1.7)' });
      }

      node.addEventListener('pointerdown', handleDown);
      node.addEventListener('pointerup', handleUp);
      node.addEventListener('pointerleave', handleUp);
    },
    [reducedMotion, scale, duration],
  );

  return callbackRef;
}

// ── Hover + Tap Combined ───────────────────────────────────
export function useInteractive<T extends HTMLElement>(
  hoverScale: number = 1.05,
  tapScale: number = 0.95,
): RefCallback<T> {
  const reducedMotion = useReducedMotion();
  const ref = useRef<T | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const callbackRef: RefCallback<T> = useCallback(
    (node: T | null) => {
      if (ref.current) {
        const el = ref.current;
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointerleave', onUp);
      }
      tweenRef.current?.kill();
      ref.current = node;
      if (!node || reducedMotion) return;

      function onEnter() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale: hoverScale, duration: 0.25, ease: 'power2.out' });
      }
      function onLeave() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale: 1, duration: 0.25, ease: 'power2.out' });
      }
      function onDown() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale: tapScale, duration: 0.1, ease: 'power2.in' });
      }
      function onUp() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { scale: hoverScale, duration: 0.2, ease: 'back.out(1.7)' });
      }

      node.addEventListener('mouseenter', onEnter);
      node.addEventListener('mouseleave', onLeave);
      node.addEventListener('pointerdown', onDown);
      node.addEventListener('pointerup', onUp);
      node.addEventListener('pointerleave', onUp);
    },
    [reducedMotion, hoverScale, tapScale],
  );

  return callbackRef;
}

// ── Stagger Children ───────────────────────────────────────
export function useStagger<T extends HTMLElement>(
  stagger: number = 0.045,
  duration: number = 0.4,
  ease: string = 'power2.out',
): RefCallback<T> {
  const reducedMotion = useReducedMotion();
  const ref = useRef<T | null>(null);

  const callbackRef: RefCallback<T> = useCallback(
    (node: T | null) => {
      ref.current = node;
      if (!node || reducedMotion) return;

      const children = Array.from(node.children) as HTMLElement[];
      gsap.set(children, { opacity: 0, y: 18 });
      gsap.to(children, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger,
      });
    },
    [reducedMotion, stagger, duration, ease],
  );

  return callbackRef;
}

// ── Presence (enter/exit) ──────────────────────────────────
interface PresenceConfig {
  enter?: gsap.TweenVars & { duration?: number; ease?: string };
  exit?: gsap.TweenVars & { duration?: number; ease?: string };
}

export function usePresence<T extends HTMLElement>(
  visible: boolean,
  config: PresenceConfig,
): RefCallback<T> {
  const reducedMotion = useReducedMotion();
  const ref = useRef<T | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!ref.current || reducedMotion) return;

    if (visible) {
      const { duration = 0.4, ease = 'power2.out', ...fromVars } = config.enter || {};
      gsap.set(ref.current, fromVars);
      tweenRef.current = gsap.to(ref.current, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration,
        ease,
      });
    } else {
      const { duration = 0.2, ease = 'power2.in', ...toVars } = config.exit || {};
      tweenRef.current = gsap.to(ref.current, {
        opacity: 0,
        ...toVars,
        duration,
        ease,
      });
    }

    return () => {
      tweenRef.current?.kill();
    };
  }, [visible, reducedMotion, config]);

  return useCallback((node: T | null) => {
    ref.current = node;
  }, []);
}

// ── Motion Value (reactive number) ─────────────────────────
export function useMotionValue(initial: number) {
  const valueRef = useRef(initial);
  const listenersRef = useRef<Set<(v: number) => void>>(new Set());

  const set = useCallback((v: number) => {
    valueRef.current = v;
    listenersRef.current.forEach((fn) => fn(v));
  }, []);

  const get = useCallback(() => valueRef.current, []);

  const subscribe = useCallback((fn: (v: number) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return { get, set, subscribe };
}

// ── Spring Value (animated number) ─────────────────────────
export function useSpringValue(
  initial: number,
  config: { stiffness?: number; damping?: number } = {},
) {
  const { stiffness = 300, damping = 30 } = config;
  const valueRef = useRef(initial);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const listenersRef = useRef<Set<(v: number) => void>>(new Set());

  const set = useCallback(
    (target: number) => {
      const duration = Math.max(0.2, damping / stiffness);
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(valueRef, {
        current: target,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          listenersRef.current.forEach((fn) => fn(valueRef.current));
        },
      });
    },
    [stiffness, damping],
  );

  const get = useCallback(() => valueRef.current, []);

  const subscribe = useCallback((fn: (v: number) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  return { get, set, subscribe };
}

// ── Timeline Helper ────────────────────────────────────────
export function useTimeline(
  deps: readonly unknown[] = [],
): gsap.core.Timeline {
  const tlRef = useRef<gsap.core.Timeline>(gsap.timeline({ paused: true }));

  useEffect(() => {
    return () => {
      tlRef.current.kill();
    };
  }, deps);

  return tlRef.current;
}

// ── Quick Setter (high-performance) ────────────────────────
export function useQuickSetter<T extends HTMLElement>(
  property: string,
  unit: string = '',
) {
  const ref = useRef<T | null>(null);
  const setterRef = useRef<((v: number) => void) | null>(null);

  const callbackRef: RefCallback<T> = useCallback((node: T | null) => {
    ref.current = node;
    if (node) {
      setterRef.current = gsap.quickSetter(node as any, property, unit) as unknown as (v: number) => void;
    }
  }, [property, unit]);

  const set = useCallback((value: number) => {
    setterRef.current?.(value);
  }, []);

  return { ref: callbackRef, set };
}
