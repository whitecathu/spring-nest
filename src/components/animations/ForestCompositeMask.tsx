import { memo } from 'react';

export type ForestCompositeMaskProps = {
  /** 0–1 scroll progress; slight opacity tweak. */
  scrollProgress?: number;
  className?: string;
};

function ForestCompositeMask({ scrollProgress = 0, className = '' }: ForestCompositeMaskProps) {
  const p = Math.min(1, Math.max(0, scrollProgress));
  const veil = 0.42 + p * 0.08;
  const edge = 0.55 + p * 0.1;

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
      data-forest-decor="composite-mask"
      style={{
        background: [
          `radial-gradient(ellipse 58% 52% at 50% 42%, transparent 0%, transparent 42%, rgba(18, 28, 22, ${veil * 0.35}) 72%, rgba(12, 20, 16, ${veil}) 100%)`,
          `linear-gradient(180deg, rgba(10, 16, 12, ${edge}) 0%, transparent 18%, transparent 78%, rgba(8, 14, 11, ${edge * 0.95}) 100%)`,
        ].join(', '),
      }}
    />
  );
}

export default memo(ForestCompositeMask);
