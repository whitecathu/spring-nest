import { loadBestScore, saveBestScore } from '../../../lib/gameScore';

const GAME_ID = 'brickbreaker';

export function loadBrickBreakerBestScore(): number {
  return loadBestScore(GAME_ID);
}

export function saveBrickBreakerBestScore(score: number): void {
  saveBestScore(GAME_ID, score);
}
