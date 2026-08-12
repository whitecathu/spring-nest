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

  it('uses an independent eight-second watchdog when media and fog stall', async () => {
    const onComplete = vi.fn();
    render(<StartupSplash forceShow onComplete={onComplete} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
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
