/**
 * GSAP-powered surface components — replaces MotionSurface.tsx.
 * All components respect reduced-motion and clean up on unmount.
 */

import { useRef, type MouseEvent, type ReactNode, type CSSProperties } from 'react';
import gsap from 'gsap';
import { useReducedMotion, useInteractive } from '../lib/gsap';
import { getSurfacePreset, type SurfaceMotionTone } from '../lib/gsap-presets';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// ── MagneticButton ─────────────────────────────────────────
interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  magneticStrength?: number;
}

export function MagneticButton({
  children,
  magneticStrength = 0.28,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: MagneticButtonProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    onMouseEnter?.(event);
    if (reducedMotion) return;
    rectRef.current = event.currentTarget.getBoundingClientRect();
  };

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(event);
    if (reducedMotion) return;

    const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (event.clientX - centerX) * magneticStrength;
    const y = (event.clientY - centerY) * magneticStrength;

    if (ref.current) {
      gsap.to(ref.current, { x, y, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    }
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(event);
    rectRef.current = null;
    if (ref.current) {
      gsap.to(ref.current, { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    }
  };

  return (
    <button
      ref={ref}
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      {children}
    </button>
  );
}

// ── TiltGlareCard ──────────────────────────────────────────
interface TiltGlareCardProps {
  children: ReactNode;
  className?: string;
  depth?: number;
  intensity?: number;
  style?: CSSProperties;
}

export function TiltGlareCard({
  children,
  className = '',
  depth = 18,
  intensity = 9,
  style,
}: TiltGlareCardProps) {
  const reducedMotion = useReducedMotion();
  const shellRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    rectRef.current = event.currentTarget.getBoundingClientRect();
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;

    const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;

    const rotateXVal = (50 - py) * (intensity / 50);
    const rotateYVal = (px - 50) * (intensity / 50);

    if (shellRef.current) {
      gsap.to(shellRef.current, {
        rotateX: rotateXVal,
        rotateY: rotateYVal,
        duration: 0.4,
        ease: 'elastic.out(1, 0.5)',
      });
    }
    if (glareRef.current) {
      gsap.to(glareRef.current, {
        background: `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 26%, transparent 62%)`,
        opacity: 1,
        duration: 0.3,
      });
    }
    if (contentRef.current) {
      gsap.to(contentRef.current, { z: depth, duration: 0.4, ease: 'elastic.out(1, 0.5)' } as any);
    }
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    if (shellRef.current) {
      gsap.to(shellRef.current, { rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' });
    }
    if (glareRef.current) {
      gsap.to(glareRef.current, { opacity: 0, duration: 0.3 });
    }
    if (contentRef.current) {
      gsap.to(contentRef.current, { z: 0, duration: 0.4, ease: 'power2.out' } as any);
    }
  };

  return (
    <div
      ref={shellRef}
      className={`tilt-card-shell ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
    >
      {!reducedMotion && (
        <div
          ref={glareRef}
          aria-hidden="true"
          className="tilt-card-glare"
          style={{ opacity: 0 }}
        />
      )}
      <div ref={contentRef} className="tilt-card-content" style={{ z: 0 } as any}>
        {children}
      </div>
    </div>
  );
}

// ── MotionButton ───────────────────────────────────────────
type MotionButtonTone = 'primary' | 'secondary' | 'icon' | 'ghost';

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: MotionButtonTone;
  magnetic?: boolean;
  children: ReactNode;
}

export function MotionButton({
  tone = 'secondary',
  magnetic = false,
  className = '',
  children,
  ...props
}: MotionButtonProps) {
  const reducedMotion = useReducedMotion();
  const interactiveRef = useInteractive<HTMLButtonElement>(1.02, 0.96);
  const motionClass = cx('motion-button', `motion-button-${tone}`, className);

  return (
    <button
      ref={reducedMotion ? undefined : interactiveRef}
      {...props}
      className={motionClass}
    >
      {children}
    </button>
  );
}

// ── MotionCard ─────────────────────────────────────────────
interface MotionCardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: SurfaceMotionTone;
  interactive?: boolean;
  children: ReactNode;
}

export function MotionCard({
  tone = 'tool',
  interactive = true,
  className = '',
  children,
  style,
  ...props
}: MotionCardProps) {
  const reducedMotion = useReducedMotion();
  const preset = getSurfacePreset(tone);
  const hoverScale = preset.hover.scale ?? 1;
  const tapScale = preset.tap?.scale ?? 0.98;
  const interactiveRef = useInteractive<HTMLElement>(hoverScale, tapScale);

  return (
    <article
      ref={reducedMotion || !interactive ? undefined : interactiveRef}
      {...props}
      className={cx('motion-card', `motion-card-${tone}`, className)}
      style={{
        transformStyle: 'preserve-3d',
        willChange: reducedMotion || !interactive ? 'auto' : 'transform',
        ...style,
      }}
    >
      {children}
    </article>
  );
}

// ── MotionPanel ────────────────────────────────────────────
interface MotionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function MotionPanel({ className = '', children, ...props }: MotionPanelProps) {
  return (
    <div {...props} className={cx('motion-panel', className)}>
      {children}
    </div>
  );
}

// ── MotionList ─────────────────────────────────────────────
interface MotionListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function MotionList({ className = '', children, ...props }: MotionListProps) {
  return (
    <div {...props} className={cx('motion-list', className)}>
      {children}
    </div>
  );
}

/** Lightweight presence wrapper (no layout animation dependency). */
export function AnimatedPresenceBlock({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div {...props} className={cx('motion-presence-block', className)}>
      {children}
    </div>
  );
}
