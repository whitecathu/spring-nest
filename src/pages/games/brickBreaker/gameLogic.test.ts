import { describe, expect, it, vi } from 'vitest';
import {
  calculatePaddleBounce,
  clampPaddlePosition,
  enforceMinimumVerticalVelocity,
  hitBrick,
} from './gameLogic';
import type { Brick } from './constants';

describe('brick breaker pure game logic', () => {
  it('keeps the paddle within the board at both edges', () => {
    expect(clampPaddlePosition(-20, 80)).toBe(0);
    expect(clampPaddlePosition(390, 80)).toBe(320);
    expect(clampPaddlePosition(125, 80)).toBe(125);
  });

  it('prevents the ball entering a nearly-horizontal loop without changing speed', () => {
    const velocity = enforceMinimumVerticalVelocity({ x: 5, y: 0.1 }, 0.25);

    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(Math.hypot(5, 0.1), 8);
    expect(Math.abs(velocity.y)).toBeCloseTo(Math.hypot(5, 0.1) * 0.25, 8);
  });

  it('calculates a deterministic upward paddle bounce and rewards centre hits', () => {
    const random = vi.fn(() => 0.5);
    const centre = calculatePaddleBounce({
      ballCenterX: 200,
      paddleX: 160,
      paddleWidth: 80,
      velocity: { x: 3, y: 4 },
      random,
    });
    const edge = calculatePaddleBounce({
      ballCenterX: 166,
      paddleX: 160,
      paddleWidth: 80,
      velocity: { x: 3, y: 4 },
      random,
    });

    expect(centre.y).toBeLessThan(0);
    expect(Math.hypot(centre.x, centre.y)).toBeCloseTo(5.4, 8);
    expect(Math.hypot(edge.x, edge.y)).toBeCloseTo(5, 8);
  });

  it('applies brick durability and reports points only when destroyed', () => {
    const brick: Brick = {
      row: 0,
      col: 0,
      alive: true,
      color: 'red',
      hits: 2,
      maxHits: 2,
      shaking: false,
    };

    expect(hitBrick(brick)).toEqual({ destroyed: false, points: 0 });
    expect(brick).toMatchObject({ alive: true, hits: 1 });
    expect(hitBrick(brick)).toEqual({ destroyed: true, points: 60 });
    expect(brick).toMatchObject({ alive: false, hits: 0 });
  });
});
