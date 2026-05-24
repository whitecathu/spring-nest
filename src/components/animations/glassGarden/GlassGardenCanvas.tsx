import { Canvas, useThree } from '@react-three/fiber';
import { memo, useEffect } from 'react';
import type { BackgroundProfile } from '../../../lib/backgroundProfiles';
import GlassTerrariumScene from './GlassTerrariumScene';
import { getGlassGardenProfile } from './sceneProfiles';

type GlassGardenCanvasProps = {
  backgroundProfile: BackgroundProfile;
  dark: boolean;
};

function mapBackgroundProfileKey(key: string) {
  if (key === 'home-garden') return 'home';
  if (key === 'tools-flow') return 'tools';
  if (key === 'games-playful') return 'games';
  if (key === 'search-focus') return 'search';
  if (key === 'empty-quiet') return 'empty';
  return 'detail';
}

function LowFrequencyInvalidator() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const interval = window.setInterval(() => invalidate(), 180);
    return () => window.clearInterval(interval);
  }, [invalidate]);

  return null;
}

function GlassGardenCanvas({ backgroundProfile, dark }: GlassGardenCanvasProps) {
  const glassProfile = getGlassGardenProfile(mapBackgroundProfileKey(backgroundProfile.key));
  const canvasEventSource = typeof document === 'undefined' ? undefined : document.body;

  return (
    <div className="glass-garden-ambient-layer" aria-hidden="true">
      <Canvas
        className="glass-garden-canvas"
        dpr={[1, 1.35]}
        eventPrefix="client"
        eventSource={canvasEventSource}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      >
        <LowFrequencyInvalidator />
        <GlassTerrariumScene profile={glassProfile} phase="ambient" dark={dark} />
      </Canvas>
    </div>
  );
}

export default memo(GlassGardenCanvas);
