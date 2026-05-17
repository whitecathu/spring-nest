import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { easeOutExpo, softEase } from '../../lib/animations';

type SplashParticleFieldProps = {
  stage: number;
  compact: boolean;
  particleColor: string;
  quiet?: boolean;
};

function SplashParticleField({
  stage,
  compact,
  particleColor,
  quiet = false,
}: SplashParticleFieldProps) {
  const particles = useMemo(() => {
    const count = compact ? 7 : 14;
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const distance = (compact ? 58 : 96) + (index % 4) * (compact ? 12 : 16);
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 2 + (index % 3),
        delay: (index % 6) * 0.035,
      };
    });
  }, [compact]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: particleColor,
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
          animate={
            stage >= 3
              ? {
                  opacity: quiet ? [0, 0.28, 0.08] : [0, 0.72, 0.12],
                  x: particle.x,
                  y: particle.y,
                  scale: [0.5, 1.1, 0.85],
                }
              : {}
          }
          transition={{ duration: 0.68, delay: particle.delay, ease: easeOutExpo }}
        />
      ))}

      {stage >= 4 &&
        particles.slice(0, compact ? 5 : 8).map((particle, index) => (
          <motion.span
            key={`orbit-${index}`}
            className="absolute left-1/2 top-1/2 h-px origin-left rounded-full"
            style={{
              width: Math.max(34, Math.abs(particle.x) + 18),
              background: `linear-gradient(90deg, ${particleColor}, transparent)`,
              rotate: `${(index / particles.length) * 360}deg`,
              willChange: 'transform, opacity',
            }}
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: [0, 0.35, 0.08], scaleX: [0.2, 1, 0.72] }}
            transition={{ duration: 0.72, delay: index * 0.035, ease: softEase }}
          />
        ))}
    </div>
  );
}

export default memo(SplashParticleField);
