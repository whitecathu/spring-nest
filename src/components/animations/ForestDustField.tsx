import { memo, useEffect, useRef } from 'react';
import { FOREST_PALETTE } from '../../lib/forest/forestPalette';

export type ForestDustFieldProps = {
  count?: number;
  paused?: boolean;
  pointerX?: number;
  pointerY?: number;
  pointerSpeed?: number;
  scrollVy?: number;
  windX?: number;
  windY?: number;
  windStrength?: number;
  /** Optional godray rect in client coordinates. */
  godray?: { x: number; y: number; w: number; h: number } | null;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  layer: 0 | 1 | 2;
  life: number;
  seed: number;
};

function makeParticles(count: number, w: number, h: number): Particle[] {
  const far = Math.round(count * 0.36);
  const mid = Math.round(count * 0.45);
  const near = Math.max(0, count - far - mid);
  const layers: Array<0 | 1 | 2> = [
    ...Array.from({ length: far }, () => 0 as const),
    ...Array.from({ length: mid }, () => 1 as const),
    ...Array.from({ length: near }, () => 2 as const),
  ];

  return layers.map((layer, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * (0.15 + layer * 0.12),
    vy: (Math.random() - 0.5) * (0.1 + layer * 0.08),
    size:
      layer === 0
        ? 1 + Math.random()
        : layer === 1
          ? 1.6 + Math.random() * 1.4
          : 2.2 + Math.random() * 1.8,
    layer,
    life: 0.4 + Math.random() * 0.6,
    seed: i * 1.17,
  }));
}

function ForestDustField({
  count = 55,
  paused = false,
  pointerX = -9999,
  pointerY = -9999,
  pointerSpeed = 0,
  scrollVy = 0,
  windX = 0,
  windY = 0,
  windStrength = 0.1,
  godray = null,
  className = '',
}: ForestDustFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const propsRef = useRef({
    paused,
    pointerX,
    pointerY,
    pointerSpeed,
    scrollVy,
    windX,
    windY,
    windStrength,
    godray,
  });
  propsRef.current = {
    paused,
    pointerX,
    pointerY,
    pointerSpeed,
    scrollVy,
    windX,
    windY,
    windStrength,
    godray,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particlesRef.current.length !== count) {
        particlesRef.current = makeParticles(count, w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    particlesRef.current = makeParticles(count, window.innerWidth, window.innerHeight);

    let raf = 0;
    let last = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = propsRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      if (!p.paused && !document.hidden) {
        const scrollPush = Math.max(-2.5, Math.min(2.5, p.scrollVy * 0.0012));
        for (const particle of particlesRef.current) {
          const layerMul = 0.35 + particle.layer * 0.45;
          particle.x += (particle.vx + p.windX * layerMul * 18 + p.windStrength * 4) * (dt * 60);
          particle.y += (particle.vy + p.windY * layerMul * 10 - scrollPush * layerMul) * (dt * 60);

          // pointer airflow channel: soft repulsion when moving fast
          if (p.pointerSpeed > 180) {
            const dx = particle.x - p.pointerX;
            const dy = particle.y - p.pointerY;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 90) {
              const force = ((90 - dist) / 90) * 0.9 * layerMul;
              particle.x += (dx / dist) * force;
              particle.y += (dy / dist) * force;
            }
          }

          if (particle.x < -10) particle.x = w + 10;
          if (particle.x > w + 10) particle.x = -10;
          if (particle.y < -10) particle.y = h + 10;
          if (particle.y > h + 10) particle.y = -10;

          let brightness = particle.life;
          if (p.godray) {
            const { x, y, w: gw, h: gh } = p.godray;
            if (
              particle.x >= x &&
              particle.x <= x + gw &&
              particle.y >= y &&
              particle.y <= y + gh
            ) {
              brightness *= 1.5;
            }
          }

          const alpha =
            particle.layer === 0
              ? 0.18 * brightness
              : particle.layer === 1
                ? 0.34 * brightness
                : 0.48 * brightness;
          const blur =
            particle.layer === 0 ? 2 : particle.layer === 1 ? 1 : 1 + (particle.seed % 2);

          ctx.beginPath();
          ctx.fillStyle =
            particle.layer === 1
              ? `color-mix(in srgb, ${FOREST_PALETTE.gold} ${Math.round(alpha * 100)}%, transparent)`
              : `rgba(232, 239, 233, ${alpha})`;
          ctx.shadowBlur = blur;
          ctx.shadowColor = FOREST_PALETTE.gold;
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else {
        // still draw static frame when paused so first paint isn't empty
        for (const particle of particlesRef.current) {
          const alpha = particle.layer === 0 ? 0.12 : particle.layer === 1 ? 0.22 : 0.3;
          ctx.beginPath();
          ctx.fillStyle = `rgba(232, 239, 233, ${alpha})`;
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
      data-forest-decor="dust"
    />
  );
}

export default memo(ForestDustField);
