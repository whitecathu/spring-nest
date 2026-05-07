import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import { useReducedMotion } from '../lib/animations';

/** Polished loading state for lazy-loaded game/tool components */
export default function GameToolLoading() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="flex-grow flex items-center justify-center min-h-[50vh]" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-5">
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -6, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Leaf className="w-10 h-10 text-primary fill-primary/30" />
        </motion.div>
        {!reducedMotion && (
          <div className="loading-progress">
            <motion.div
              className="h-full bg-primary/60 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
