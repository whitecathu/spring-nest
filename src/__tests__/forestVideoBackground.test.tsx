import { fireEvent, render } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ForestVideoBackground from '../components/animations/ForestVideoBackground';

describe('ForestVideoBackground playback fallback', () => {
  beforeAll(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  });

  beforeEach(() => {
    vi.mocked(HTMLMediaElement.prototype.play).mockResolvedValue();
  });

  it('keeps the poster visible until the video is actually playing', () => {
    const { container } = render(<ForestVideoBackground enabled />);
    const poster = container.querySelector('img') as HTMLImageElement;
    const video = container.querySelector('video') as HTMLVideoElement;

    expect(poster.style.opacity).toBe('1');
    expect(video.style.opacity).toBe('0');

    fireEvent.playing(video);

    expect(poster.style.opacity).toBe('0');
    expect(video.style.opacity).toBe('1');
  });

  it('restores the poster when media playback fails', () => {
    const { container } = render(<ForestVideoBackground enabled />);
    const poster = container.querySelector('img') as HTMLImageElement;
    const video = container.querySelector('video') as HTMLVideoElement;

    fireEvent.playing(video);
    fireEvent.error(video);

    expect(poster.style.opacity).toBe('1');
    expect(video.style.opacity).toBe('0');
  });

  it('releases the video resource when disabled', () => {
    const { container, rerender } = render(<ForestVideoBackground enabled />);
    expect(container.querySelector('video')).not.toBeNull();

    rerender(<ForestVideoBackground enabled={false} />);

    expect(container.querySelector('video')).toBeNull();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});
