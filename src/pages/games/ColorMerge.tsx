import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Palette } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { loadBestScore, saveBestScore } from '../../lib/gameScore';

const GRID_SIZE = 4;
const COLORS = [
  { name: 'rose', bg: 'bg-rose-300 dark:bg-rose-400', hex: '#fda4af' },
  { name: 'sky', bg: 'bg-sky-300 dark:bg-sky-400', hex: '#7dd3fc' },
  { name: 'amber', bg: 'bg-amber-300 dark:bg-amber-400', hex: '#fcd34d' },
  { name: 'emerald', bg: 'bg-emerald-300 dark:bg-emerald-400', hex: '#6ee7b7' },
  { name: 'violet', bg: 'bg-violet-300 dark:bg-violet-400', hex: '#c4b5fd' },
  { name: 'orange', bg: 'bg-orange-300 dark:bg-orange-400', hex: '#fdba74' },
];

type Cell = {
  colorIdx: number;
  id: number;
};

type Grid = Cell[][];

let nextCellId = 0;

function randomColorIdx(): number {
  return Math.floor(Math.random() * COLORS.length);
}

function createCell(): Cell {
  return { colorIdx: randomColorIdx(), id: nextCellId++ };
}

function initGrid(): Grid {
  nextCellId = 0;
  const grid: Grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push(createCell());
    }
    grid.push(row);
  }
  return grid;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

function findMatches(grid: Grid): Set<string> {
  const matched = new Set<string>();

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c <= GRID_SIZE - 3; c++) {
      const color = grid[r][c].colorIdx;
      if (color === grid[r][c + 1].colorIdx && color === grid[r][c + 2].colorIdx) {
        matched.add(`${r},${c}`);
        matched.add(`${r},${c + 1}`);
        matched.add(`${r},${c + 2}`);
      }
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r <= GRID_SIZE - 3; r++) {
      const color = grid[r][c].colorIdx;
      if (color === grid[r + 1][c].colorIdx && color === grid[r + 2][c].colorIdx) {
        matched.add(`${r},${c}`);
        matched.add(`${r + 1},${c}`);
        matched.add(`${r + 2},${c}`);
      }
    }
  }

  return matched;
}

function removeMatches(grid: Grid, matched: Set<string>): Grid {
  const newGrid = cloneGrid(grid);
  for (const key of matched) {
    const [r, c] = key.split(',').map(Number);
    newGrid[r][c] = { colorIdx: -1, id: -1 };
  }
  return newGrid;
}

function applyGravity(grid: Grid): Grid {
  const newGrid = cloneGrid(grid);
  for (let c = 0; c < GRID_SIZE; c++) {
    let writeRow = GRID_SIZE - 1;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (newGrid[r][c].colorIdx !== -1) {
        if (writeRow !== r) {
          newGrid[writeRow][c] = newGrid[r][c];
          newGrid[r][c] = { colorIdx: -1, id: -1 };
        }
        writeRow--;
      }
    }
    for (let r = writeRow; r >= 0; r--) {
      newGrid[r][c] = createCell();
    }
  }
  return newGrid;
}

function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function swapCells(grid: Grid, r1: number, c1: number, r2: number, c2: number): Grid {
  const newGrid = cloneGrid(grid);
  const temp = newGrid[r1][c1];
  newGrid[r1][c1] = newGrid[r2][c2];
  newGrid[r2][c2] = temp;
  return newGrid;
}

function hasValidMoves(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (c < GRID_SIZE - 1) {
        const swapped = swapCells(grid, r, c, r, c + 1);
        if (findMatches(swapped).size > 0) return true;
      }
      if (r < GRID_SIZE - 1) {
        const swapped = swapCells(grid, r, c, r + 1, c);
        if (findMatches(swapped).size > 0) return true;
      }
    }
  }
  return false;
}

export default function ColorMerge({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => loadBestScore('colormerge'));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const processingRef = useRef(false);

  const processMatches = useCallback(
    (currentGrid: Grid, currentScore: number) => {
      const matches = findMatches(currentGrid);
      if (matches.size === 0) {
        if (!hasValidMoves(currentGrid)) {
          setGameOver(true);
        }
        processingRef.current = false;
        return;
      }

      const points = matches.size * 10;
      const newScore = currentScore + points;

      setMatchedCells(matches);

      setTimeout(() => {
        const afterRemove = removeMatches(currentGrid, matches);
        const afterGravity = applyGravity(afterRemove);

        setGrid(afterGravity);
        setScore(newScore);
        setMatchedCells(new Set());

        if (newScore > bestScore) {
          setBestScore(newScore);
          saveBestScore('colormerge', newScore);
        }

        setTimeout(() => {
          processMatches(afterGravity, newScore);
        }, 200);
      }, 300);
    },
    [bestScore],
  );

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (processingRef.current || gameOver) return;

      if (!selected) {
        setSelected([r, c]);
        return;
      }

      const [sr, sc] = selected;

      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }

      if (!isAdjacent(sr, sc, r, c)) {
        setSelected([r, c]);
        return;
      }

      processingRef.current = true;
      const swapped = swapCells(grid, sr, sc, r, c);
      const matches = findMatches(swapped);

      if (matches.size === 0) {
        processingRef.current = false;
        setSelected(null);
        return;
      }

      setGrid(swapped);
      setSelected(null);
      setMoves((m) => m + 1);

      setTimeout(() => {
        processMatches(swapped, score);
      }, 150);
    },
    [selected, grid, score, gameOver, processMatches],
  );

  const reset = () => {
    setGrid(initGrid());
    setScore(0);
    setSelected(null);
    setMatchedCells(new Set());
    setGameOver(false);
    setMoves(0);
    processingRef.current = false;
  };

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('色彩拼图', 'Color Merge')}</h1>
            <p className="text-sm text-secondary">
              {t('交换相邻色块，三个连线消除！', 'Swap adjacent tiles, match 3 to clear!')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Palette className="w-3 h-3" />
                {t('分数', 'Score')}
              </div>
              <div className="text-xl font-bold text-primary">{score}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {t('最佳', 'Best')}
              </div>
              <div className="text-xl font-bold text-tertiary">{bestScore}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium">{t('步数', 'Moves')}</div>
            <div className="text-lg font-bold text-primary">{moves}</div>
          </div>
        </div>

        <div className="bg-surface-container-high rounded-2xl p-3 mb-4">
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const isMatched = matchedCells.has(`${r},${c}`);
                const color = cell.colorIdx >= 0 ? COLORS[cell.colorIdx] : COLORS[0];

                return (
                  <motion.button
                    key={cell.id}
                    onClick={() => handleCellClick(r, c)}
                    aria-label={t(
                      `第 ${r + 1} 行第 ${c + 1} 列，${color.name} 色方块${isSelected ? '，已选中' : ''}`,
                      `Row ${r + 1}, column ${c + 1}, ${color.name} block${isSelected ? ', selected' : ''}`,
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                      isMatched
                        ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] }
                        : { scale: 1, opacity: 1 }
                    }
                    transition={
                      isMatched
                        ? { duration: 0.3 }
                        : { type: 'spring', stiffness: 300, damping: 20 }
                    }
                    className={`aspect-square rounded-xl transition-all ${
                      isSelected
                        ? 'ring-3 ring-primary ring-offset-2 ring-offset-surface-container-high scale-105'
                        : ''
                    } ${color.bg}`}
                    style={{
                      boxShadow: isSelected
                        ? '0 0 12px rgba(0,0,0,0.2)'
                        : 'inset 0 -3px 0 rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  />
                );
              }),
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('重新开始', 'Restart')}
          </button>
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-2xl text-center"
            >
              <p className="text-2xl mb-2">🎨</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {t('没有可用的移动了！', 'No more moves!')}
              </p>
              <p className="text-sm text-purple-500 dark:text-purple-400 mb-1">
                {t('得分', 'Score')}: {score}
              </p>
              <p className="text-sm text-purple-500 dark:text-purple-400 mb-4">
                {t('步数', 'Moves')}: {moves}
              </p>
              {score > 0 && score >= bestScore && (
                <p className="text-sm text-purple-500 mb-2">🏆 {t('新纪录！', 'New Record!')}</p>
              )}
              <button
                onClick={reset}
                className="px-6 py-2 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors"
              >
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('点击一个色块，再点击相邻色块交换', 'Tap a tile, then tap an adjacent tile to swap')}
        </div>
      </motion.div>
    </div>
  );
}
