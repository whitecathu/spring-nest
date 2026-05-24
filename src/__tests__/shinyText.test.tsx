import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ShinyText from '../components/animations/ShinyText';

vi.mock('../lib/animations', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('ShinyText', () => {
  it('renders text content', () => {
    render(<ShinyText text="Hello Shiny" />);
    expect(screen.getByText('Hello Shiny')).toBeDefined();
  });

  it('applies background-clip text styling', () => {
    render(<ShinyText text="Shiny" />);
    const el = screen.getByText('Shiny') as HTMLElement;
    expect(el.style.backgroundClip).toBe('text');
  });

  it('respects reduced motion', async () => {
    const { useReducedMotion } = await import('../lib/animations');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    render(<ShinyText text="Plain Text" />);
    const el = screen.getByText('Plain Text') as HTMLElement;
    expect(el.style.backgroundClip).not.toBe('text');
  });
});
