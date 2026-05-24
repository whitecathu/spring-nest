import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import GlassSurface from '../components/animations/GlassSurface';

vi.mock('../lib/animations', () => ({
  useReducedMotion: vi.fn(() => false),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('GlassSurface', () => {
  it('renders children', () => {
    render(
      <GlassSurface>
        <span>glass content</span>
      </GlassSurface>,
    );
    expect(screen.getByText('glass content')).toBeDefined();
  });

  it('renders SVG filter when reduced motion is off', () => {
    const { container } = render(
      <GlassSurface>
        <span>content</span>
      </GlassSurface>,
    );
    const svg = container.querySelector('svg.glass-surface__filter');
    expect(svg).not.toBeNull();
    expect(svg?.querySelector('filter')).not.toBeNull();
  });

  it('applies unique filter IDs', () => {
    const { container: c1 } = render(
      <GlassSurface>
        <span>first</span>
      </GlassSurface>,
    );
    const { container: c2 } = render(
      <GlassSurface>
        <span>second</span>
      </GlassSurface>,
    );
    const filter1 = c1.querySelector('filter');
    const filter2 = c2.querySelector('filter');
    expect(filter1?.id).not.toBe(filter2?.id);
  });

  it('respects reduced motion', async () => {
    const { useReducedMotion } = await import('../lib/animations');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(
      <GlassSurface>
        <span>fallback content</span>
      </GlassSurface>,
    );

    expect(screen.getByText('fallback content')).toBeDefined();
    expect(container.querySelector('svg')).toBeNull();
  });
});
