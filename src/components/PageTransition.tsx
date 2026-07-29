import gsap from 'gsap';
import { useReducedMotion } from '../lib/animations';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </div>
  );
}
