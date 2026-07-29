import { memo, useMemo } from 'react';
import gsap from 'gsap';
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
        <span
          key={index}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: particleColor,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {stage >= 4 &&
        particles.slice(0, compact ? 5 : 8).map((particle, index) => (
          <span
            key={`orbit-${index}`}
            className="absolute left-1/2 top-1/2 h-px origin-left rounded-full"
            style={{
              width: Math.max(34, Math.abs(particle.x) + 18),
              background: `linear-gradient(90deg, ${particleColor}, transparent)`,
              rotate: `${(index / particles.length) * 360}deg`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
    </div>
  );
}

export default memo(SplashParticleField);
