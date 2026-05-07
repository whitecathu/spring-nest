import { motion } from 'motion/react';
import { useReducedMotion } from '../lib/animations';

interface SkeletonCardProps {
  /** Match the layout of game cards or tool cards */
  variant?: 'game' | 'tool';
}

/**
 * GPU-accelerated skeleton placeholder for game/tool cards.
 * Uses transform-based shimmer (not background-position) for smooth 60fps animation.
 */
export default function SkeletonCard({ variant = 'game' }: SkeletonCardProps) {
  const reducedMotion = useReducedMotion();

  const shimmer = reducedMotion
    ? {}
    : {
        animate: { opacity: [0.4, 0.7, 0.4] },
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
      };

  if (variant === 'tool') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-3xl p-8 flex flex-col items-center gap-6"
      >
        {/* Icon placeholder */}
        <motion.div
          {...shimmer}
          className="skeleton-shimmer w-24 h-24 rounded-2xl"
        />
        {/* Title placeholder */}
        <div className="flex flex-col items-center gap-3 w-full">
          <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-title mx-auto" />
          <motion.div {...shimmer} className="skeleton-shimmer h-6 w-20 rounded-full" />
        </div>
        {/* Description placeholders */}
        <div className="flex flex-col items-center gap-2 w-full">
          <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-text mx-auto" />
          <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-text mx-auto" />
          <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-text-short mx-auto" />
        </div>
        {/* Button placeholder */}
        <motion.div {...shimmer} className="skeleton-shimmer h-12 w-32 rounded-xl mt-auto" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-surface-container-high rounded-xl p-6 shadow-[0_8px_30px_rgba(217,239,224,0.4)] dark:shadow-none flex flex-col gap-4"
    >
      {/* Image placeholder */}
      <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-image" />
      {/* Icon + title row */}
      <div className="flex items-start gap-4">
        <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-icon shrink-0" />
        <div className="flex-grow flex flex-col gap-2 pt-1">
          <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-title" />
          <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-text-short" />
        </div>
      </div>
      {/* Description */}
      <div className="flex flex-col gap-2 mt-2">
        <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-text" />
        <motion.div {...shimmer} className="skeleton-shimmer skeleton-card-text-short" />
      </div>
      {/* Action row */}
      <div className="mt-auto pt-4 flex justify-between items-center">
        <motion.div {...shimmer} className="skeleton-shimmer w-9 h-9 rounded-full" />
        <motion.div {...shimmer} className="skeleton-shimmer h-9 w-28 rounded-full" />
      </div>
    </motion.div>
  );
}
