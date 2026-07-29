import { memo, useEffect, useRef, useState } from 'react';
import { useForestRuntimeOptional } from '../../lib/forest/ForestRuntime';
import { FOREST_PALETTE } from '../../lib/forest/forestPalette';

export type ForestCursorProps = {
  enabled: boolean;
  /** Optional external pointer (client coords). */
  pointerX?: number;
  pointerY?: number;
  pointerDown?: boolean;
};

type CursorMode = 'idle' | 'hover' | 'press' | 'text';

function isTextTarget(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  return Boolean(el.closest('input, textarea, [contenteditable="true"]'));
}

function isHoverMaterial(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  return Boolean(
    el.closest(
      'a, button, [role="button"], [data-forest-material], .catalog-card-shell, [data-forest-ui] button',
    ),
  );
}

function ForestCursor({
  enabled,
  pointerX,
  pointerY,
  pointerDown: pointerDownProp,
}: ForestCursorProps) {
  const runtime = useForestRuntimeOptional();
  const rootRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const [mode, setMode] = useState<CursorMode>('idle');
  const modeRef = useRef<CursorMode>('idle');
  const localPointer = useRef({ x: 0, y: 0, down: false });
  const visual = useRef({ x: 0, y: 0 });
  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove('forest-cursor-active');
      return;
    }
    document.body.classList.add('forest-cursor-active');
    return () => document.body.classList.remove('forest-cursor-active');
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const useOwnListeners = pointerX === undefined || pointerY === undefined;

    const applyMode = (next: CursorMode) => {
      if (modeRef.current === next) return;
      modeRef.current = next;
      setMode(next);
    };

    const onMove = (e: PointerEvent) => {
      localPointer.current.x = e.clientX;
      localPointer.current.y = e.clientY;
      if (isTextTarget(e.target)) applyMode('text');
      else if (localPointer.current.down || pointerDownProp) applyMode('press');
      else if (isHoverMaterial(e.target)) applyMode('hover');
      else applyMode('idle');
    };

    const onDown = (e: PointerEvent) => {
      localPointer.current.down = true;
      if (!isTextTarget(e.target)) {
        applyMode('press');
        const ripple = rippleRef.current;
        if (ripple) {
          ripple.style.left = `${e.clientX}px`;
          ripple.style.top = `${e.clientY}px`;
          ripple.animate(
            [
              { transform: 'translate(-50%, -50%) scale(0.25)', opacity: 0.55 },
              { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
            ],
            { duration: 300, easing: 'ease-out' },
          );
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      localPointer.current.down = false;
      if (isTextTarget(e.target)) applyMode('text');
      else if (isHoverMaterial(e.target)) applyMode('hover');
      else applyMode('idle');
    };

    if (useOwnListeners) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
    }

    let raf = 0;
    const tick = () => {
      const rt = runtimeRef.current;
      const realX = pointerX ?? rt?.cursorVisual.x ?? localPointer.current.x;
      const realY = pointerY ?? rt?.cursorVisual.y ?? localPointer.current.y;

      if (rt && pointerX === undefined) {
        visual.current.x = rt.cursorVisual.x;
        visual.current.y = rt.cursorVisual.y;
      } else {
        visual.current.x += (realX - visual.current.x) * 0.28;
        visual.current.y += (realY - visual.current.y) * 0.28;
      }

      const el = rootRef.current;
      if (el) {
        el.style.transform = `translate3d(${visual.current.x}px, ${visual.current.y}px, 0)`;
        el.style.opacity = modeRef.current === 'text' ? '0' : '1';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (useOwnListeners) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
      }
    };
  }, [enabled, pointerX, pointerY, pointerDownProp]);

  if (!enabled) return null;

  const size = mode === 'hover' || mode === 'press' ? 4 : 6;
  const glow = mode === 'hover' ? 1.3 : 1;

  return (
    <>
      <div
        ref={rootRef}
        className="pointer-events-none fixed left-0 top-0 z-[80]"
        aria-hidden="true"
        data-forest-decor="cursor"
        style={{ willChange: 'transform, opacity' }}
      >
        <span
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            background: FOREST_PALETTE.gold,
            boxShadow: `0 0 ${12 * glow}px ${4 * glow}px color-mix(in srgb, ${FOREST_PALETTE.gold} 55%, transparent)`,
            transition: 'width 0.15s ease, height 0.15s ease, margin 0.15s ease',
          }}
        />
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2,
              height: 2,
              marginLeft: Math.cos((i / 3) * Math.PI * 2) * 10 - 1,
              marginTop: Math.sin((i / 3) * Math.PI * 2) * 10 - 1,
              background: `color-mix(in srgb, ${FOREST_PALETTE.gold} 70%, white)`,
              opacity: 0.55,
            }}
          />
        ))}
      </div>
      <span
        ref={rippleRef}
        className="pointer-events-none fixed z-[79] rounded-full border"
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderColor: `color-mix(in srgb, ${FOREST_PALETTE.gold} 55%, transparent)`,
          opacity: 0,
        }}
      />
    </>
  );
}

export default memo(ForestCursor);
