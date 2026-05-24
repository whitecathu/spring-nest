import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';
import { useReducedMotion } from '../../lib/animations';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number;
  direction?: 'left' | 'right';
  color?: string;
  shineColor?: string;
  spread?: number;
  pauseOnHover?: boolean;
}

function ShinyTextInner({
  text,
  className = '',
  speed = 3,
  direction = 'left',
  color = 'var(--color-on-surface-variant, #414943)',
  shineColor = 'var(--color-primary-container, #b8e4c9)',
  spread = 120,
  pauseOnHover = false,
}: ShinyTextProps) {
  const reducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  const animationDuration = speed * 1000;

  useAnimationFrame((time) => {
    if (reducedMotion || isPaused) {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    const cycleDuration = animationDuration;
    const cycleTime = elapsedRef.current % cycleDuration;
    const p = (cycleTime / cycleDuration) * 100;
    progress.set(direction === 'left' ? p : 100 - p);
  });

  useEffect(() => {
    elapsedRef.current = 0;
    progress.set(0);
  }, [direction, progress]);

  const backgroundPosition = useTransform(progress, (p) => `${150 - p * 2}% center`);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  );
}

export default memo(ShinyTextInner);
