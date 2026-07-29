import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../lib/animations';
import { backgroundProfiles, type BackgroundProfile } from '../../lib/backgroundProfiles';
import { BACKGROUND_INTENT_EVENT, type BackgroundIntent } from '../../lib/backgroundIntent';
import { useVisualCapability } from '../../lib/visualCapability';
import { useForestRuntimeOptional, useForestRuntimeSelectorOptional } from '../../lib/forest/ForestRuntime';
import {
  particleCap,
  tierAllowsParticles,
  tierAllowsVideo,
} from '../../lib/forest/forestTier';
import BackgroundScene from './BackgroundScene';
import ForestVideoBackground from './ForestVideoBackground';
import ForestCompositeMask from './ForestCompositeMask';
import ForestFoliage from './ForestFoliage';
import ForestDustField from './ForestDustField';

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
  const forest = useForestRuntimeOptional();
  const tier = forest?.tier ?? (capability.mode === 'desktop-3d' ? 'high' : 'low');
  const splashActive = useForestRuntimeSelectorOptional((s) => s.flags.splashActive, false);
  const scrollY = useForestRuntimeSelectorOptional((s) => s.scroll.y, 0);
  const brightness = useForestRuntimeSelectorOptional((s) => s.brightnessBoost, 0);
  const [intent, setIntent] = useState<BackgroundIntent>('none');
  const [scrollProgress, setScrollProgress] = useState(0);
  const offsetsRef = useRef({ x: 0, y: 0 });

  const activeProfile =
    intent === 'empty'
      ? backgroundProfiles['empty-quiet']
      : intent === 'search'
        ? backgroundProfiles['search-focus']
        : profile;
  const palette = resolved === 'dark' ? activeProfile.dark : activeProfile.light;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoEnabled =
    tierAllowsVideo(tier) && !reducedMotion && !compact && !splashActive;
  // GlassGarden only when video off (low / fallback)
  const showDesktopGlassGarden =
    !videoEnabled &&
    capability.mode === 'desktop-3d' &&
    !reducedMotion &&
    !compact;
  const showParticles = tierAllowsParticles(tier) && !reducedMotion;

  const haloPositions = useMemo<HaloPosition[]>(
    () => [
      { left: '9%', top: '8%', size: compact ? 260 : 420, color: palette.halo[0] },
      { right: '7%', top: '12%', size: compact ? 210 : 360, color: palette.halo[1] },
      { left: '42%', bottom: '-6%', size: compact ? 250 : 460, color: palette.halo[2] },
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
    if (reducedMotion || compact) return;
    const strength =
      activeProfile.family === 'games' || activeProfile.intensity === 'lively' ? 14 : 9;
    let raf = 0;
    let pending: { x: number; y: number } | null = null;

    const flush = () => {
      raf = 0;
      if (!pending || !containerRef.current) return;
      offsetsRef.current = pending;
      gsap.to(containerRef.current, {
        x: pending.x,
        y: pending.y,
        duration: 0.8,
        ease: 'power2.out',
      });
      pending = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      pending = {
        x: (event.clientX / window.innerWidth - 0.5) * strength,
        y: (event.clientY / window.innerHeight - 0.5) * strength,
      };
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const handlePointerLeave = () => {
      pending = { x: 0, y: 0 };
      offsetsRef.current = { x: 0, y: 0 };
      if (containerRef.current) {
        gsap.to(containerRef.current, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [activeProfile.family, activeProfile.intensity, compact, reducedMotion]);

  useEffect(() => {
    const max = 2400;
    setScrollProgress(Math.min(1, scrollY / max));
  }, [scrollY]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: palette.base }}
    >
      {/* L1 video / gradient base */}
      <div
        key={`${activeProfile.key}-${resolved}`}
        className="absolute inset-0"
        style={{
          background: `${palette.wash}, ${palette.base}`,
          opacity: videoEnabled ? 0.35 : 1,
        }}
      />

      <ForestVideoBackground
        enabled={videoEnabled}
        offsetX={offsetsRef.current.x * 0.02}
        offsetY={offsetsRef.current.y * 0.02 + scrollY * -0.01}
      />

      <div
        className="absolute inset-0"
        ref={containerRef}
        style={{ willChange: reducedMotion ? 'auto' : 'transform' }}
      >
        {!videoEnabled &&
          haloPositions.map((halo, index) => (
            <span
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
              }}
            />
          ))}

        {!reducedMotion && !videoEnabled && (
          <BackgroundScene profile={activeProfile} palette={palette} compact={compact} />
        )}

        {/* L2 / L3 dust */}
        {showParticles && (
          <ForestDustField
            count={particleCap(tier)}
            pointerX={forest?.pointer.x}
            pointerY={forest?.pointer.y}
            pointerSpeed={forest?.pointer.speed}
            scrollVy={forest?.scroll.vy}
            windX={forest?.wind.x}
            windY={forest?.wind.y}
            paused={Boolean(forest?.flags.splashActive)}
          />
        )}
      </div>

      {showDesktopGlassGarden && (
        <Suspense fallback={null}>
          <GlassGardenCanvas backgroundProfile={activeProfile} dark={resolved === 'dark'} />
        </Suspense>
      )}

      {/* L4 mask */}
      <ForestCompositeMask scrollProgress={scrollProgress} />

      {/* L5 foliage */}
      {!reducedMotion && tier !== 'low' && (
        <ForestFoliage
          windStrength={forest?.wind.strength ?? 0.1}
          offsetX={offsetsRef.current.x * 0.2}
          offsetY={offsetsRef.current.y * 0.2 + scrollY * -0.04}
          blur={3}
        />
      )}

      {/* spacebar sun break */}
      <div
        className="forest-brightness-veil"
        style={{ opacity: brightness * 0.55, position: 'absolute', zIndex: 6 }}
      />
    </div>
  );
}

export default memo(DynamicSpringBackground);
