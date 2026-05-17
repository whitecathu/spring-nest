import { memo } from 'react';
import { motion } from 'motion/react';
import { easeOutExpo, softEase } from '../../../lib/animations';

type LightweightEmergenceSplashProps = {
  compact: boolean;
  dark: boolean;
  reducedMotion: boolean;
};

function LightweightEmergenceSplash({
  compact,
  dark,
  reducedMotion,
}: LightweightEmergenceSplashProps) {
  const soil = dark ? 'oklch(31% 0.038 55)' : 'oklch(46% 0.055 58)';
  const soilDark = dark ? 'oklch(20% 0.03 55)' : 'oklch(35% 0.05 52)';
  const stem = dark ? 'oklch(76% 0.12 145)' : 'oklch(42% 0.1 145)';
  const leaf = dark ? 'oklch(80% 0.13 145)' : 'oklch(58% 0.13 145)';
  const glass = dark ? 'oklch(95% 0.01 145 / 0.14)' : 'oklch(100% 0 0 / 0.34)';
  const ink = dark ? 'oklch(89% 0.06 145)' : 'oklch(30% 0.07 145)';
  const markSize = compact ? 118 : 146;
  const duration = reducedMotion ? 0.01 : 0.56;

  return (
    <motion.div
      className="relative mx-4 flex w-[min(88vw,390px)] flex-col items-center rounded-[2rem] border px-7 py-7 text-center shadow-[0_26px_72px_rgba(63,103,81,0.16)] backdrop-blur-xl"
      style={{
        background: dark ? 'oklch(18% 0.018 145 / 0.72)' : 'oklch(100% 0 0 / 0.72)',
        borderColor: dark ? 'oklch(88% 0.06 145 / 0.12)' : 'oklch(42% 0.08 145 / 0.12)',
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: easeOutExpo }}
    >
      <svg width={markSize} height={markSize} viewBox="0 0 160 160" className="overflow-visible">
        <motion.ellipse
          cx="80"
          cy="118"
          rx="54"
          ry="16"
          fill={soilDark}
          opacity="0.22"
          initial={false}
          animate={
            reducedMotion ? undefined : { scaleX: [0.96, 1.04, 1], opacity: [0.16, 0.28, 0.22] }
          }
          transition={{ duration: 0.62, ease: softEase }}
        />
        <motion.path
          d="M28 116 C48 101 112 101 132 116 L132 138 L28 138 Z"
          fill={soil}
          initial={reducedMotion ? false : { y: 3 }}
          animate={reducedMotion ? undefined : { y: [3, -2, 0] }}
          transition={{ duration, ease: easeOutExpo }}
        />
        <motion.path
          d="M48 112 C66 103 96 104 112 112"
          fill="none"
          stroke={dark ? 'oklch(78% 0.08 60 / 0.42)' : 'oklch(76% 0.08 70 / 0.5)'}
          strokeWidth="3"
          strokeLinecap="round"
          initial={reducedMotion ? false : { pathLength: 0.1, opacity: 0 }}
          animate={reducedMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.38, delay: 0.12, ease: softEase }}
        />
        {[42, 57, 105, 118].map((cx, index) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy={114 + (index % 2) * 5}
            r={index % 2 ? 2.4 : 3.2}
            fill={soilDark}
            initial={reducedMotion ? false : { opacity: 0, y: 5 }}
            animate={reducedMotion ? undefined : { opacity: [0, 0.72, 0.58], y: [5, -4, 0] }}
            transition={{ duration: 0.46, delay: 0.12 + index * 0.04, ease: easeOutExpo }}
          />
        ))}
        <motion.path
          d="M80 118 C73 92 75 70 84 42"
          fill="none"
          stroke={stem}
          strokeWidth="7"
          strokeLinecap="round"
          initial={reducedMotion ? false : { pathLength: 0, rotate: -4 }}
          animate={reducedMotion ? undefined : { pathLength: 1, rotate: [-4, 4, 0] }}
          transition={{ duration: 0.58, delay: 0.14, ease: softEase }}
        />
        <motion.path
          d="M82 70 C56 52 52 30 66 18 C92 27 101 52 82 70 Z"
          fill={leaf}
          opacity="0.88"
          stroke={stem}
          strokeWidth="2.5"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.68, rotate: -10 }}
          animate={reducedMotion ? undefined : { opacity: 0.88, scale: 1, rotate: 0 }}
          transition={{ duration: 0.44, delay: 0.44, ease: easeOutExpo }}
        />
        <motion.path
          d="M86 71 C114 54 119 31 101 18 C77 29 67 53 86 71 Z"
          fill={dark ? 'oklch(76% 0.12 135)' : 'oklch(68% 0.12 137)'}
          opacity="0.82"
          stroke={stem}
          strokeWidth="2.3"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.68, rotate: 10 }}
          animate={reducedMotion ? undefined : { opacity: 0.82, scale: 1, rotate: 0 }}
          transition={{ duration: 0.44, delay: 0.48, ease: easeOutExpo }}
        />
        <motion.path
          d="M36 24 C78 6 121 24 136 66 C148 100 126 136 80 142 C34 136 12 100 24 66 C28 48 32 34 36 24 Z"
          fill="none"
          stroke={glass}
          strokeWidth="2"
          initial={reducedMotion ? false : { opacity: 0, pathLength: 0.24 }}
          animate={reducedMotion ? undefined : { opacity: 1, pathLength: 1 }}
          transition={{ duration: 0.52, delay: 0.58, ease: softEase }}
        />
        <motion.path
          d="M48 34 C70 22 100 22 118 39"
          fill="none"
          stroke="oklch(100% 0 0 / 0.62)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
          animate={reducedMotion ? undefined : { opacity: [0, 0.9, 0.42], x: [-8, 8, 0] }}
          transition={{ duration: 0.44, delay: 0.72, ease: easeOutExpo }}
        />
      </svg>
      <motion.div
        className="mt-5"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: reducedMotion ? 0 : 0.78, ease: easeOutExpo }}
      >
        <p className="font-nunito text-2xl font-black leading-none" style={{ color: ink }}>
          Spring Nest
        </p>
        <p
          className="mt-2 font-nunito text-sm font-bold"
          style={{ color: dark ? 'oklch(78% 0.08 90)' : 'oklch(48% 0.07 92)' }}
        >
          春日小筑
        </p>
      </motion.div>
    </motion.div>
  );
}

export default memo(LightweightEmergenceSplash);
