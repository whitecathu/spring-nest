import { memo, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../lib/animations';

type PointerState = { x: number; y: number; down: boolean };

type InteractiveOverlayProps = {
  mode: 'desktop-3d' | 'lightweight';
  dark: boolean;
  pointerRef: React.MutableRefObject<PointerState>;
};

// SoA particle storage for cache-friendly iteration
const MAX_PARTICLES = 120;
const pX = new Float32Array(MAX_PARTICLES);
const pY = new Float32Array(MAX_PARTICLES);
const pVx = new Float32Array(MAX_PARTICLES);
const pVy = new Float32Array(MAX_PARTICLES);
const pLife = new Float32Array(MAX_PARTICLES);
const pSize = new Float32Array(MAX_PARTICLES);

function initParticles(count: number, w: number, h: number, start: number) {
  for (let i = start; i < start + count && i < MAX_PARTICLES; i++) {
    pX[i] = Math.random() * w;
    pY[i] = Math.random() * h;
    pVx[i] = (Math.random() - 0.5) * 0.6;
    pVy[i] = (Math.random() - 0.5) * 0.6;
    pLife[i] = 1;
    pSize[i] = 1.5 + Math.random() * 2.5;
  }
}

function burstParticles(cx: number, cy: number, count: number, start: number) {
  for (let i = start; i < start + count && i < MAX_PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    pX[i] = cx;
    pY[i] = cy;
    pVx[i] = Math.cos(angle) * speed;
    pVy[i] = Math.sin(angle) * speed;
    pLife[i] = 1;
    pSize[i] = 2 + Math.random() * 2;
  }
}

function InteractiveOverlayInner({ mode, dark, pointerRef }: InteractiveOverlayProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef(0);
  const nextSlotRef = useRef(0);
  const prevDownRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isFull = mode === 'desktop-3d';
    const baseCount = isFull ? 65 : 28;
    countRef.current = baseCount;
    nextSlotRef.current = baseCount;

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    initParticles(baseCount, window.innerWidth, window.innerHeight, 0);

    const color = dark ? 'oklch(83% 0.11 145 / 0.5)' : 'oklch(50% 0.11 145 / 0.4)';

    let raf = 0;
    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ptr = pointerRef.current;

      ctx.clearRect(0, 0, w, h);

      // Pointer burst on new pointerdown
      if (ptr.down && !prevDownRef.current) {
        const burstCount = isFull ? 14 : 8;
        const slot = nextSlotRef.current % MAX_PARTICLES;
        burstParticles(ptr.x, ptr.y, burstCount, slot);
        nextSlotRef.current = slot + burstCount;
        countRef.current = Math.min(countRef.current + burstCount, MAX_PARTICLES);
      }
      prevDownRef.current = ptr.down;

      const total = Math.min(countRef.current, MAX_PARTICLES);
      for (let i = 0; i < total; i++) {
        // Pointer repulsion (desktop only)
        if (isFull && !reducedMotion) {
          const dx = pX[i] - ptr.x;
          const dy = pY[i] - ptr.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (1 - dist / 150) * 0.8;
            pVx[i] += (dx / dist) * force;
            pVy[i] += (dy / dist) * force;
          }
        }

        // Damping
        pVx[i] *= 0.985;
        pVy[i] *= 0.985;

        // Drift
        pX[i] += pVx[i];
        pY[i] += pVy[i];

        // Life decay
        pLife[i] -= 0.003;

        // Wrap or respawn
        if (pX[i] < -10) pX[i] = w + 10;
        if (pX[i] > w + 10) pX[i] = -10;
        if (pY[i] < -10) pY[i] = h + 10;
        if (pY[i] > h + 10) pY[i] = -10;

        if (pLife[i] <= 0) {
          pX[i] = Math.random() * w;
          pY[i] = Math.random() * h;
          pVx[i] = (Math.random() - 0.5) * 0.6;
          pVy[i] = (Math.random() - 0.5) * 0.6;
          pLife[i] = 1;
          pSize[i] = 1.5 + Math.random() * 2.5;
        }

        const alpha = pLife[i] * (isFull ? 0.6 : 0.4);
        ctx.globalAlpha = alpha;

        if (isFull) {
          // Trail line
          ctx.strokeStyle = color;
          ctx.lineWidth = pSize[i] * 0.6;
          ctx.beginPath();
          ctx.moveTo(pX[i], pY[i]);
          ctx.lineTo(pX[i] - pVx[i] * 4, pY[i] - pVy[i] * 4);
          ctx.stroke();
        }

        // Dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pX[i], pY[i], pSize[i], 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion, mode, dark, pointerRef]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}

export default memo(InteractiveOverlayInner);
