import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useForestRuntimeSelectorOptional } from '../../lib/forest/ForestRuntime';

const MASTER_GAIN = 0.2;

type Engine = {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggle: () => void;
  unlock: () => Promise<void>;
  dispose: () => void;
  setWindStrength: (s: number) => void;
  setScrollBoost: (s: number) => void;
};

function createNoiseBuffer(ctx: AudioContext, seconds = 2) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function createForestAudioEngine(): Engine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let streamGain: GainNode | null = null;
  let windGain: GainNode | null = null;
  let muted = true;
  let started = false;

  const ensureGraph = async () => {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      streamGain = ctx.createGain();
      streamGain.gain.value = 0.55;
      windGain = ctx.createGain();
      windGain.gain.value = 0.2;

      const noise = createNoiseBuffer(ctx);
      const streamSrc = ctx.createBufferSource();
      streamSrc.buffer = noise;
      streamSrc.loop = true;
      const streamFilter = ctx.createBiquadFilter();
      streamFilter.type = 'lowpass';
      streamFilter.frequency.value = 680;
      streamFilter.Q.value = 0.7;
      streamSrc.connect(streamFilter);
      streamFilter.connect(streamGain);
      streamGain.connect(master);

      const windSrc = ctx.createBufferSource();
      windSrc.buffer = noise;
      windSrc.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 420;
      windFilter.Q.value = 0.6;
      windSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(master);

      streamSrc.start();
      windSrc.start();
      started = true;
    }
    if (ctx.state === 'suspended') await ctx.resume();
  };

  const applyMute = () => {
    if (!master || !ctx) return;
    const target = muted ? 0 : MASTER_GAIN;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.25);
  };

  return {
    get muted() {
      return muted;
    },
    setMuted(next: boolean) {
      muted = next;
      applyMute();
    },
    toggle() {
      muted = !muted;
      void ensureGraph().then(applyMute);
    },
    async unlock() {
      await ensureGraph();
      applyMute();
    },
    dispose() {
      try {
        void ctx?.close();
      } catch {
        // ignore
      }
      ctx = null;
      master = null;
      streamGain = null;
      windGain = null;
      started = false;
    },
    setWindStrength(s: number) {
      if (!windGain || !ctx || !started) return;
      const v = 0.12 + Math.min(1, Math.max(0, s)) * 0.35;
      windGain.gain.setTargetAtTime(v, ctx.currentTime, 0.2);
    },
    setScrollBoost(s: number) {
      if (!windGain || !ctx || !started) return;
      const boost = Math.min(1, Math.max(0, s)) * 0.15;
      windGain.gain.setTargetAtTime(
        (windGain.gain.value || 0.2) * 0.85 + 0.12 + boost,
        ctx.currentTime,
        0.15,
      );
    },
  };
}

let sharedEngine: Engine | null = null;

export function useForestAudioEngine() {
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) {
    if (!sharedEngine) sharedEngine = createForestAudioEngine();
    engineRef.current = sharedEngine;
  }
  const [muted, setMutedState] = useState(true);

  useEffect(() => {
    const engine = engineRef.current!;
    setMutedState(engine.muted);
    return () => {
      // keep shared engine alive across remounts; parent may dispose later
    };
  }, []);

  const toggle = useCallback(() => {
    const engine = engineRef.current!;
    engine.toggle();
    setMutedState(engine.muted);
  }, []);

  const setMuted = useCallback((next: boolean) => {
    const engine = engineRef.current!;
    engine.setMuted(next);
    setMutedState(engine.muted);
    if (!next) void engine.unlock();
  }, []);

  return { muted, toggle, setMuted, engine: engineRef.current! };
}

export type ForestAudioToggleProps = {
  className?: string;
  /** Sync wind/scroll into engine when runtime present. */
  followRuntime?: boolean;
};

export function ForestAudioToggle({
  className = '',
  followRuntime = true,
}: ForestAudioToggleProps) {
  const { muted, toggle, engine } = useForestAudioEngine();
  const windStrength = useForestRuntimeSelectorOptional((s) => s.wind.strength, 0);
  const scrollVy = useForestRuntimeSelectorOptional((s) => s.scroll.vy, 0);

  useEffect(() => {
    if (!followRuntime) return;
    engine.setWindStrength(windStrength);
    engine.setScrollBoost(Math.min(1, Math.abs(scrollVy) / 2000));
  }, [engine, followRuntime, windStrength, scrollVy]);

  return (
    <button
      type="button"
      data-forest-ui="audio-toggle"
      onClick={() => {
        toggle();
      }}
      aria-pressed={!muted}
      aria-label={muted ? '开启森林环境音' : '关闭森林环境音'}
      title={muted ? '开启环境音' : '关闭环境音'}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
    >
      <span aria-hidden="true" className="text-sm font-bold leading-none">
        {muted ? '音' : '♪'}
      </span>
    </button>
  );
}

/** Thin wrapper used as a mountable ambient audio controller (renders toggle). */
function ForestAudio(props: ForestAudioToggleProps) {
  return <ForestAudioToggle {...props} />;
}

export default memo(ForestAudio);
