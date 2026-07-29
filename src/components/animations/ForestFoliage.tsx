import { memo } from 'react';

export type ForestFoliageProps = {
  windStrength?: number;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  className?: string;
};

function LeafSvg({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 320"
      className="h-full w-full"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <path
        d="M78 8 C42 48 18 96 22 148 C26 198 54 236 78 268 C62 220 58 176 64 132 C70 88 88 46 108 18 C98 28 88 18 78 8 Z"
        fill="rgba(28, 52, 38, 0.55)"
      />
      <path
        d="M52 40 C28 92 16 148 28 204 C36 244 62 278 86 304 C68 262 54 220 50 176 C46 128 58 84 78 52 C68 62 58 52 52 40 Z"
        fill="rgba(45, 74, 54, 0.42)"
      />
      <path
        d="M96 60 C70 110 62 168 78 220 C90 256 112 286 118 302 C108 268 98 234 96 196 C94 150 108 108 124 78 C114 86 104 72 96 60 Z"
        fill="rgba(20, 40, 28, 0.38)"
      />
    </svg>
  );
}

function ForestFoliage({
  windStrength = 0.2,
  offsetX = 0,
  offsetY = 0,
  blur = 3,
  className = '',
}: ForestFoliageProps) {
  const sway = Math.min(14, windStrength * 18);
  const leftTransform = `translate3d(${offsetX - sway * 0.35}px, ${offsetY}px, 0) rotate(${-2 - sway * 0.15}deg)`;
  const rightTransform = `translate3d(${-offsetX + sway * 0.4}px, ${offsetY * 0.85}px, 0) rotate(${2 + sway * 0.12}deg)`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      data-forest-decor="foliage"
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-[min(12vw,160px)]"
        style={{
          transform: leftTransform,
          filter: `blur(${blur}px)`,
          opacity: 0.72,
          willChange: 'transform',
        }}
      >
        <LeafSvg />
      </div>
      <div
        className="absolute bottom-0 right-0 top-0 w-[min(12vw,160px)]"
        style={{
          transform: rightTransform,
          filter: `blur(${blur}px)`,
          opacity: 0.68,
          willChange: 'transform',
        }}
      >
        <LeafSvg flip />
      </div>
    </div>
  );
}

export default memo(ForestFoliage);
