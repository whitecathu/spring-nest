import { memo, useRef, type ReactNode } from 'react';
import { motion, useInView } from 'motion/react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-40px' });
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const items = Array.isArray(children) ? children : [children];

  return (
    <div ref={containerRef} className={className}>
      {items.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, ...directionOffset[direction] }}
          animate={
            isInView
              ? { opacity: 1, x: 0, y: 0 }
              : { opacity: 0, ...directionOffset[direction] }
          }
          transition={{
            duration: 0.45,
            delay: index * staggerDelay,
            ease: easeOutExpo as [number, number, number, number],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export default memo(AnimatedListInner);
