import { memo, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useInView } from '../../lib/gsap';
import { easeOutExpo, motionStaggers, useReducedMotion } from '../../lib/animations';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const directionOffset = {
  up: { y: 20 },
  down: { y: -20 },
  left: { x: 20 },
  right: { x: -20 },
};

function AnimatedListInner({
  children,
  className = '',
  staggerDelay = motionStaggers.relaxed,
  direction = 'up',
}: AnimatedListProps) {
  const [inViewRef, isInView] = useInView({ once: true, margin: '-40px' });
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const items = Array.isArray(children) ? children : [children];

  return (
    <div ref={inViewRef} className={className}>
      {items.map((child, index) => (
        <div
          key={index}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

export default memo(AnimatedListInner);
