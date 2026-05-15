import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import { useReducedMotion, softEase } from '../lib/animations';

const orbitDots = [
  { angle: 0, radius: 28, delay: 0, size: 4 },
  { angle: 90, radius: 32, delay: 0.4, size: 3 },
  { angle: 200, radius: 26, delay: 0.8, size: 5 },
  { angle: 300, radius: 30, delay: 1.2, size: 3 },
];

/** Polished loading state for lazy-loaded game/tool components */
export default function GameToolLoading() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className="flex-grow flex items-center justify-center min-h-[50vh]"
      role="status"
      aria-label="Loading"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: softEase }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <ParticleBackground />
          {/* Floating orbit dots */}
          {!reducedMotion &&
            orbitDots.map((dot, i) => {
              const rad = (dot.angle * Math.PI) / 180;
              const cx = Math.cos(rad) * dot.radius;
              const cy = Math.sin(rad) * dot.radius;
              return (
                <motion.div
                  key={`orbit-${i}`}
                  className="absolute rounded-full bg-primary/25"
                  style={{
                    width: dot.size,
                    height: dot.size,
                    left: '50%',
                    top: '50%',
                    marginLeft: -dot.size / 2,
                    marginTop: -dot.size / 2,
                  }}
                  animate={{
                    x: [0, cx, 0, -cx, 0],
                    y: [0, cy, 0, -cy, 0],
                    opacity: [0, 0.7, 0.4, 0.7, 0],
                    scale: [0.5, 1, 0.8, 1, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: dot.delay,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
              );
            })}
          <motion.div
            animate={reducedMotion ? {} : { y: [0, -6, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: softEase }}
          >
            <Leaf className="w-10 h-10 text-primary fill-primary/30" />
          </motion.div>
        </div>
        {!reducedMotion && (
          <div className="loading-progress">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--color-primary, #22c55e) 25%, var(--color-primary, #22c55e) 75%, transparent 100%)',
                opacity: 0.6,
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] }}
            />
          </div>
        )}
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: softEase }}
          className="text-sm text-primary/60 font-nunito"
        >
          Loading
        </motion.span>
      </div>
    </motion.div>
  );
}
