import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GlareHover from '../components/animations/GlareHover';

vi.mock('../lib/animations', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('GlareHover', () => {
  it('renders children', () => {
    render(
      <GlareHover>
        <span>hover me</span>
      </GlareHover>,
    );
    expect(screen.getByText('hover me')).toBeDefined();
  });

  it('has glare-hover class', () => {
    const { container } = render(
      <GlareHover>
        <span>content</span>
      </GlareHover>,
    );
    expect(container.querySelector('.glare-hover')).not.toBeNull();
  });

  it('updates CSS custom properties on pointer move', () => {
    const { container } = render(
      <GlareHover>
        <span>content</span>
      </GlareHover>,
    );
    const el = container.querySelector('.glare-hover') as HTMLElement;
    expect(el).not.toBeNull();

    fireEvent.pointerMove(el, { clientX: 50, clientY: 50 });
    expect(el.style.getPropertyValue('--glare-opacity')).toBe('1');
  });

  it('resets opacity on pointer leave', () => {
    const { container } = render(
      <GlareHover>
        <span>content</span>
      </GlareHover>,
    );
    const el = container.querySelector('.glare-hover') as HTMLElement;

    fireEvent.pointerMove(el, { clientX: 50, clientY: 50 });
    fireEvent.pointerLeave(el);
    expect(el.style.getPropertyValue('--glare-opacity')).toBe('0');
  });

  it('respects reduced motion', async () => {
    const { useReducedMotion } = await import('../lib/animations');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(
      <GlareHover>
        <span>plain content</span>
      </GlareHover>,
    );

    expect(screen.getByText('plain content')).toBeDefined();
    expect(container.querySelector('.glare-hover')).toBeNull();
  });
});
