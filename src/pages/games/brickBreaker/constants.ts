// ── Game dimensions ──────────────────────────────────────────────────────────

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const PADDLE_HEIGHT = 14;
export const PADDLE_WIDTH = 80;
export const PADDLE_WIDTH_MOBILE = 100;
export const BALL_SIZE = 12;
export const BRICK_ROWS = 6;
export const BRICK_COLS = 8;
export const BRICK_WIDTH = GAME_WIDTH / BRICK_COLS - 4;
export const BRICK_HEIGHT = 22;
export const BRICK_GAP = 4;
export const BALL_SPEED = 4.5;
export const TRAIL_LENGTH = 15;

// ── Types & interfaces ──────────────────────────────────────────────────────

export type BrickColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export interface Brick {
  row: number;
  col: number;
  alive: boolean;
  color: BrickColor;
  hits: number;
  maxHits: number;
  shaking: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  animDelay: number;
}

export interface Particle {
  x: number;
  y: number;
  color: string;
  id: number;
  vx: number;
  vy: number;
  size: number;
}

export interface BrickFlash {
  x: number;
  y: number;
  color: BrickColor;
  id: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  id: number;
  color: string;
}

export interface CollisionFlash {
  x: number;
  y: number;
  id: number;
}

// ── Color mappings ──────────────────────────────────────────────────────────

export const ROW_COLORS: BrickColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

export const COLOR_CLASSES: Record<BrickColor, string> = {
  red: 'bg-red-400 border-red-500',
  orange: 'bg-orange-400 border-orange-500',
  yellow: 'bg-yellow-400 border-yellow-500',
  green: 'bg-green-400 border-green-500',
  blue: 'bg-blue-400 border-blue-500',
  purple: 'bg-purple-400 border-purple-500',
};

export const COLOR_HEX: Record<BrickColor, string> = {
  red: '#f87171',
  orange: '#fb923c',
  yellow: '#facc15',
  green: '#4ade80',
  blue: '#60a5fa',
  purple: '#c084fc',
};

export const COLOR_POINTS: Record<BrickColor, number> = {
  red: 60,
  orange: 50,
  yellow: 40,
  green: 30,
  blue: 20,
  purple: 10,
};
