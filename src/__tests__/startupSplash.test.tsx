import { act, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import StartupSplash from '../components/animations/StartupSplash';

const fog = vi.hoisted(() => ({
  gather: vi.fn<() => Promise<void>>(),
  disperse: vi.fn<() => Promise<void>>(),
  setPeak: vi.fn(),
}));

vi.mock('../lib/animations', () => ({
  useReducedMotion: () => false,
}));

vi.mock('../lib/useFocusTrap', () => ({
  useFocusTrap: () => undefined,
}));

vi.mock('../components/animations/ForestFogTransition', () => ({
  default: forwardRef(function TestForestFog(_props, ref) {
    useImperativeHandle(ref, () => fog);
    return <div data-testid="forest-fog" />;
  }),
}));

describe('StartupSplash completion guarantees', () => {
  beforeAll(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    fog.gather.mockReset().mockImplementation(() => new Promise(() => undefined));
    fog.disperse.mockReset().mockImplementation(() => new Promise(() => undefined));
    fog.setPeak.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('removes the modal and unblocks the app immediately when skipped', () => {
    const onComplete = vi.fn();
    render(<StartupSplash forceShow onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: '跳过' }));

    expect(screen.queryByRole('dialog', { name: 'Spring Nest 开屏' })).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps waiting for slow media after 1.8 seconds', async () => {
    const onComplete = vi.fn();
    render(<StartupSplash forceShow onComplete={onComplete} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_801);
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Spring Nest 开屏' })).toBeInTheDocument();
  });

  it('uses a twelve-second watchdog and bounded exit transition when media and fog stall', async () => {
    const onComplete = vi.fn();
    render(<StartupSplash forceShow onComplete={onComplete} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });

    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Spring Nest 开屏' })).not.toBeInTheDocument();
  });

  it('bounds the automatic exit transition to 1.5 seconds', async () => {
    const onComplete = vi.fn();
    const { container } = render(<StartupSplash forceShow onComplete={onComplete} />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    fireEvent.ended(video as HTMLVideoElement);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('only reveals video after playback actually starts', () => {
    const { container } = render(<StartupSplash forceShow />);
    const video = container.querySelector('video') as HTMLVideoElement;

    expect(video.style.opacity).toBe('0');
    fireEvent.playing(video);
    expect(video.style.opacity).toBe('1');
  });

  it('does not restart playback when the parent passes a new completion callback', () => {
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();
    const { container, rerender } = render(<StartupSplash forceShow onComplete={firstComplete} />);
    const video = container.querySelector('video') as HTMLVideoElement;
    fireEvent.playing(video);
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();

    rerender(<StartupSplash forceShow onComplete={secondComplete} />);

    expect(container.querySelector('video')).toBe(video);
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
    expect(video.style.opacity).toBe('1');
  });

  it('finishes from media time rather than wall-clock time', async () => {
    const onComplete = vi.fn();
    const { container } = render(<StartupSplash forceShow onComplete={onComplete} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    video.currentTime = 5.8;
    fireEvent.timeUpdate(video);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows the branded fallback before exiting on media failure', async () => {
    fog.gather.mockResolvedValue();
    fog.disperse.mockResolvedValue();
    const onComplete = vi.fn();
    const { container } = render(<StartupSplash forceShow onComplete={onComplete} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    fireEvent.error(video);
    expect(video.style.opacity).toBe('0');
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_200);
      await Promise.resolve();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('uses the same branded fallback when autoplay is rejected', async () => {
    fog.gather.mockResolvedValue();
    fog.disperse.mockResolvedValue();
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error('blocked'));
    const onComplete = vi.fn();
    const { container } = render(<StartupSplash forceShow onComplete={onComplete} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    fireEvent.loadedData(video);
    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1_200);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('completes when the fog transition rejects', async () => {
    fog.gather.mockRejectedValue(new Error('GSAP interrupted'));
    const onComplete = vi.fn();
    const { container } = render(<StartupSplash forceShow onComplete={onComplete} />);

    fireEvent.ended(container.querySelector('video') as HTMLVideoElement);
    await act(async () => {
      await Promise.resolve();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
