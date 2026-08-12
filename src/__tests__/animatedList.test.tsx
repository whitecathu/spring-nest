import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AnimatedList from '../components/animations/AnimatedList';

vi.mock('../lib/animations', () => ({
  useReducedMotion: vi.fn(() => false),
  motionStaggers: { tight: 0.025, normal: 0.045, relaxed: 0.075 },
  easeOutExpo: [0.16, 1, 0.3, 1],
}));

describe('AnimatedList', () => {
  it('renders all children', () => {
    render(
      <AnimatedList>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </AnimatedList>,
    );
    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();
    expect(screen.getByText('Item 3')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedList className="custom-class">
        <div>Item</div>
      </AnimatedList>,
    );
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });

  it('respects reduced motion', async () => {
    const { useReducedMotion } = await import('../lib/animations');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(
      <AnimatedList>
        <div>Plain Item</div>
      </AnimatedList>,
    );

    expect(screen.getByText('Plain Item')).toBeDefined();
    expect(container.querySelector('.custom-class')).toBeNull();
  });
});
