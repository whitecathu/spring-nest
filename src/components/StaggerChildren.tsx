import { useRef, useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../lib/gsap';

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export default function StaggerChildren({
  children,
  className = '',
  staggerDelay = 0.08,
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const children = Array.from(ref.current!.children) as HTMLElement[];
          gsap.fromTo(children,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: staggerDelay }
          );
          observer.disconnect();
        }
      },
      { rootMargin: '-40px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reducedMotion, staggerDelay]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Use as child of StaggerChildren */
export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
