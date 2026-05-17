import { memo } from 'react';
import { motion } from 'motion/react';
import { easeOutExpo, softEase } from '../../lib/animations';

type SpringNestLogoMotionProps = {
  compact: boolean;
  dark: boolean;
  reducedMotion: boolean;
};

function SpringNestLogoMotion({ compact, dark, reducedMotion }: SpringNestLogoMotionProps) {
  const ink = dark ? 'oklch(88% 0.06 145)' : 'oklch(31% 0.07 145)';
  const softInk = dark ? 'oklch(78% 0.08 90)' : 'oklch(48% 0.07 92)';
  const branch = dark ? 'oklch(75% 0.1 82)' : 'oklch(50% 0.09 78)';
  const leaf = dark ? 'oklch(77% 0.13 145)' : 'oklch(54% 0.12 145)';
  const panel = dark ? 'oklch(18% 0.018 150 / 0.72)' : 'oklch(100% 0 0 / 0.76)';
  const panelBorder = dark ? 'oklch(82% 0.08 145 / 0.12)' : 'oklch(45% 0.08 145 / 0.12)';
  const markSize = compact ? 92 : 108;
  const progressDuration = compact ? 0.36 : 0.42;

  const entrance = reducedMotion
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 1, y: 0, scale: 1 };

  return (
    <motion.div
      className="relative mx-4 flex w-[min(86vw,340px)] flex-col items-center rounded-[2rem] border px-7 py-7 text-center shadow-[0_24px_70px_rgba(63,103,81,0.14)] backdrop-blur-xl dark:shadow-none sm:px-8"
      style={{
        background: panel,
        borderColor: panelBorder,
        boxShadow: dark ? 'inset 0 1px 0 oklch(100% 0 0 / 0.06)' : undefined,
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.985 }}
      animate={entrance}
      transition={{ duration: 0.34, ease: easeOutExpo }}
    >
      <motion.div
        className="relative mb-5 grid place-items-center"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: easeOutExpo }}
        aria-hidden="true"
      >
        <motion.div
          className="absolute rounded-[1.65rem] border"
          style={{
            width: markSize,
            height: markSize,
            borderColor: panelBorder,
            background: dark
              ? 'linear-gradient(145deg, oklch(23% 0.026 150 / 0.72), oklch(17% 0.018 88 / 0.72))'
              : 'linear-gradient(145deg, oklch(100% 0 0 / 0.84), oklch(95% 0.034 92 / 0.72))',
            boxShadow: dark
              ? 'inset 0 1px 0 oklch(100% 0 0 / 0.06)'
              : 'inset 0 1px 0 oklch(100% 0 0 / 0.86)',
          }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.44, ease: easeOutExpo }}
        />

        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 96 96"
          className="relative overflow-visible"
        >
          <motion.circle
            cx="69"
            cy="26"
            r="5"
            fill={dark ? 'oklch(78% 0.12 82 / 0.46)' : 'oklch(78% 0.12 82 / 0.42)'}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.7 }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, delay: 0.08, ease: easeOutExpo }}
          />
          <motion.path
            d="M24 59 C34 70 62 70 73 59"
            fill="transparent"
            stroke={branch}
            strokeWidth="2.8"
            strokeLinecap="round"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={reducedMotion ? undefined : { pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.52, delay: 0.12, ease: softEase }}
          />
          <motion.path
            d="M31 55 C42 48 56 48 66 55"
            fill="transparent"
            stroke={branch}
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={reducedMotion ? undefined : { pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 0.42, delay: 0.22, ease: softEase }}
          />
          <motion.path
            d="M48 58 C34 41 39 26 48 20 C58 26 62 42 48 58 Z"
            fill={dark ? 'oklch(72% 0.13 145 / 0.16)' : 'oklch(56% 0.12 145 / 0.13)'}
            stroke={leaf}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0, rotate: -5 }}
            animate={reducedMotion ? undefined : { pathLength: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.58, delay: 0.04, ease: softEase }}
          />
          <motion.path
            d="M49 56 C53 43 59 34 67 28"
            fill="transparent"
            stroke={dark ? 'oklch(89% 0.05 145 / 0.78)' : 'oklch(82% 0.07 145 / 0.86)'}
            strokeWidth="1.25"
            strokeLinecap="round"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={reducedMotion ? undefined : { pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.42, delay: 0.34, ease: softEase }}
          />
        </svg>
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.22, ease: easeOutExpo }}
      >
        <p className="font-nunito text-2xl font-black leading-none sm:text-[1.7rem]" style={{ color: ink }}>
          Spring Nest
        </p>
        <p className="mt-2 font-nunito text-sm font-bold" style={{ color: softInk }}>
          春日小筑
        </p>
      </motion.div>

      <div
        className="mt-6 h-[2px] w-36 overflow-hidden rounded-full"
        style={{
          background: dark ? 'oklch(82% 0.08 145 / 0.12)' : 'oklch(44% 0.08 145 / 0.12)',
        }}
        aria-hidden="true"
      >
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ background: leaf, willChange: 'transform' }}
          initial={{ scaleX: reducedMotion ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: progressDuration, ease: easeOutExpo }}
        />
      </div>
    </motion.div>
  );
}

export default memo(SpringNestLogoMotion);
