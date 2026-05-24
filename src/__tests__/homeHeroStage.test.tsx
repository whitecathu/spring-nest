import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomeHeroStage from '../components/animations/HomeHeroStage';

describe('HomeHeroStage', () => {
  it('renders a decorative hero stage with stable count metadata', () => {
    render(<HomeHeroStage toolsCount={29} gamesCount={19} reducedMotion />);

    const stage = screen.getByTestId('home-hero-stage');
    expect(stage.getAttribute('aria-hidden')).toBe('true');
    expect(stage.getAttribute('data-tools-count')).toBe('29');
    expect(stage.getAttribute('data-games-count')).toBe('19');
    expect(stage.getAttribute('data-reduced-motion')).toBe('true');
    expect(stage.querySelectorAll('.home-hero-stage__panel')).toHaveLength(3);
  });
});
