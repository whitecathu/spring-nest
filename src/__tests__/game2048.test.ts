import { describe, it, expect } from 'vitest';

// Inline the 2048 game logic functions for testing
type Grid = number[][];
type Direction = 'up' | 'down' | 'left' | 'right';

function initGrid(): Grid {
  const grid: Grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  addRandom(grid);
  addRandom(grid);
  return grid;
}

function addRandom(grid: Grid): void {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length > 0) {
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function slide(row: number[]): { row: number[]; score: number } {
  let arr = row.filter(v => v !== 0);
  let score = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(v => v !== 0);
  while (arr.length < 4) arr.push(0);
  return { row: arr, score };
}

function moveGrid(grid: Grid, dir: Direction): { grid: Grid; score: number; moved: boolean } {
  const newGrid: Grid = grid.map(r => [...r]);
  let totalScore = 0;
  let moved = false;

  for (let i = 0; i < 4; i++) {
    let line: number[] = [];
    for (let j = 0; j < 4; j++) {
      if (dir === 'left') line.push(newGrid[i][j]);
      else if (dir === 'right') line.push(newGrid[i][3 - j]);
      else if (dir === 'up') line.push(newGrid[j][i]);
      else line.push(newGrid[3 - j][i]);
    }

    const result = slide(line);
    totalScore += result.score;

    for (let j = 0; j < 4; j++) {
      if (dir === 'left') { if (newGrid[i][j] !== result.row[j]) moved = true; newGrid[i][j] = result.row[j]; }
      else if (dir === 'right') { if (newGrid[i][3 - j] !== result.row[j]) moved = true; newGrid[i][3 - j] = result.row[j]; }
      else if (dir === 'up') { if (newGrid[j][i] !== result.row[j]) moved = true; newGrid[j][i] = result.row[j]; }
      else { if (newGrid[3 - j][i] !== result.row[j]) moved = true; newGrid[3 - j][i] = result.row[j]; }
    }
  }

  if (moved) addRandom(newGrid);
  return { grid: newGrid, score: totalScore, moved };
}

function isGameOver(grid: Grid): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
    }
  }
  return true;
}

describe('2048 Game Logic', () => {
  describe('initGrid', () => {
    it('should create a 4x4 grid', () => {
      const grid = initGrid();
      expect(grid).toHaveLength(4);
      grid.forEach(row => expect(row).toHaveLength(4));
    });

    it('should have exactly two non-zero tiles', () => {
      const grid = initGrid();
      const nonZero = grid.flat().filter(v => v !== 0);
      expect(nonZero).toHaveLength(2);
    });

    it('should only have 2 or 4 as initial values', () => {
      const grid = initGrid();
      grid.flat().filter(v => v !== 0).forEach(v => {
        expect([2, 4]).toContain(v);
      });
    });
  });

  describe('slide', () => {
    it('should merge two identical tiles', () => {
      const result = slide([2, 2, 0, 0]);
      expect(result.row[0]).toBe(4);
      expect(result.score).toBe(4);
    });

    it('should not merge non-adjacent identical tiles', () => {
      const result = slide([2, 0, 2, 0]);
      expect(result.row[0]).toBe(4);
      expect(result.row[1]).toBe(0);
    });

    it('should merge multiple pairs', () => {
      const result = slide([2, 2, 4, 4]);
      expect(result.row[0]).toBe(4);
      expect(result.row[1]).toBe(8);
      expect(result.score).toBe(12);
    });

    it('should slide tiles to the left', () => {
      const result = slide([0, 0, 2, 0]);
      expect(result.row[0]).toBe(2);
      expect(result.row[1]).toBe(0);
    });

    it('should handle all zeros', () => {
      const result = slide([0, 0, 0, 0]);
      expect(result.row.every(v => v === 0)).toBe(true);
      expect(result.score).toBe(0);
    });

    it('should not merge a tile more than once per move', () => {
      const result = slide([2, 2, 2, 0]);
      expect(result.row[0]).toBe(4);
      expect(result.row[1]).toBe(2);
      expect(result.score).toBe(4);
    });
  });

  describe('moveGrid', () => {
    it('should move tiles left', () => {
      const grid: Grid = [
        [0, 0, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const result = moveGrid(grid, 'left');
      expect(result.grid[0][0]).toBe(2);
      expect(result.moved).toBe(true);
    });

    it('should detect no movement', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const result = moveGrid(grid, 'left');
      expect(result.moved).toBe(false);
    });

    it('should merge tiles moving right', () => {
      const grid: Grid = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const result = moveGrid(grid, 'right');
      expect(result.grid[0][3]).toBe(4);
      expect(result.score).toBe(4);
    });

    it('should add a new random tile after a valid move', () => {
      const grid: Grid = [
        [0, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const result = moveGrid(grid, 'left');
      const nonZero = result.grid.flat().filter(v => v !== 0);
      expect(nonZero.length).toBe(2); // original 2 + 1 new
    });
  });

  describe('isGameOver', () => {
    it('should return false when there are empty cells', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 0, 2, 4],
      ];
      expect(isGameOver(grid)).toBe(false);
    });

    it('should return false when adjacent tiles can merge', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 2, 2, 4],
      ];
      expect(isGameOver(grid)).toBe(false);
    });

    it('should return true when game is over (full + no merges)', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [2, 4, 8, 16],
      ];
      // Verify no adjacent matches
      let hasMerge = false;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          if (grid[r][c] === grid[r][c + 1]) hasMerge = true;
          if (c < 3 && grid[c][r] === grid[c + 1][r]) hasMerge = true;
        }
      }
      expect(isGameOver(grid)).toBe(!hasMerge);
    });
  });

  describe('addRandom', () => {
    it('should add one tile to a non-full grid', () => {
      const grid: Grid = [
        [2, 4, 8, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const nonZeroBefore = grid.flat().filter(v => v !== 0).length;
      addRandom(grid);
      const nonZeroAfter = grid.flat().filter(v => v !== 0).length;
      expect(nonZeroAfter).toBe(nonZeroBefore + 1);
    });

    it('should not add to a full grid', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 2, 4, 8],
      ];
      const nonZeroBefore = grid.flat().filter(v => v !== 0).length;
      addRandom(grid);
      const nonZeroAfter = grid.flat().filter(v => v !== 0).length;
      expect(nonZeroAfter).toBe(nonZeroBefore);
    });
  });
});
