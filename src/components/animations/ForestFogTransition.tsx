import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import gsap from 'gsap';

export type ForestFogHandle = {
  gather: () => Promise<void>;
  disperse: () => Promise<void>;
  setPeak: () => void;
};

export type ForestFogTransitionProps = {
  className?: string;
  /** Starting opacity (0 = invisible). */
  initialOpacity?: number;
};

const ForestFogTransition = forwardRef<ForestFogHandle, ForestFogTransitionProps>(
  function ForestFogTransition({ className = '', initialOpacity = 0 }, ref) {
    const rootRef = useRef<HTMLDivElement>(null);
    const running = useRef<gsap.core.Tween | null>(null);

    const killRunning = useCallback(() => {
      running.current?.kill();
      running.current = null;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        gather: () => {
          const el = rootRef.current;
          if (!el) return Promise.resolve();
          killRunning();
          el.style.pointerEvents = 'auto';
          return new Promise<void>((resolve) => {
            gsap.set(el, {
              opacity: 0.15,
              '--fog-inset': '42%',
              '--fog-core': '0.15',
            } as gsap.TweenVars);
            running.current = gsap.to(el, {
              opacity: 1,
              duration: 0.6,
              ease: 'power2.inOut',
              '--fog-inset': '8%',
              '--fog-core': '0.92',
              onComplete: () => {
                running.current = null;
                resolve();
              },
            } as gsap.TweenVars);
          });
        },
        disperse: () => {
          const el = rootRef.current;
          if (!el) return Promise.resolve();
          killRunning();
          el.style.pointerEvents = 'auto';
          return new Promise<void>((resolve) => {
            gsap.set(el, {
              opacity: 1,
              '--fog-inset': '8%',
              '--fog-core': '0.92',
            } as gsap.TweenVars);
            running.current = gsap.to(el, {
              opacity: 0,
              duration: 0.8,
              ease: 'power2.out',
              '--fog-inset': '48%',
              '--fog-core': '0',
              onComplete: () => {
                running.current = null;
                el.style.pointerEvents = 'none';
                resolve();
              },
            } as gsap.TweenVars);
          });
        },
        setPeak: () => {
          const el = rootRef.current;
          if (!el) return;
          killRunning();
          gsap.set(el, {
            opacity: 1,
            '--fog-inset': '8%',
            '--fog-core': '0.92',
          } as gsap.TweenVars);
          el.style.pointerEvents = 'auto';
        },
      }),
      [killRunning],
    );

    return (
      <div
        ref={rootRef}
        className={`fixed inset-0 z-[70] ${className}`}
        aria-hidden="true"
        data-forest-decor="fog"
        style={{
          opacity: initialOpacity,
          pointerEvents: 'none',
          // CSS custom props driven by GSAP
          ['--fog-inset' as string]: '42%',
          ['--fog-core' as string]: '0.15',
          background: [
            `radial-gradient(ellipse at center, rgba(232, 239, 233, var(--fog-core)) 0%, rgba(200, 214, 204, 0.72) var(--fog-inset), rgba(170, 188, 176, 0.55) 55%, rgba(140, 160, 148, 0.35) 78%, transparent 100%)`,
            `radial-gradient(circle at 20% 30%, rgba(232, 239, 233, 0.45), transparent 42%)`,
            `radial-gradient(circle at 80% 70%, rgba(196, 165, 116, 0.18), transparent 40%)`,
          ].join(', '),
          mixBlendMode: 'screen',
        }}
      />
    );
  },
);

export default memo(ForestFogTransition);
