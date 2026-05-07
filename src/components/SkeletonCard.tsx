import { motion } from 'motion/react';
import { useReducedMotion } from '../lib/animations';

interface SkeletonCardProps {
  /** Match the layout of game cards or tool cards */
  variant?: 'game' | 'tool';
}

/**
 * GPU-accelerated skeleton placeholder for game/tool cards.
 * Uses CSS ::after shimmer (transform-based) for smooth 60fps animation.
 */
export default function SkeletonCard({ variant = 'game' }: SkeletonCardProps) {
  const reducedMotion = useReducedMotion();

  if (variant === 'tool') {
    const container = (
      <div
        role="status"
        aria-label="Loading"
        className="glass-card rounded-3xl p-8 flex flex-col items-center gap-6 animate-fade-in"
      >
        {/* Icon placeholder */}
        <div
          className={`skeleton-shimmer w-24 h-24 rounded-2xl${reducedMotion ? ' opacity-60' : ''}`}
          style={{ willChange: 'transform' }}
        />
        {/* Title placeholder */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className={`skeleton-shimmer skeleton-card-title mx-auto${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
          <div className={`skeleton-shimmer h-6 w-20 rounded-full${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
        </div>
        {/* Description placeholders */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className={`skeleton-shimmer skeleton-card-text mx-auto${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
          <div className={`skeleton-shimmer skeleton-card-text mx-auto${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
          <div className={`skeleton-shimmer skeleton-card-text-short mx-auto${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
        </div>
        {/* Button placeholder */}
        <div className={`skeleton-shimmer h-12 w-32 rounded-xl mt-auto${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
      </div>
    );

    if (reducedMotion) {
      return (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ willChange: 'opacity' }}
        >
          {container}
        </motion.div>
      );
    }

    return (
      <motion.div
        animate={{ scale: [0.98, 1, 0.98] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
      >
        {container}
      </motion.div>
    );
  }

  const container = (
    <div
      role="status"
      aria-label="Loading"
      className="bg-white dark:bg-surface-container-high rounded-xl p-6 shadow-[0_8px_30px_rgba(217,239,224,0.4)] dark:shadow-none flex flex-col gap-4 animate-fade-in"
    >
      {/* Image placeholder */}
      <div className={`skeleton-shimmer skeleton-card-image${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
      {/* Icon + title row */}
      <div className="flex items-start gap-4">
        <div className={`skeleton-shimmer skeleton-card-icon shrink-0${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
        <div className="flex-grow flex flex-col gap-2 pt-1">
          <div className={`skeleton-shimmer skeleton-card-title${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
          <div className={`skeleton-shimmer skeleton-card-text-short${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
        </div>
      </div>
      {/* Description */}
      <div className="flex flex-col gap-2 mt-2">
        <div className={`skeleton-shimmer skeleton-card-text${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
        <div className={`skeleton-shimmer skeleton-card-text-short${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
      </div>
      {/* Action row */}
      <div className="mt-auto pt-4 flex justify-between items-center">
        <div className={`skeleton-shimmer w-9 h-9 rounded-full${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
        <div className={`skeleton-shimmer h-9 w-28 rounded-full${reducedMotion ? ' opacity-60' : ''}`} style={{ willChange: 'transform' }} />
      </div>
    </div>
  );

  if (reducedMotion) {
    return (
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'opacity' }}
      >
        {container}
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ scale: [0.98, 1, 0.98] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ willChange: 'transform' }}
    >
      {container}
    </motion.div>
  );
}
