export type BrickBreakerGameState = 'idle' | 'playing' | 'won' | 'lost';
export type BrickBreakerGameEvent = 'START' | 'WIN' | 'LOSE' | 'NEXT_LEVEL';

export function transitionGameState(
  state: BrickBreakerGameState,
  event: BrickBreakerGameEvent,
): BrickBreakerGameState {
  if (event === 'START') return 'playing';
  if (state === 'playing' && event === 'WIN') return 'won';
  if (state === 'playing' && event === 'LOSE') return 'lost';
  if (state === 'won' && event === 'NEXT_LEVEL') return 'playing';
  return state;
}
