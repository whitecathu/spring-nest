import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AnimatedPresenceBlock,
  MotionButton,
  MotionCard,
  MotionList,
  MotionPanel,
} from '../components/GsapSurface';

describe('MotionSurface primitives', () => {
  it('renders a motion button with the requested label and class', () => {
    const onClick = vi.fn();
    render(
      <MotionButton type="button" tone="primary" onClick={onClick}>
        Open
      </MotionButton>,
    );

    const button = screen.getByRole('button', { name: 'Open' });
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.className).toContain('motion-button');
    expect(button.className).toContain('motion-button-primary');
  });

  it('renders cards and panels with stable surface classes', () => {
    render(
      <MotionPanel aria-label="Panel">
        <MotionCard tone="game">Play card</MotionCard>
      </MotionPanel>,
    );

    expect(screen.getByLabelText('Panel').className).toContain('motion-panel');
    expect(screen.getByText('Play card').className).toContain('motion-card');
    expect(screen.getByText('Play card').className).toContain('motion-card-game');
  });

  it('renders list and presence blocks without requiring layout animation', () => {
    render(
      <MotionList aria-label="Items">
        <AnimatedPresenceBlock>Ready</AnimatedPresenceBlock>
      </MotionList>,
    );

    expect(screen.getByLabelText('Items').className).toContain('motion-list');
    expect(screen.getByText('Ready').className).toContain('motion-presence-block');
  });
});
