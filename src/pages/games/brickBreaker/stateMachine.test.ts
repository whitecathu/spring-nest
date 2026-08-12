import { describe, expect, it } from 'vitest';
import { transitionGameState } from './stateMachine';

describe('brick breaker state machine', () => {
  it('starts and restarts a game from terminal states', () => {
    expect(transitionGameState('idle', 'START')).toBe('playing');
    expect(transitionGameState('lost', 'START')).toBe('playing');
    expect(transitionGameState('won', 'START')).toBe('playing');
  });

  it('only accepts win and loss events while playing', () => {
    expect(transitionGameState('idle', 'WIN')).toBe('idle');
    expect(transitionGameState('idle', 'LOSE')).toBe('idle');
    expect(transitionGameState('playing', 'WIN')).toBe('won');
    expect(transitionGameState('playing', 'LOSE')).toBe('lost');
  });

  it('continues from a cleared level and ignores invalid events', () => {
    expect(transitionGameState('won', 'NEXT_LEVEL')).toBe('playing');
    expect(transitionGameState('lost', 'NEXT_LEVEL')).toBe('lost');
  });
});
