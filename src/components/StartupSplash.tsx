import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import { softEase, useReducedMotion } from '../lib/animations';

export default function StartupSplash() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), reducedMotion ? 120 : 650);
    return () => window.clearTimeout(timeout);
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-[#fffaf1]/92 dark:bg-[#152218]/92"
          role="status"
          aria-label="Spring Nest loading"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.32, ease: softEase }}
        >
          <div className="relative grid place-items-center">
            <ParticleBackground maxParticles={7} scale={0.72} duration={2.4} />
            <motion.div
              className="grid size-20 place-items-center rounded-[1.75rem] border border-primary/15 bg-surface-container-high/85 text-primary shadow-soft backdrop-blur"
              animate={reducedMotion ? {} : { y: [0, -5, 0], scale: [1, 1.03, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: softEase }}
            >
              <Leaf className="size-9 fill-primary/25" aria-hidden="true" />
            </motion.div>
            <p className="mt-5 text-sm font-bold tracking-wide text-primary">Spring Nest</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
