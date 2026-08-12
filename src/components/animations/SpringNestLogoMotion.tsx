import { memo, useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { FOREST_PALETTE } from '../../lib/forest/forestPalette';

export type SpringNestLogoMotionProps = {
  compact?: boolean;
  dark?: boolean;
  reducedMotion?: boolean;
  /** `panel` = glass card (default); `mark` = logo glyph only for splash. */
  variant?: 'panel' | 'mark';
  /** When true, fog-coalesce entrance via GSAP. */
  animateIn?: boolean;
  className?: string;
  markWidth?: string;
};

function LogoMark({
  size,
  dark,
  markRef,
  bare = false,
}: {
  size: number;
  dark: boolean;
  markRef?: RefObject<HTMLDivElement | null>;
  bare?: boolean;
}) {
  const branch = dark ? 'oklch(75% 0.1 82)' : 'oklch(50% 0.09 78)';
  const leaf = dark ? 'oklch(77% 0.13 145)' : 'oklch(54% 0.12 145)';
  const panelBorder = dark ? 'oklch(82% 0.08 145 / 0.12)' : 'oklch(45% 0.08 145 / 0.12)';

  return (
    <div
      ref={markRef}
      className="relative grid place-items-center"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      {!bare && (
        <div
          className="absolute rounded-[1.65rem] border"
          style={{
            width: size,
            height: size,
            borderColor: panelBorder,
            background: dark
              ? 'linear-gradient(145deg, oklch(23% 0.026 150 / 0.72), oklch(17% 0.018 88 / 0.72))'
              : 'linear-gradient(145deg, oklch(100% 0 0 / 0.84), oklch(95% 0.034 92 / 0.72))',
            boxShadow: dark
              ? 'inset 0 1px 0 oklch(100% 0 0 / 0.06)'
              : 'inset 0 1px 0 oklch(100% 0 0 / 0.86)',
          }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 96 96" className="relative overflow-visible">
        <circle
          cx="69"
          cy="26"
          r="5"
          fill={dark ? 'oklch(78% 0.12 82 / 0.46)' : 'oklch(78% 0.12 82 / 0.42)'}
        />
        <path
          d="M24 59 C34 70 62 70 73 59"
          fill="transparent"
          stroke={bare ? FOREST_PALETTE.gold : branch}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M31 55 C42 48 56 48 66 55"
          fill="transparent"
          stroke={bare ? FOREST_PALETTE.gold : branch}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M48 58 C34 41 39 26 48 20 C58 26 62 42 48 58 Z"
          fill={dark ? 'oklch(72% 0.13 145 / 0.16)' : 'oklch(56% 0.12 145 / 0.13)'}
          stroke={bare ? '#E8F5EC' : leaf}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M49 56 C53 43 59 34 67 28"
          fill="transparent"
          stroke={dark ? 'oklch(89% 0.05 145 / 0.78)' : 'oklch(82% 0.07 145 / 0.86)'}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SpringNestLogoMotion({
  compact = false,
  dark = false,
  reducedMotion = false,
  variant = 'panel',
  animateIn = false,
  className = '',
  markWidth = '18vw',
}: SpringNestLogoMotionProps) {
  const ink = dark ? 'oklch(88% 0.06 145)' : 'oklch(31% 0.07 145)';
  const softInk = dark ? 'oklch(78% 0.08 90)' : 'oklch(48% 0.07 92)';
  const leaf = dark ? 'oklch(77% 0.13 145)' : 'oklch(54% 0.12 145)';
  const panel = dark ? 'oklch(18% 0.018 150 / 0.72)' : 'oklch(100% 0 0 / 0.76)';
  const panelBorder = dark ? 'oklch(82% 0.08 145 / 0.12)' : 'oklch(45% 0.08 145 / 0.12)';
  const markSize = compact ? 92 : 108;
  const rootRef = useRef<HTMLDivElement>(null);
  const markOnlySize =
    typeof window !== 'undefined' ? Math.max(72, Math.min(160, window.innerWidth * 0.18)) : 120;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!animateIn || reducedMotion) {
      gsap.set(el, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, y: 12, filter: 'blur(14px)' },
      { opacity: 1, y: -12, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' },
    );
    return () => {
      gsap.killTweensOf(el);
    };
  }, [animateIn, reducedMotion]);

  if (variant === 'mark') {
    return (
      <div
        ref={rootRef}
        className={`relative flex flex-col items-center ${className}`}
        style={{
          width: markWidth,
          maxWidth: 220,
        }}
      >
        <div
          className="absolute inset-[-28%] rounded-full"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle, rgba(255,249,242,0.42) 0%, rgba(196,165,116,0.28) 35%, transparent 70%)`,
            filter: 'blur(2px)',
          }}
        />
        <div
          className="relative"
          style={{
            filter:
              'drop-shadow(0 2px 10px rgba(255,249,242,0.55)) drop-shadow(0 14px 22px rgba(20,32,24,0.45))',
          }}
        >
          <LogoMark size={markOnlySize} dark={dark} bare />
        </div>
        <p
          className="relative mt-4 font-nunito text-[clamp(1.15rem,3.4vw,1.65rem)] font-black leading-none tracking-wide"
          style={{
            color: '#F4F7F2',
            textShadow:
              '0 1px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(20,32,24,0.65), 0 0 20px rgba(196,165,116,0.35)',
          }}
        >
          Spring Nest
        </p>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative mx-4 flex w-[min(86vw,340px)] flex-col items-center rounded-[2rem] border px-7 py-7 text-center shadow-[0_24px_70px_rgba(63,103,81,0.14)] backdrop-blur-xl dark:shadow-none sm:px-8 ${className}`}
      style={{
        background: panel,
        borderColor: panelBorder,
        boxShadow: dark ? 'inset 0 1px 0 oklch(100% 0 0 / 0.06)' : undefined,
      }}
    >
      <div className="relative mb-5 grid place-items-center" aria-hidden="true">
        <LogoMark size={markSize} dark={dark} />
      </div>

      <div>
        <p
          className="font-nunito text-2xl font-black leading-none sm:text-[1.7rem]"
          style={{ color: ink }}
        >
          Spring Nest
        </p>
        <p className="mt-2 font-nunito text-sm font-bold" style={{ color: softInk }}>
          春日小筑
        </p>
      </div>

      <div
        className="mt-6 h-[2px] w-36 overflow-hidden rounded-full"
        style={{
          background: dark ? 'oklch(82% 0.08 145 / 0.12)' : 'oklch(44% 0.08 145 / 0.12)',
        }}
        aria-hidden="true"
      >
        <div
          className="h-full origin-left rounded-full"
          style={{ background: leaf, willChange: 'transform' }}
        />
      </div>
    </div>
  );
}

export default memo(SpringNestLogoMotion);
