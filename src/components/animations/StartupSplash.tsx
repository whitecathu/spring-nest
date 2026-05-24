import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { easeOutExpo, useReducedMotion } from '../../lib/animations';
import { useVisualCapability } from '../../lib/visualCapability';
import LightweightEmergenceSplash from './glassGarden/LightweightEmergenceSplash';
import Aurora from './Aurora';

const TerrariumEmergenceSplash = lazy(() => import('./glassGarden/TerrariumEmergenceSplash'));

const SPLASH_SESSION_KEY = 'spring_nest_startup_splash_seen';

function getShouldShowSplash() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SPLASH_SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

function markSplashSeen() {
  try {
    sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
  } catch {}
}

function getCompactSplash() {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 720px)').matches
  );
}

function useCompactSplash() {
  const [compact, setCompact] = useState(getCompactSplash);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const coarse = window.matchMedia('(pointer: coarse)');
    const narrow = window.matchMedia('(max-width: 720px)');
    const update = () => setCompact(getCompactSplash());

    coarse.addEventListener('change', update);
    narrow.addEventListener('change', update);
    return () => {
      coarse.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  return compact;
}

export default function StartupSplash() {
  const reducedMotion = useReducedMotion();
  const compact = useCompactSplash();
  const capability = useVisualCapability();
  const { resolved } = useTheme();
  const dark = resolved === 'dark';
  const [visible, setVisible] = useState(getShouldShowSplash);
  const useDesktop3d = capability.mode === 'desktop-3d';

  const complete = useCallback(() => {
    markSplashSeen();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const exitDelay = reducedMotion ? 80 : useDesktop3d ? 1700 : compact ? 1250 : 1400;
    const timeout = window.setTimeout(complete, exitDelay);
    return () => window.clearTimeout(timeout);
  }, [compact, complete, reducedMotion, useDesktop3d, visible]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') complete();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [complete, visible]);

  const baseBackground = dark
    ? 'linear-gradient(135deg, oklch(13% 0.018 152), oklch(10% 0.014 205) 58%, oklch(14% 0.018 78))'
    : 'linear-gradient(135deg, oklch(99% 0.012 85), oklch(97% 0.026 140) 58%, oklch(98% 0.018 55))';
  const auroraColors = dark
    ? ['#1a3a1a', '#3d7a4d', '#8fbc8f']
    : ['#3d7a4d', '#8fbc8f', '#f5f0e0'];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[60] grid cursor-default place-items-center overflow-hidden"
          role="status"
          aria-live="polite"
          aria-label="Spring Nest loading"
          onPointerDown={complete}
          style={{ background: baseBackground }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: reducedMotion ? 0 : -8,
            scale: reducedMotion ? 1 : 1.01,
          }}
          transition={{ duration: reducedMotion ? 0.1 : 0.22, ease: easeOutExpo }}
        >
          <Aurora
            colorStops={auroraColors}
            amplitude={useDesktop3d ? 1.2 : 0.6}
            blend={0.5}
            speed={useDesktop3d ? 1.0 : 0.4}
            className="absolute inset-0 opacity-60 dark:opacity-40"
          />
          <button
            type="button"
            className="absolute right-4 top-4 z-[1] rounded-full border border-primary/15 bg-white/55 px-4 py-2 text-sm font-bold text-primary shadow-sm backdrop-blur-md transition-colors hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/15"
            onClick={complete}
          >
            跳过
          </button>
          <motion.div
            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: reducedMotion ? 0 : 0.52, scale: 1 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            aria-hidden="true"
          />

          <Suspense
            fallback={
              <LightweightEmergenceSplash
                compact={compact}
                dark={dark}
                reducedMotion={reducedMotion}
              />
            }
          >
            {useDesktop3d ? (
              <TerrariumEmergenceSplash dark={dark} reducedMotion={reducedMotion} />
            ) : (
              <LightweightEmergenceSplash
                compact={compact}
                dark={dark}
                reducedMotion={reducedMotion}
              />
            )}
          </Suspense>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
