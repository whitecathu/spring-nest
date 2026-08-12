import { useRef, useEffect, useCallback, type RefCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface GameLayoutProps {
  title: string;
  subtitle: string;
  score: number;
  bestScore: number;
  onBack: () => void;
  onRestart?: () => void;
  restartLabel?: string;
  showRestart?: boolean;
  backLabel?: string;
  children: React.ReactNode;
}

function useInteractive<T extends HTMLElement>(hoverScale = 1.05, tapScale = 0.93): RefCallback<T> {
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
      if (!node) return;

      function onEnter() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, {
          scale: hoverScale,
          duration: 0.25,
          ease: 'power2.out',
        });
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
        tweenRef.current = gsap.to(node!, {
          scale: hoverScale,
          duration: 0.2,
          ease: 'back.out(1.7)',
        });
      }

      node.addEventListener('mouseenter', onEnter);
      node.addEventListener('mouseleave', onLeave);
      node.addEventListener('pointerdown', onDown);
      node.addEventListener('pointerup', onUp);
      node.addEventListener('pointerleave', onUp);
    },
    [hoverScale, tapScale],
  );

  return callbackRef;
}

function useHoverY<T extends HTMLElement>(yOffset = -2): RefCallback<T> {
  const ref = useRef<T | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const callbackRef: RefCallback<T> = useCallback(
    (node: T | null) => {
      if (ref.current) {
        ref.current.removeEventListener('mouseenter', onEnter);
        ref.current.removeEventListener('mouseleave', onLeave);
      }
      tweenRef.current?.kill();
      ref.current = node;
      if (!node) return;

      function onEnter() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { y: yOffset, duration: 0.25, ease: 'power2.out' });
      }
      function onLeave() {
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(node!, { y: 0, duration: 0.25, ease: 'power2.out' });
      }

      node.addEventListener('mouseenter', onEnter);
      node.addEventListener('mouseleave', onLeave);
    },
    [yOffset],
  );

  return callbackRef;
}

export default function GameLayout({
  title,
  subtitle,
  score,
  bestScore,
  onBack,
  onRestart,
  restartLabel,
  showRestart = false,
  backLabel,
  children,
}: GameLayoutProps) {
  const { t } = useUser();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scoreHoverRef = useHoverY();
  const bestHoverRef = useHoverY();
  const restartRef = useInteractive();
  const scoreValueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      gsap.fromTo(
        wrapperRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      );
    }
  }, []);

  useEffect(() => {
    if (scoreValueRef.current) {
      gsap.fromTo(
        scoreValueRef.current,
        { scale: 1.4 },
        { scale: 1, duration: 0.3, ease: 'back.out(2)' },
      );
    }
  }, [score]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {backLabel ?? t('返回游戏列表', 'Back to Games')}
      </button>

      <div ref={wrapperRef}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{title}</h1>
            <p className="text-sm text-secondary">{subtitle}</p>
          </div>
          <div className="flex gap-2">
            <div
              ref={scoreHoverRef}
              className="bg-surface-container-high rounded-xl px-4 py-2 text-center"
            >
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div ref={scoreValueRef} className="text-xl font-bold text-primary tabular-nums">
                {score}
              </div>
            </div>
            <div
              ref={bestHoverRef}
              className="bg-surface-container-high rounded-xl px-4 py-2 text-center"
            >
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {t('最佳', 'Best')}
              </div>
              <div className="text-xl font-bold text-tertiary tabular-nums">{bestScore}</div>
            </div>
          </div>
        </div>

        {/* Game content */}
        {children}

        {/* Restart button */}
        {showRestart && onRestart && (
          <div className="flex justify-center gap-4 mt-4">
            <button
              ref={restartRef}
              onClick={onRestart}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {restartLabel ?? t('重新开始', 'Restart')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
