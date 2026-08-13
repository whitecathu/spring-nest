import { memo, useEffect, useRef, useState } from 'react';
import bgPoster from '../../assets/forest/bg-poster.webp';
import bgVideo from '../../assets/forest/bg-stream.mp4';

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
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPlaying(false);
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
    setPlaying(false);
    prepareVideo(video, playbackRate);
    video.preload = 'auto';
    video.src = bgVideo;
    video.load();

    const markPlaying = () => {
      if (!disposed) setPlaying(true);
    };

    const showPoster = () => {
      if (!disposed) setPlaying(false);
    };

    const playSafe = () => {
      if (disposed) return;
      video.playbackRate = playbackRate;
      const p = video.play();
      if (p) void p.catch(showPoster);
    };

    video.addEventListener('playing', markPlaying);
    video.addEventListener('waiting', showPoster);
    video.addEventListener('stalled', showPoster);
    video.addEventListener('loadeddata', playSafe);
    video.addEventListener('error', showPoster);

    const onVisibility = () => {
      if (document.hidden) {
        showPoster();
        video.pause();
        return;
      }
      playSafe();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      video.removeEventListener('playing', markPlaying);
      video.removeEventListener('waiting', showPoster);
      video.removeEventListener('stalled', showPoster);
      video.removeEventListener('loadeddata', playSafe);
      video.removeEventListener('error', showPoster);
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
        src={bgPoster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: FOREST_FILTER,
          opacity: playing && enabled ? 0 : 1,
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
          preload="auto"
          poster={bgPoster}
          style={{
            filter: FOREST_FILTER,
            opacity: playing ? 1 : 0,
            transition: 'opacity 0.45s ease',
          }}
        />
      )}
    </div>
  );
}

export default memo(ForestVideoBackground);
