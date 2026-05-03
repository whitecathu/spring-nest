import { useState, useEffect, useCallback, useRef, type TouchEvent as ReactTouchEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Undo2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

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

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_2048_best') || '0'); } catch { return 0; }
}

function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_2048_best', JSON.stringify(score));
}

const tileColors: Record<number, string> = {
  2: 'bg-[#eee4da] text-[#776e65]',
  4: 'bg-[#ede0c8] text-[#776e65]',
  8: 'bg-[#f2b179] text-white',
  16: 'bg-[#f59563] text-white',
  32: 'bg-[#f67c5f] text-white',
  64: 'bg-[#f65e3b] text-white',
  128: 'bg-[#edcf72] text-white',
  256: 'bg-[#edcc61] text-white',
  512: 'bg-[#edc850] text-white',
  1024: 'bg-[#edc53f] text-white',
  2048: 'bg-[#edc22e] text-white',
  4096: 'bg-[#3c3a32] text-white',
  8192: 'bg-[#3c3a32] text-white',
};

export default function Game2048({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [gameOver, setGameOver] = useState(false);
  const [prevGrid, setPrevGrid] = useState<Grid | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  const handleMove = useCallback((dir: Direction) => {
    if (gameOver) return;
    const result = moveGrid(grid, dir);
    if (result.moved) {
      setPrevGrid(grid.map(r => [...r]));
      setPrevScore(score);
      setGrid(result.grid);
      const newScore = score + result.score;
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        saveBestScore(newScore);
      }
      if (isGameOver(result.grid)) {
        setGameOver(true);
      }
    }
  }, [grid, score, bestScore, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      };
      if (map[e.key]) {
        e.preventDefault();
        handleMove(map[e.key]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleMove]);

  const handleTouchStart = (e: ReactTouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: ReactTouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
  };

  const reset = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setPrevGrid(null);
    setPrevScore(null);
  };

  const undo = () => {
    if (prevGrid && prevScore !== null) {
      setGrid(prevGrid);
      setScore(prevScore);
      setGameOver(false);
      setPrevGrid(null);
      setPrevScore(null);
    }
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">2048</h1>
            <p className="text-sm text-secondary">{t('合并方块，挑战 2048！', 'Merge tiles to reach 2048!')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div className="text-xl font-bold text-primary">{score}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
              <div className="text-xl font-bold text-tertiary">{bestScore}</div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div
          className="bg-surface-container-high rounded-2xl p-3 mb-4 touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-2">
            {grid.flat().map((val, i) => (
              <motion.div
                key={`${i}-${val}`}
                initial={val ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                className={`aspect-square rounded-xl flex items-center justify-center font-extrabold text-2xl sm:text-3xl ${
                  tileColors[val] || 'bg-surface-container-lowest/50'
                }`}
              >
                {val || ''}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('重新开始', 'Restart')}
          </button>
          <button
            onClick={undo}
            disabled={!prevGrid}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-5 h-5" />
            {t('撤回', 'Undo')}
          </button>
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-red-50 border border-red-200 rounded-2xl text-center"
            >
              <p className="text-xl font-bold text-red-500 mb-2">{t('游戏结束', 'Game Over')}</p>
              <p className="text-sm text-red-400 mb-4">{t('最终得分', 'Final Score')}: {score}</p>
              <button onClick={reset} className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors">
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('方向键或滑动控制', 'Arrow keys or swipe to control')}
        </div>
      </motion.div>
    </div>
  );
}
