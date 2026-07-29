import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { createFpsTierController, useForestTier, type ForestTier } from './forestTier';
import { createWindField, type WindSample } from './windField';
import { detectTerrainFromScroller, type ForestTerrain } from './scrollTerrain';
import { getGameCategoryBySlug } from '../catalogRoutes';

export type ForestPointer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
};

export type ForestCursorVisual = {
  x: number;
  y: number;
};

export type ForestScroll = {
  y: number;
  vy: number;
  section: ForestTerrain;
};

export type ForestRuntimeFlags = {
  reducedMotion: boolean;
  isGameRoute: boolean;
  splashActive: boolean;
  finePointer: boolean;
};

export type ForestRuntimeSnapshot = {
  pointer: ForestPointer;
  cursorVisual: ForestCursorVisual;
  scroll: ForestScroll;
  wind: WindSample;
  idleMs: number;
  brightnessBoost: number;
  tier: ForestTier;
  /** Flat mirrors of common flags (also available under `flags`). */
  reducedMotion: boolean;
  isGameRoute: boolean;
  splashActive: boolean;
  flags: ForestRuntimeFlags;
};

export type ForestRuntimeApi = ForestRuntimeSnapshot & {
  /** Register the main scroll container (or `null` to fall back to window). */
  registerScroller: (el: HTMLElement | null) => void;
  setSplashActive: (active: boolean) => void;
  setBrightnessBoost: (n: number) => void;
  /** Reset idle clock (pointer / key activity). */
  nudgeIdle: () => void;
  pulseStrong: (durationMs?: number) => void;
  /** Alias used by ambient eggs / context menu gusts. */
  pulseStrongWind: (durationMs?: number) => void;
  pulseGust: (dirX: number, dirY: number) => void;
  /** Snap the registered scroller (or window) back to top. */
  resetScrollView: () => void;
  /** Hint the active terrain section for damping / parallax. */
  setScrollSection: (section: ForestTerrain) => void;
  /** Subscribe to frame updates (throttled ~10Hz for React). */
  subscribe: (listener: () => void) => () => void;
  /** Monotonic version bumped when subscribers should re-read the snapshot. */
  getFrameVersion: () => number;
  /** Live mutable snapshot — read inside rAF / subscribe callbacks only. */
  getSnapshot: () => ForestRuntimeSnapshot;
};

const POINTER_THROTTLE_MS = 16;
const REACT_NOTIFY_MS = 100;
const TERRAIN_DETECT_MS = 200;
/** Inertia follow rate — yields ~4–8px visual lag at typical pointer speeds. */
const CURSOR_FOLLOW = 14;
const CURSOR_LAG_MIN = 4;
const CURSOR_LAG_MAX = 8;

function isGamePlayPath(pathname: string): boolean {
  const match = pathname.match(/^\/games\/([^/]+)/);
  const slug = match?.[1];
  if (!slug) return false;
  // Category list pages (e.g. /games/puzzle) are not gameplay.
  if (getGameCategoryBySlug(slug)) return false;
  return true;
}

function readReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readFinePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: fine)').matches;
}

function createInitialSnapshot(): ForestRuntimeSnapshot {
  return {
    pointer: { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
    cursorVisual: { x: 0, y: 0 },
    scroll: { y: 0, vy: 0, section: 'hero' },
    wind: { x: 0, y: 0, strength: 0 },
    idleMs: 0,
    brightnessBoost: 0,
    tier: 'low',
    reducedMotion: true,
    isGameRoute: false,
    splashActive: false,
    flags: {
      reducedMotion: true,
      isGameRoute: false,
      splashActive: false,
      finePointer: false,
    },
  };
}

const ForestRuntimeContext = createContext<ForestRuntimeApi | null>(null);

export function ForestRuntimeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const capabilityTier = useForestTier();

  const [tier, setTier] = useState<ForestTier>(() =>
    typeof window === 'undefined' ? 'low' : capabilityTier,
  );
  const [splashActive, setSplashActiveState] = useState(false);
  const [brightnessBoost, setBrightnessBoostState] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  const [finePointer, setFinePointer] = useState(readFinePointer);
  const [isGameRoute, setIsGameRoute] = useState(() =>
    typeof window === 'undefined' ? false : isGamePlayPath(location.pathname),
  );

  // Mutable frame state — same object identity for the life of the provider.
  const snapshotRef = useRef<ForestRuntimeSnapshot>(createInitialSnapshot());
  const scrollerRef = useRef<HTMLElement | null>(null);
  const windRef = useRef(createWindField());
  const fpsRef = useRef<ReturnType<typeof createFpsTierController> | null>(null);

  const lastPointerSampleRef = useRef(0);
  const lastPointerPosRef = useRef({ x: 0, y: 0, t: 0 });
  const lastActivityRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const lastScrollRef = useRef({ y: 0, t: 0 });
  const lastFrameRef = useRef(0);
  const lastTerrainDetectRef = useRef(0);
  const lastNotifyRef = useRef(0);
  const hiddenRef = useRef(false);
  const listenersRef = useRef(new Set<() => void>());
  const frameVersionRef = useRef(0);

  const notifySubscribers = (now: number, force = false) => {
    if (!force && now - lastNotifyRef.current < REACT_NOTIFY_MS) return;
    lastNotifyRef.current = now;
    frameVersionRef.current += 1;
    listenersRef.current.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore subscriber errors
      }
    });
  };

  const syncFlags = (
    next: Partial<Pick<ForestRuntimeSnapshot, 'tier' | 'brightnessBoost'>> & {
      reducedMotion?: boolean;
      isGameRoute?: boolean;
      splashActive?: boolean;
      finePointer?: boolean;
    },
  ) => {
    const snap = snapshotRef.current;
    if (next.tier !== undefined) snap.tier = next.tier;
    if (next.brightnessBoost !== undefined) snap.brightnessBoost = next.brightnessBoost;
    if (next.reducedMotion !== undefined) {
      snap.reducedMotion = next.reducedMotion;
      snap.flags.reducedMotion = next.reducedMotion;
    }
    if (next.isGameRoute !== undefined) {
      snap.isGameRoute = next.isGameRoute;
      snap.flags.isGameRoute = next.isGameRoute;
    }
    if (next.splashActive !== undefined) {
      snap.splashActive = next.splashActive;
      snap.flags.splashActive = next.splashActive;
    }
    if (next.finePointer !== undefined) {
      snap.flags.finePointer = next.finePointer;
    }
  };

  syncFlags({
    tier,
    brightnessBoost,
    reducedMotion,
    isGameRoute,
    splashActive,
    finePointer,
  });

  const onTierChange = useEffectEvent((next: ForestTier) => {
    setTier(next);
  });

  useEffect(() => {
    setIsGameRoute(isGamePlayPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fineMq = window.matchMedia('(pointer: fine)');
    const onReduced = () => setReducedMotion(reducedMq.matches);
    const onFine = () => setFinePointer(fineMq.matches);
    onReduced();
    onFine();
    reducedMq.addEventListener('change', onReduced);
    fineMq.addEventListener('change', onFine);
    return () => {
      reducedMq.removeEventListener('change', onReduced);
      fineMq.removeEventListener('change', onFine);
    };
  }, []);

  // FPS controller — respects capability ceiling from useForestTier.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const controller = createFpsTierController(onTierChange);
    fpsRef.current = controller;
    controller.start(capabilityTier, capabilityTier);
    setTier(controller.getTier());

    return () => {
      controller.stop();
      fpsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once; ceiling updates below
  }, []);

  useEffect(() => {
    fpsRef.current?.setCeiling(capabilityTier);
    if (fpsRef.current) {
      setTier(fpsRef.current.getTier());
    }
  }, [capabilityTier]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const snap = snapshotRef.current;

    const onPointerMove = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastPointerSampleRef.current < POINTER_THROTTLE_MS) return;
      lastPointerSampleRef.current = now;
      lastActivityRef.current = now;

      const prev = lastPointerPosRef.current;
      const dtSec = prev.t > 0 ? Math.max((now - prev.t) / 1000, 0.001) : 0.016;
      const vx = (event.clientX - prev.x) / dtSec;
      const vy = (event.clientY - prev.y) / dtSec;
      const speed = Math.hypot(vx, vy);

      snap.pointer.x = event.clientX;
      snap.pointer.y = event.clientY;
      snap.pointer.vx = vx;
      snap.pointer.vy = vy;
      snap.pointer.speed = speed;

      lastPointerPosRef.current = { x: event.clientX, y: event.clientY, t: now };
    };

    const onActivity = () => {
      lastActivityRef.current = performance.now();
    };

    const onVisibility = () => {
      hiddenRef.current = document.hidden;
      if (!document.hidden) {
        lastFrameRef.current = 0;
        lastActivityRef.current = performance.now();
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('wheel', onActivity, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    let rafId = 0;

    const tick = (now: number) => {
      const prev = lastFrameRef.current || now;
      const dt = Math.min(Math.max((now - prev) / 1000, 0), 0.1);
      lastFrameRef.current = now;

      snap.idleMs = Math.max(0, now - lastActivityRef.current);

      if (!hiddenRef.current) {
        const el = scrollerRef.current;
        const scrollY = el ? el.scrollTop : window.scrollY || window.pageYOffset || 0;
        const lastScroll = lastScrollRef.current;
        const scrollDt =
          lastScroll.t > 0 ? Math.max((now - lastScroll.t) / 1000, 0.001) : dt || 0.016;
        const scrollVy = (scrollY - lastScroll.y) / scrollDt;
        snap.scroll.y = scrollY;
        snap.scroll.vy = Number.isFinite(scrollVy) ? scrollVy : 0;
        if (el && now - lastTerrainDetectRef.current >= TERRAIN_DETECT_MS) {
          lastTerrainDetectRef.current = now;
          snap.scroll.section = detectTerrainFromScroller(el);
        }
        lastScrollRef.current = { y: scrollY, t: now };

        // Cursor visual with inertia lag (~4–8px trail).
        const follow = 1 - Math.exp(-dt * CURSOR_FOLLOW);
        let cx = snap.cursorVisual.x + (snap.pointer.x - snap.cursorVisual.x) * follow;
        let cy = snap.cursorVisual.y + (snap.pointer.y - snap.cursorVisual.y) * follow;
        const dx = snap.pointer.x - cx;
        const dy = snap.pointer.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > CURSOR_LAG_MAX && dist > 0) {
          const scale = CURSOR_LAG_MAX / dist;
          cx = snap.pointer.x - dx * scale;
          cy = snap.pointer.y - dy * scale;
        } else if (dist > 0 && dist < CURSOR_LAG_MIN && snap.pointer.speed > 40) {
          const scale = CURSOR_LAG_MIN / dist;
          cx = snap.pointer.x - dx * scale;
          cy = snap.pointer.y - dy * scale;
        }
        snap.cursorVisual.x = cx;
        snap.cursorVisual.y = cy;

        const wind = windRef.current.update(dt || 0.016, snap.scroll.vy);
        snap.wind.x = wind.x;
        snap.wind.y = wind.y;
        snap.wind.strength = wind.strength;
      }

      notifySubscribers(now);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('wheel', onActivity);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const apiRef = useRef<ForestRuntimeApi | null>(null);
  if (!apiRef.current) {
    const snap = snapshotRef.current;
    apiRef.current = {
      get pointer() {
        return snap.pointer;
      },
      get cursorVisual() {
        return snap.cursorVisual;
      },
      get scroll() {
        return snap.scroll;
      },
      get wind() {
        return snap.wind;
      },
      get idleMs() {
        return snap.idleMs;
      },
      get brightnessBoost() {
        return snap.brightnessBoost;
      },
      get tier() {
        return snap.tier;
      },
      get reducedMotion() {
        return snap.reducedMotion;
      },
      get isGameRoute() {
        return snap.isGameRoute;
      },
      get splashActive() {
        return snap.splashActive;
      },
      get flags() {
        return snap.flags;
      },
      registerScroller(el) {
        scrollerRef.current = el;
        if (typeof performance === 'undefined') return;
        if (el) {
          lastScrollRef.current = { y: el.scrollTop, t: performance.now() };
        } else if (typeof window !== 'undefined') {
          lastScrollRef.current = {
            y: window.scrollY || window.pageYOffset || 0,
            t: performance.now(),
          };
        }
      },
      setSplashActive(active) {
        setSplashActiveState(active);
      },
      setBrightnessBoost(n) {
        setBrightnessBoostState(n);
      },
      nudgeIdle() {
        if (typeof performance !== 'undefined') {
          lastActivityRef.current = performance.now();
        }
        snapshotRef.current.idleMs = 0;
      },
      pulseStrong(durationMs) {
        windRef.current.pulseStrong(durationMs);
      },
      pulseStrongWind(durationMs) {
        windRef.current.pulseStrong(durationMs);
      },
      pulseGust(dirX, dirY) {
        windRef.current.pulseGust(dirX, dirY);
      },
      resetScrollView() {
        const el = scrollerRef.current;
        if (el) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
          lastScrollRef.current = {
            y: 0,
            t: typeof performance !== 'undefined' ? performance.now() : 0,
          };
          return;
        }
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          lastScrollRef.current = {
            y: 0,
            t: typeof performance !== 'undefined' ? performance.now() : 0,
          };
        }
      },
      setScrollSection(section) {
        snapshotRef.current.scroll.section = section;
        if (typeof performance !== 'undefined') {
          notifySubscribers(performance.now(), true);
        }
      },
      subscribe(listener) {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
      getFrameVersion() {
        return frameVersionRef.current;
      },
      getSnapshot() {
        return snapshotRef.current;
      },
    };
  }

  // Prefer the getter-based API so consumers always read live snapshot fields.
  const value = apiRef.current;

  return (
    <ForestRuntimeContext.Provider value={value}>{children}</ForestRuntimeContext.Provider>
  );
}

export function useForestRuntime(): ForestRuntimeApi {
  const ctx = useContext(ForestRuntimeContext);
  if (!ctx) {
    throw new Error('useForestRuntime must be used within ForestRuntimeProvider');
  }
  return ctx;
}

/** Safe variant for overlays that may mount outside the provider during bootstrap. */
export function useForestRuntimeOptional(): ForestRuntimeApi | null {
  return useContext(ForestRuntimeContext);
}

/**
 * Subscribe to a derived slice of the mutable forest snapshot.
 * Re-renders ~10Hz while the runtime loop is active.
 */
export function useForestRuntimeSelector<T>(
  selector: (snapshot: ForestRuntimeSnapshot) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const runtime = useForestRuntime();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const equalRef = useRef(isEqual);
  equalRef.current = isEqual;
  const cachedRef = useRef<T>(selector(runtime.getSnapshot()));

  const subscribe = useCallback(
    (onStoreChange: () => void) => runtime.subscribe(onStoreChange),
    [runtime],
  );

  const getSnapshot = useCallback(() => {
    const next = selectorRef.current(runtime.getSnapshot());
    if (!equalRef.current(cachedRef.current, next)) {
      cachedRef.current = next;
    }
    return cachedRef.current;
  }, [runtime]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useForestRuntimeSelectorOptional<T>(
  selector: (snapshot: ForestRuntimeSnapshot) => T,
  fallback: T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const runtime = useForestRuntimeOptional();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const equalRef = useRef(isEqual);
  equalRef.current = isEqual;
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const cachedRef = useRef<T>(runtime ? selector(runtime.getSnapshot()) : fallback);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!runtime) return () => undefined;
      return runtime.subscribe(onStoreChange);
    },
    [runtime],
  );

  const getSnapshot = useCallback(() => {
    if (!runtime) return fallbackRef.current;
    const next = selectorRef.current(runtime.getSnapshot());
    if (!equalRef.current(cachedRef.current, next)) {
      cachedRef.current = next;
    }
    return cachedRef.current;
  }, [runtime]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
