import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { isDecorativeHit } from '../../lib/forest/hitTest';
import { hapticGrow, hapticTap } from '../../lib/forest/haptics';
import { FOREST_PALETTE } from '../../lib/forest/forestPalette';

export type ForestAmbientEggsProps = {
  enabled: boolean;
  idleMs?: number;
  onStrongWind?: () => void;
  onGust?: (dirX: number, dirY: number) => void;
  onResetScroll?: () => void;
  onBrightness?: (boost: number) => void;
  className?: string;
};

type Spot = { id: number; x: number; y: number };
type IdleKind = 'leaf' | 'firefly' | 'squirrel';

function ForestAmbientEggs({
  enabled,
  idleMs = 0,
  onStrongWind,
  onGust,
  onResetScroll,
  onBrightness,
  className = '',
}: ForestAmbientEggsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [ripples, setRipples] = useState<Spot[]>([]);
  const [moss, setMoss] = useState<[number, number]>([0, 0]);
  const holdTimers = useRef<[number | null, number | null]>([null, null]);
  const hoverTimers = useRef<[number | null, number | null]>([null, null]);
  const idleEventRef = useRef<IdleKind | null>(null);
  const [idleEvent, setIdleEvent] = useState<IdleKind | null>(null);
  const nextIdleAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const clearHold = (i: 0 | 1) => {
      if (holdTimers.current[i]) {
        window.clearTimeout(holdTimers.current[i]!);
        holdTimers.current[i] = null;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!isDecorativeHit(e.clientX, e.clientY)) return;
      e.preventDefault();
      onStrongWind?.();
      hapticGrow();
    };

    const onAuxClick = (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      onResetScroll?.();
    };

    const onDblClick = (e: MouseEvent) => {
      if (!isDecorativeHit(e.clientX, e.clientY)) return;
      const angle = Math.random() * Math.PI * 2;
      onGust?.(Math.cos(angle), Math.sin(angle));
      hapticTap();
    };

    const onClick = (e: MouseEvent) => {
      if (!isDecorativeHit(e.clientX, e.clientY)) return;
      const id = Date.now() + Math.random();
      const spot = { id, x: e.clientX, y: e.clientY };
      setSpots((prev) => [...prev.slice(-4), spot]);
      window.setTimeout(() => {
        setSpots((prev) => prev.filter((s) => s.id !== id));
      }, 2000);

      // footer stream band ripples
      if (e.clientY > window.innerHeight * 0.82) {
        setRipples((prev) => [...prev.slice(-2), spot]);
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((s) => s.id !== id));
        }, 1400);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Alt+Space — avoid hijacking normal Space (scroll / activate).
      if (e.code !== 'Space' || !e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      e.preventDefault();
      onBrightness?.(1);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      onBrightness?.(0);
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('auxclick', onAuxClick);
    window.addEventListener('dblclick', onDblClick);
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('auxclick', onAuxClick);
      window.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      clearHold(0);
      clearHold(1);
    };
  }, [enabled, onStrongWind, onGust, onResetScroll, onBrightness]);

  // Idle micro-events
  useEffect(() => {
    if (!enabled) return;
    if (idleMs < 5000) {
      if (idleEventRef.current) {
        idleEventRef.current = null;
        setIdleEvent(null);
      }
      nextIdleAt.current = 0;
      return;
    }

    const now = performance.now();
    if (!nextIdleAt.current) {
      nextIdleAt.current = now + (20000 + Math.random() * 20000);
    }
    if (now < nextIdleAt.current || idleEventRef.current) return;

    const kinds: IdleKind[] = ['leaf', 'firefly', 'squirrel'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)]!;
    idleEventRef.current = kind;
    setIdleEvent(kind);
    nextIdleAt.current = now + (20000 + Math.random() * 20000);

    const el = rootRef.current?.querySelector(`[data-idle="${kind}"]`);
    if (el) {
      gsap.fromTo(
        el,
        { opacity: 0, x: kind === 'leaf' ? -40 : kind === 'squirrel' ? -60 : 0 },
        {
          opacity: 1,
          x: kind === 'leaf' ? 80 : kind === 'squirrel' ? 120 : 40,
          y: kind === 'firefly' ? -20 : 0,
          duration: 2.8,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.to(el, {
              opacity: 0,
              duration: 0.4,
              onComplete: () => {
                idleEventRef.current = null;
                setIdleEvent(null);
              },
            });
          },
        },
      );
    } else {
      window.setTimeout(() => {
        idleEventRef.current = null;
        setIdleEvent(null);
      }, 3000);
    }
  }, [enabled, idleMs]);

  if (!enabled) return null;

  const stumpStyle = (index: 0 | 1): CSSProperties => ({
    left: index === 0 ? '18%' : '72%',
    bottom: '7%',
    width: 44,
    height: 18,
    borderRadius: '50% 50% 40% 40%',
    background: `radial-gradient(ellipse at 50% 40%, color-mix(in srgb, ${FOREST_PALETTE.moss} ${12 + moss[index] * 40}%, transparent), color-mix(in srgb, ${FOREST_PALETTE.bark} 55%, transparent))`,
    opacity: 0.12 + moss[index] * 0.4,
    cursor: 'pointer',
    mixBlendMode: 'multiply',
  });

  const onStumpEnter = (index: 0 | 1) => {
    hoverTimers.current[index] = window.setTimeout(() => {
      setMoss((m) => {
        const next = [...m] as [number, number];
        next[index] = Math.max(next[index], 0.45);
        return next;
      });
    }, 800);
  };

  const onStumpLeave = (index: 0 | 1) => {
    if (hoverTimers.current[index]) {
      window.clearTimeout(hoverTimers.current[index]!);
      hoverTimers.current[index] = null;
    }
    if (holdTimers.current[index]) {
      window.clearTimeout(holdTimers.current[index]!);
      holdTimers.current[index] = null;
    }
  };

  const onStumpDown = (index: 0 | 1) => {
    holdTimers.current[index] = window.setTimeout(() => {
      setMoss((m) => {
        const next = [...m] as [number, number];
        next[index] = 1;
        return next;
      });
      hapticGrow();
    }, 1500);
  };

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none absolute inset-0 z-[25] ${className}`}
      data-forest-decor="eggs"
      aria-hidden="true"
    >
      {([0, 1] as const).map((i) => (
        <button
          key={i}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          data-forest-decor="stump"
          className="pointer-events-auto absolute border-0 p-0"
          style={stumpStyle(i)}
          onMouseEnter={() => onStumpEnter(i)}
          onMouseLeave={() => onStumpLeave(i)}
          onPointerDown={() => onStumpDown(i)}
          onPointerUp={() => onStumpLeave(i)}
        />
      ))}

      {spots.map((s) => (
        <span
          key={s.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: s.x,
            top: s.y,
            width: 48,
            height: 48,
            marginLeft: -24,
            marginTop: -24,
            background: `radial-gradient(circle, color-mix(in srgb, ${FOREST_PALETTE.gold} 55%, transparent), transparent 70%)`,
            animation: 'forest-spot-fade 2s ease-out forwards',
          }}
        />
      ))}

      {ripples.map((s) => (
        <span
          key={`r-${s.id}`}
          className="pointer-events-none absolute rounded-full border"
          style={{
            left: s.x,
            top: s.y,
            width: 20,
            height: 12,
            marginLeft: -10,
            marginTop: -6,
            borderColor: `color-mix(in srgb, ${FOREST_PALETTE.water} 70%, white)`,
            animation: 'forest-ripple 1.4s ease-out forwards',
          }}
        />
      ))}

      <span
        data-idle="leaf"
        className="pointer-events-none absolute left-[8%] top-[22%] h-3 w-5 rounded-[40%] opacity-0"
        style={{
          background: FOREST_PALETTE.moss,
          display: idleEvent === 'leaf' ? 'block' : 'none',
        }}
      />
      <span
        data-idle="firefly"
        className="pointer-events-none absolute left-[12%] top-[48%] h-2 w-2 rounded-full opacity-0"
        style={{
          background: FOREST_PALETTE.gold,
          boxShadow: `0 0 10px ${FOREST_PALETTE.gold}`,
          display: idleEvent === 'firefly' ? 'block' : 'none',
        }}
      />
      <span
        data-idle="squirrel"
        className="pointer-events-none absolute bottom-[10%] left-[10%] h-3 w-8 rounded-full opacity-0"
        style={{
          background: FOREST_PALETTE.bark,
          display: idleEvent === 'squirrel' ? 'block' : 'none',
        }}
      />

      <style>{`
        @keyframes forest-spot-fade {
          0% { opacity: 0.85; transform: scale(0.4); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        @keyframes forest-ripple {
          0% { opacity: 0.7; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(3.2); }
        }
      `}</style>
    </div>
  );
}

export default memo(ForestAmbientEggs);
