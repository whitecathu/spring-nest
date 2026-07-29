import { useRef, useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../lib/gsap';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const directionOffset = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
};

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.fromTo(ref.current,
            { opacity: 0, ...directionOffset[direction] },
            { opacity: 1, x: 0, y: 0, duration: 0.5, delay, ease: 'power2.out' }
          );
          observer.disconnect();
        }
      },
      { rootMargin: '-60px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reducedMotion, direction, delay]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
