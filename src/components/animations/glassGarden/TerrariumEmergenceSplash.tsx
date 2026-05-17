import { Canvas } from '@react-three/fiber';
import { memo } from 'react';
import { motion } from 'motion/react';
import { easeOutExpo } from '../../../lib/animations';
import GlassTerrariumScene from './GlassTerrariumScene';
import { glassGardenProfiles } from './sceneProfiles';

type TerrariumEmergenceSplashProps = {
  dark: boolean;
  reducedMotion: boolean;
};

function TerrariumEmergenceSplash({ dark, reducedMotion }: TerrariumEmergenceSplashProps) {
  return (
    <motion.div
      className="relative mx-4 grid h-[min(66vh,520px)] w-[min(88vw,760px)] overflow-hidden rounded-[2.25rem] border shadow-[0_34px_90px_rgba(63,103,81,0.18)]"
      style={{
        background: dark
          ? 'linear-gradient(145deg, oklch(13% 0.018 145), oklch(10% 0.014 80))'
          : 'linear-gradient(145deg, oklch(98% 0.018 86), oklch(94% 0.034 145), oklch(96% 0.024 54))',
        borderColor: dark ? 'oklch(88% 0.06 145 / 0.12)' : 'oklch(42% 0.08 145 / 0.12)',
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: easeOutExpo }}
    >
      <div className="absolute inset-0 glass-garden-readability-veil" aria-hidden="true" />
      <Canvas
        className="glass-garden-canvas"
        dpr={[1, 1.6]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <GlassTerrariumScene profile={glassGardenProfiles.startup} phase="splash" dark={dark} />
      </Canvas>
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-8 text-center"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.96, ease: easeOutExpo }}
      >
        <p className="font-nunito text-3xl font-black leading-none text-primary">Spring Nest</p>
        <p className="mt-2 font-nunito text-sm font-bold text-secondary">春日小筑</p>
      </motion.div>
    </motion.div>
  );
}

export default memo(TerrariumEmergenceSplash);
