import { lazy, memo, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { easeOutExpo, useReducedMotion } from '../../lib/animations';
import { backgroundProfiles, type BackgroundProfile } from '../../lib/backgroundProfiles';
import { BACKGROUND_INTENT_EVENT, type BackgroundIntent } from '../../lib/backgroundIntent';
import { useVisualCapability } from '../../lib/visualCapability';
import BackgroundScene from './BackgroundScene';

type DynamicSpringBackgroundProps = {
  profile: BackgroundProfile;
};

const GlassGardenCanvas = lazy(() => import('./glassGarden/GlassGardenCanvas'));

type HaloPosition = {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  size: number;
  color: string;
  duration: number;
};

function getCompactAnimation() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 720px)').matches ||
    (navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false)
  );
}

function useCompactAnimation() {
  const [compact, setCompact] = useState(getCompactAnimation);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)');
    const narrow = window.matchMedia('(max-width: 720px)');
    const update = () => setCompact(getCompactAnimation());

    coarse.addEventListener('change', update);
    narrow.addEventListener('change', update);
    return () => {
      coarse.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  return compact;
}

function DynamicSpringBackground({ profile }: DynamicSpringBackgroundProps) {
  const { resolved } = useTheme();
  const reducedMotion = useReducedMotion();
  const compact = useCompactAnimation();
  const capability = useVisualCapability();
  const [intent, setIntent] = useState<BackgroundIntent>('none');
  const activeProfile =
    intent === 'empty'
      ? backgroundProfiles['empty-quiet']
      : intent === 'search'
        ? backgroundProfiles['search-focus']
        : profile;
  const palette = resolved === 'dark' ? activeProfile.dark : activeProfile.light;
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const springX = useSpring(parallaxX, { stiffness: 55, damping: 24, mass: 0.7 });
  const springY = useSpring(parallaxY, { stiffness: 55, damping: 24, mass: 0.7 });
  const showDesktopGlassGarden = capability.mode === 'desktop-3d' && !reducedMotion && !compact;

  const haloPositions = useMemo<HaloPosition[]>(
    () => [
      { left: '9%', top: '8%', size: compact ? 260 : 420, color: palette.halo[0], duration: 20 },
      { right: '7%', top: '12%', size: compact ? 210 : 360, color: palette.halo[1], duration: 24 },
      {
        left: '42%',
        bottom: '-6%',
        size: compact ? 250 : 460,
        color: palette.halo[2],
        duration: 28,
      },
    ],
    [compact, palette.halo],
  );

  useEffect(() => {
    const handleIntent = (event: Event) => {
      setIntent((event as CustomEvent<BackgroundIntent>).detail ?? 'none');
    };

    window.addEventListener(BACKGROUND_INTENT_EVENT, handleIntent);
    return () => window.removeEventListener(BACKGROUND_INTENT_EVENT, handleIntent);
  }, []);

  useEffect(() => {
    parallaxX.set(0);
    parallaxY.set(0);

    if (reducedMotion || compact) return;

    let frame = 0;
    const strength =
      activeProfile.family === 'games' || activeProfile.intensity === 'lively' ? 14 : 9;

    const handlePointerMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const x = (event.clientX / window.innerWidth - 0.5) * strength;
        const y = (event.clientY / window.innerHeight - 0.5) * strength;
        parallaxX.set(x);
        parallaxY.set(y);
      });
    };

    const handlePointerLeave = () => {
      parallaxX.set(0);
      parallaxY.set(0);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [activeProfile.family, activeProfile.intensity, compact, parallaxX, parallaxY, reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: palette.base }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeProfile.key}-${resolved}`}
          className="absolute inset-0"
          style={{
            background: `${palette.wash}, ${palette.base}`,
            willChange: reducedMotion ? 'auto' : 'opacity, transform',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.7, ease: easeOutExpo }}
        />
      </AnimatePresence>

      <motion.div
        className="absolute inset-0"
        style={{
          x: reducedMotion ? 0 : springX,
          y: reducedMotion ? 0 : springY,
          willChange: reducedMotion ? 'auto' : 'transform',
        }}
      >
        {haloPositions.map((halo, index) => (
          <motion.span
            key={`${activeProfile.key}-halo-${index}`}
            className="absolute rounded-full blur-3xl"
            style={{
              width: halo.size,
              height: halo.size,
              left: halo.left,
              right: halo.right,
              top: halo.top,
              bottom: halo.bottom,
              background: `radial-gradient(circle, ${halo.color}, transparent 68%)`,
              willChange: reducedMotion || compact ? 'auto' : 'transform, opacity',
            }}
            animate={
              reducedMotion || compact
                ? { opacity: compact ? 0.34 : 0.42, scale: 1 }
                : {
                    x: [0, index % 2 ? -16 : 16, 0],
                    y: [0, index === 2 ? -18 : 14, 0],
                    scale: [0.98, 1.04, 0.98],
                    opacity: [0.24, 0.42, 0.24],
                  }
            }
            transition={
              reducedMotion || compact
                ? { duration: 0.01 }
                : { duration: halo.duration, repeat: Infinity, ease: easeOutExpo }
            }
          />
        ))}

        {!reducedMotion && (
          <BackgroundScene profile={activeProfile} palette={palette} compact={compact} />
        )}
      </motion.div>

      {showDesktopGlassGarden && (
        <Suspense fallback={null}>
          <GlassGardenCanvas backgroundProfile={activeProfile} dark={resolved === 'dark'} />
        </Suspense>
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            resolved === 'dark'
              ? 'radial-gradient(circle at 50% 24%, transparent, oklch(8% 0.012 150 / 0.34) 72%)'
              : 'radial-gradient(circle at 50% 22%, transparent, oklch(96% 0.014 85 / 0.28) 76%)',
        }}
      />
    </div>
  );
}

export default memo(DynamicSpringBackground);
