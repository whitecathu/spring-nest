import { useCallback, useEffect, useRef, useState } from 'react';
import {
  markForestSplashSeen,
  shouldShowForestSplash,
} from '../../lib/forest/forestSplashMemory';
import { useReducedMotion } from '../../lib/animations';
import { useFocusTrap } from '../../lib/useFocusTrap';
import ForestFogTransition, {
  type ForestFogHandle,
} from './ForestFogTransition';
import SpringNestLogoMotion from './SpringNestLogoMotion';

const SPLASH_SRC = '/forest/splash-startup.mp4';
const SPLASH_POSTER = '/forest/splash-poster.webp';
const LOAD_TIMEOUT_MS = 1800;
/** Show brand after the frame has settled. */
const LOGO_AT_SEC = 1.8;
/**
 * Stock clip visually loops past ~6s — exit before the repeat.
 * Keep wall-clock under one clean pass.
 */
const PLAY_UNTIL_SEC = 5.8;
const PLAYBACK_RATE = 1;
const FOREST_FILTER = 'brightness(1.06) contrast(1.05) saturate(0.92)';

export type StartupSplashProps = {
  onComplete?: () => void;
  forceShow?: boolean;
};

function destroyVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  try {
    video.pause();
    video.removeAttribute('src');
    video.load();
  } catch {
    // ignore
  }
}

export default function StartupSplash({ onComplete, forceShow = false }: StartupSplashProps) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fogRef = useRef<ForestFogHandle>(null);
  const completedRef = useRef(false);
  const logoShownRef = useRef(false);
  const [showLogo, setShowLogo] = useState(false);
  const [usePosterOnly, setUsePosterOnly] = useState(false);
  const [visible, setVisible] = useState(true);
  const [videoFade, setVideoFade] = useState(1);
  const showFullSplash =
    forceShow || (typeof window !== 'undefined' ? shouldShowForestSplash() : true);

  const finish = useCallback(
    async (opts?: { gatherFirst?: boolean; markSeen?: boolean }) => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (opts?.markSeen !== false) markForestSplashSeen();

      setVideoFade(0);

      try {
        if (opts?.gatherFirst) await fogRef.current?.gather();
        else fogRef.current?.setPeak?.();
        await fogRef.current?.disperse();
      } catch {
        // continue even if fog animation fails
      }

      destroyVideo(videoRef.current);
      setVisible(false);
      onComplete?.();
    },
    [onComplete],
  );

  const runGatherThenComplete = useCallback(() => {
    void finish({ gatherFirst: true, markSeen: true });
  }, [finish]);

  const runDisperseOnly = useCallback(() => {
    void finish({ gatherFirst: false, markSeen: false });
  }, [finish]);

  const skip = useCallback(() => {
    runGatherThenComplete();
  }, [runGatherThenComplete]);

  useFocusTrap(rootRef, {
    enabled: visible && showFullSplash && !reducedMotion,
    onEscape: skip,
  });

  useEffect(() => {
    if (!visible) return;

    if (!showFullSplash || reducedMotion) {
      const t = window.setTimeout(() => {
        runDisperseOnly();
      }, reducedMotion ? 40 : 80);
      return () => window.clearTimeout(t);
    }

    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    let endTimer: number | null = null;
    let loadTimer: number | null = null;
    let startedTimeline = false;

    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    video.playbackRate = PLAYBACK_RATE;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const revealLogo = () => {
      if (disposed || logoShownRef.current) return;
      logoShownRef.current = true;
      setShowLogo(true);
    };

    const startTimeline = (durationHint?: number) => {
      if (disposed || startedTimeline) return;
      startedTimeline = true;

      const duration =
        durationHint && Number.isFinite(durationHint) && durationHint > 0
          ? durationHint
          : video.duration && Number.isFinite(video.duration)
            ? video.duration
            : PLAY_UNTIL_SEC;

      const playUntil = Math.min(PLAY_UNTIL_SEC, Math.max(LOGO_AT_SEC + 1.2, duration - 0.35));
      const wallMs = (playUntil / PLAYBACK_RATE) * 1000;

      endTimer = window.setTimeout(() => {
        if (!disposed) runGatherThenComplete();
      }, wallMs);
    };

    const onLoaded = () => {
      if (disposed) return;
      if (loadTimer) {
        window.clearTimeout(loadTimer);
        loadTimer = null;
      }
      const play = video.play();
      if (play) void play.catch(() => setUsePosterOnly(true));
      startTimeline(video.duration);
    };

    const onEnded = () => {
      if (!disposed) runGatherThenComplete();
    };

    const onTimeUpdate = () => {
      if (disposed) return;
      if (video.currentTime >= LOGO_AT_SEC) revealLogo();
      if (video.currentTime >= PLAY_UNTIL_SEC) {
        video.pause();
        runGatherThenComplete();
      }
    };

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.src = SPLASH_SRC;
    video.load();

    loadTimer = window.setTimeout(() => {
      if (disposed || startedTimeline) return;
      setUsePosterOnly(true);
      revealLogo();
      startTimeline(PLAY_UNTIL_SEC);
    }, LOAD_TIMEOUT_MS);

    return () => {
      disposed = true;
      if (endTimer) window.clearTimeout(endTimer);
      if (loadTimer) window.clearTimeout(loadTimer);
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      destroyVideo(video);
    };
  }, [visible, showFullSplash, reducedMotion, runGatherThenComplete, runDisperseOnly]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] overflow-hidden bg-[#142018]"
      role="dialog"
      aria-modal="true"
      aria-label="Spring Nest 开屏"
      tabIndex={-1}
    >
      <img
        src={SPLASH_POSTER}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: FOREST_FILTER }}
        decoding="async"
      />

      {showFullSplash && !reducedMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          muted
          playsInline
          preload="auto"
          poster={SPLASH_POSTER}
          style={{
            filter: FOREST_FILTER,
            opacity: usePosterOnly ? 0 : videoFade,
          }}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 48% 38% at 50% 44%, rgba(255,249,242,0.16) 0%, transparent 70%),
            radial-gradient(ellipse at 50% 50%, transparent 34%, rgba(16, 26, 20, 0.48) 100%)
          `,
          opacity: videoFade,
          transition: 'opacity 500ms ease',
        }}
      />

      {showLogo && showFullSplash && !reducedMotion && (
        <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center px-6">
          <SpringNestLogoMotion variant="mark" animateIn markWidth="168px" />
        </div>
      )}

      <ForestFogTransition ref={fogRef} initialOpacity={showFullSplash && !reducedMotion ? 0 : 0.85} />

      {showFullSplash && !reducedMotion && (
        <button
          type="button"
          onClick={skip}
          className="absolute bottom-7 right-7 z-[3] min-h-11 rounded-full border px-5 py-2.5 font-nunito text-sm font-bold backdrop-blur-md transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            borderColor: 'rgba(255,255,255,0.42)',
            background: 'rgba(255,255,255,0.28)',
            color: '#fff',
            boxShadow: '0 12px 32px -16px rgba(0,0,0,0.55)',
            letterSpacing: '0.04em',
          }}
        >
          跳过
        </button>
      )}
    </div>
  );
}
