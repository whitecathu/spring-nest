import type { Brick, Star } from './constants';
import { BRICK_ROWS, BRICK_COLS, ROW_COLORS } from './constants';

// ── Level patterns ──────────────────────────────────────────────────────────
// 2 = hard brick, 1 = normal brick, 0 = empty

export const LEVEL_PATTERNS: number[][][] = [
  // Level 1: full grid (all normal)
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Level 2: hard row at top, rest normal
  [
    [2, 2, 2, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
  ],
  // Level 3: diamond with hard bricks
  [
    [0, 0, 0, 2, 2, 0, 0, 0],
    [0, 0, 2, 1, 1, 2, 0, 0],
    [0, 2, 1, 1, 1, 1, 2, 0],
    [2, 1, 1, 1, 1, 1, 1, 2],
    [0, 2, 1, 1, 1, 1, 2, 0],
    [0, 0, 2, 1, 1, 2, 0, 0],
  ],
  // Level 4: checkerboard with hard bricks
  [
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
  ],
];

// ── Factory functions ───────────────────────────────────────────────────────

export function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      opacity: 0.2 + Math.random() * 0.5,
      animDelay: Math.random() * 4,
    });
  }
  return stars;
}

export function createBricks(level: number = 1): Brick[] {
  const bricks: Brick[] = [];
  const patternIdx = Math.min(level - 1, LEVEL_PATTERNS.length - 1);
  const pattern = LEVEL_PATTERNS[patternIdx];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const cell = pattern[r]?.[c] ?? 1;
      if (cell === 0) continue;
      const isHard = cell === 2;
      bricks.push({
        row: r,
        col: c,
        alive: true,
        color: ROW_COLORS[r % ROW_COLORS.length],
        hits: isHard ? 2 : 1,
        maxHits: isHard ? 2 : 1,
        shaking: false,
      });
    }
  }
  return bricks;
}
