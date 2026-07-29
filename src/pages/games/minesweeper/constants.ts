export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: Record<
  Difficulty,
  { rows: number; cols: number; mines: number; label: [string, string]; desc: [string, string] }
> = {
  easy: {
    rows: 9,
    cols: 9,
    mines: 10,
    label: ['简单', 'Easy'],
    desc: ['9×9，10 颗雷', '9×9, 10 mines'],
  },
  medium: {
    rows: 16,
    cols: 16,
    mines: 40,
    label: ['中等', 'Medium'],
    desc: ['16×16，40 颗雷', '16×16, 40 mines'],
  },
  hard: {
    rows: 16,
    cols: 30,
    mines: 99,
    label: ['困难', 'Hard'],
    desc: ['16×30，99 颗雷', '16×30, 99 mines'],
  },
};

export function minesweeperKey(d: Difficulty): string {
  return `spring_nest_minesweeper_best_${d}`;
}

export const ADJACENT_COLORS = [
  '',
  'text-blue-600',
  'text-green-600',
  'text-red-600',
  'text-purple-700',
  'text-yellow-700',
  'text-cyan-600',
  'text-gray-800',
  'text-gray-500',
];

export const REVEALED_EMPTY_BG = 'bg-surface-container-lowest/80';
export const UNREVEALED_BG = 'bg-gradient-to-br from-surface-container-low to-surface-container';

// Animation particle types
export type DebrisParticle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotate: number;
  duration: number;
};

export type ConfettiParticle = {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  shape: 'rect' | 'circle' | 'triangle';
  spin: number;
  xDrift: number;
  duration: number;
};

export type RippleCell = { r: number; c: number; id: number };

export const DEBRIS_COLORS = [
  '#ef4444',
  '#f97316',
  '#fbbf24',
  '#78716c',
  '#a8a29e',
  '#dc2626',
  '#e879f9',
  '#22d3ee',
  '#a3e635',
  '#f472b6',
  '#facc15',
  '#38bdf8',
];

export const CONFETTI_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#eab308',
  '#f97316',
  '#06b6d4',
  '#d946ef',
  '#84cc16',
];

export const CONFETTI_SHAPES: ConfettiParticle['shape'][] = ['rect', 'circle', 'triangle'];
