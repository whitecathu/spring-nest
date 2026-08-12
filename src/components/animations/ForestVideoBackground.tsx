import { memo, useEffect, useRef, useState } from 'react';

const BG_SRC = '/forest/bg-stream.mp4';
const BG_POSTER = '/forest/bg-poster.webp';
const FOREST_FILTER = 'brightness(0.92) contrast(1.05) saturate(0.92)';

export type ForestVideoBackgroundProps = {
  enabled: boolean;
  playbackRate?: number;
  offsetX?: number;
  offsetY?: number;
  className?: string;
};

function prepareVideo(video: HTMLVideoElement, rate: number) {
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.playbackRate = rate;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
}

/** Single-buffer looping forest background — avoids dual 4K downloads. */
function ForestVideoBackground({
  enabled,
  playbackRate = 0.8,
  offsetX = 0,
  offsetY = 0,
  className = '',
}: ForestVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    prepareVideo(video, playbackRate);
    video.preload = 'metadata';
    video.src = BG_SRC;
    video.load();

    const markReady = () => {
      if (!disposed) setReady(true);
    };

    const playSafe = () => {
      if (disposed) return;
      video.playbackRate = playbackRate;
      const p = video.play();
      if (p) void p.catch(() => undefined);
    };

    video.addEventListener('canplay', markReady);
    video.addEventListener('loadeddata', playSafe);

    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      playSafe();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      video.removeEventListener('canplay', markReady);
      video.removeEventListener('loadeddata', playSafe);
      document.removeEventListener('visibilitychange', onVisibility);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [enabled, playbackRate]);

  const transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(1.04)`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      data-forest-decor="video-bg"
      style={{ transform }}
    >
      <img
        src={BG_POSTER}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: FOREST_FILTER,
          opacity: ready && enabled ? 0 : 1,
          transition: 'opacity 0.45s ease',
        }}
        decoding="async"
      />

      {enabled && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          loop
          preload="metadata"
          poster={BG_POSTER}
          style={{
            filter: FOREST_FILTER,
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.45s ease',
          }}
        />
      )}
    </div>
  );
}

export default memo(ForestVideoBackground);
