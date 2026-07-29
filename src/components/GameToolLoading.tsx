import gsap from 'gsap';
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
    <div
      className="flex-grow flex items-center justify-center min-h-[50vh] px-4"
      role="status"
      aria-label="Loading"
    >
      <div className="surface-glass flex flex-col items-center gap-5 rounded-3xl px-8 py-7">
        <div className="relative">
          <ParticleBackground />
          {/* Floating orbit dots */}
          {!reducedMotion &&
            orbitDots.map((dot, i) => {
              const rad = (dot.angle * Math.PI) / 180;
              const cx = Math.cos(rad) * dot.radius;
              const cy = Math.sin(rad) * dot.radius;
              return (
                <div
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
                />
              );
            })}
          <div
          >
            <Leaf className="w-10 h-10 text-primary fill-primary/30" />
          </div>
        </div>
        {!reducedMotion && (
          <div className="loading-progress">
            <div
              className="h-full rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--color-primary, #22c55e) 25%, var(--color-primary, #22c55e) 75%, transparent 100%)',
                opacity: 0.6,
              }}
            />
          </div>
        )}
        <span
          className="text-sm text-primary/60 font-nunito"
        >
          Loading
        </span>
      </div>
    </div>
  );
}
