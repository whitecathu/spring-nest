import { useMemo } from 'react';
import { motion } from 'motion/react';
import { floatingParticles, softEase, useReducedMotion } from '../lib/animations';

type ParticleBackgroundProps = {
  className?: string;
  particleClassName?: string;
  maxParticles?: number;
  scale?: number;
  duration?: number;
  opacity?: number;
};

function getDeviceParticleRatio() {
  if (typeof window === 'undefined') return 1;

  const smallScreen = window.matchMedia('(max-width: 640px)').matches;
  const lowCoreDevice =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency <= 4
      : false;

  return smallScreen || lowCoreDevice ? 0.6 : 1;
}

export default function ParticleBackground({
  className = 'pointer-events-none absolute inset-0',
  particleClassName = 'absolute rounded-full bg-primary/20',
  maxParticles = floatingParticles.length,
  scale = 1,
  duration = 3.5,
  opacity = 0.55,
}: ParticleBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const particles = useMemo(() => {
    if (reducedMotion) return [];
    const count = Math.max(
      0,
      Math.min(floatingParticles.length, Math.ceil(maxParticles * getDeviceParticleRatio())),
    );
    return floatingParticles.slice(0, count);
  }, [maxParticles, reducedMotion]);

  if (particles.length === 0) return null;

  return (
    <div className={className} aria-hidden="true">
      {particles.map((particle, index) => (
        <motion.span
          key={`${particle.x}-${particle.y}-${index}`}
          className={particleClassName}
          style={{
            width: particle.size,
            height: particle.size,
            left: '50%',
            top: '50%',
            willChange: 'transform, opacity',
          }}
          animate={{
            x: [0, particle.x * scale, 0],
            y: [0, particle.y * scale, 0],
            opacity: [0, opacity, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: softEase,
          }}
        />
      ))}
    </div>
  );
}
