import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Clock, Footprints, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Size = 3 | 4;

const SIZE_CONFIG: Record<Size, { label: [string, string] }> = {
  3: { label: ['3x3', '3x3'] },
  4: { label: ['4x4', '4x4'] },
};

function totalTiles(size: Size) {
  return size * size;
}

function countInversions(tiles: number[]): number {
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] !== 0 && tiles[j] !== 0 && tiles[i] > tiles[j]) {
        inversions++;
      }
    }
  }
  return inversions;
}

function isSolvable(tiles: number[], size: Size): boolean {
  const inversions = countInversions(tiles);
  if (size % 2 === 1) {
    return inversions % 2 === 0;
  } else {
    const emptyRow = Math.floor(tiles.indexOf(0) / size);
    const fromBottom = size - emptyRow;
    return (fromBottom % 2 === 0) === (inversions % 2 === 1);
  }
}

function isSolved(tiles: number[], size: Size): boolean {
  const total = totalTiles(size);
  for (let i = 0; i < total - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[total - 1] === 0;
}

function generatePuzzle(size: Size): number[] {
  const total = totalTiles(size);
  let tiles: number[];
  do {
    tiles = Array.from({ length: total }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles, size) || isSolved(tiles, size));
  return tiles;
}

function loadBestMoves(size: Size): number {
  try { return JSON.parse(localStorage.getItem(`spring_nest_puzzle_best_moves_${size}`) || '0'); } catch { return 0; }
}

function saveBestMoves(size: Size, moves: number) {
  localStorage.setItem(`spring_nest_puzzle_best_moves_${size}`, JSON.stringify(moves));
}

function loadBestTime(size: Size): number {
  try { return JSON.parse(localStorage.getItem(`spring_nest_puzzle_best_time_${size}`) || '0'); } catch { return 0; }
}

function saveBestTime(size: Size, seconds: number) {
  localStorage.setItem(`spring_nest_puzzle_best_time_${size}`, JSON.stringify(seconds));
}

const TILE_COLORS = [
  'bg-pink-200 text-pink-800',
  'bg-rose-200 text-rose-800',
  'bg-fuchsia-200 text-fuchsia-800',
  'bg-purple-200 text-purple-800',
  'bg-violet-200 text-violet-800',
  'bg-indigo-200 text-indigo-800',
  'bg-blue-200 text-blue-800',
  'bg-sky-200 text-sky-800',
  'bg-cyan-200 text-cyan-800',
  'bg-teal-200 text-teal-800',
  'bg-emerald-200 text-emerald-800',
  'bg-green-200 text-green-800',
  'bg-lime-200 text-lime-800',
  'bg-yellow-200 text-yellow-800',
  'bg-amber-200 text-amber-800',
  'bg-orange-200 text-orange-800',
];

export default function NumberPuzzle({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [size, setSize] = useState<Size>(4);
  const [tiles, setTiles] = useState<number[]>(() => generatePuzzle(4));
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [bestMoves, setBestMoves] = useState(() => loadBestMoves(4));
  const [bestTime, setBestTimeVal] = useState(() => loadBestTime(4));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const newGame = useCallback((newSize?: Size) => {
    const s = newSize ?? size;
    clearTimer();
    setTiles(generatePuzzle(s));
    setMoves(0);
    setElapsed(0);
    setStarted(false);
    setWon(false);
    setBestMoves(loadBestMoves(s));
    setBestTimeVal(loadBestTime(s));
    startTimeRef.current = 0;
  }, [size, clearTimer]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, []);

  const handleTileClick = useCallback((index: number) => {
    if (won) return;
    const emptyIndex = tiles.indexOf(0);
    const s = size;

    // Check adjacency
    const row = Math.floor(index / s);
    const col = index % s;
    const emptyRow = Math.floor(emptyIndex / s);
    const emptyCol = emptyIndex % s;

    const isAdjacent =
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1);

    if (!isAdjacent) return;

    // Start timer on first move
    if (!started) {
      setStarted(true);
      startTimer();
    }

    const newTiles = [...tiles];
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
    setTiles(newTiles);
    const newMoves = moves + 1;
    setMoves(newMoves);

    // Check win
    if (isSolved(newTiles, s)) {
      clearTimer();
      const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(finalTime);
      setWon(true);

      // Save best scores
      const currentBestMoves = loadBestMoves(s);
      if (currentBestMoves === 0 || newMoves < currentBestMoves) {
        setBestMoves(newMoves);
        saveBestMoves(s, newMoves);
      }
      const currentBestTime = loadBestTime(s);
      if (currentBestTime === 0 || finalTime < currentBestTime) {
        setBestTimeVal(finalTime);
        saveBestTime(s, finalTime);
      }
    }
  }, [tiles, size, moves, started, won, clearTimer, startTimer]);

  const changeSize = useCallback((newSize: Size) => {
    setSize(newSize);
    clearTimer();
    setTiles(generatePuzzle(newSize));
    setMoves(0);
    setElapsed(0);
    setStarted(false);
    setWon(false);
    setBestMoves(loadBestMoves(newSize));
    setBestTimeVal(loadBestTime(newSize));
    startTimeRef.current = 0;
  }, [clearTimer]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[44px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('数字华容道', 'Number Puzzle')}</h1>
            <p className="text-sm text-secondary">{t('按顺序排列数字', 'Arrange numbers in order')}</p>
          </div>
        </div>

        {/* Size Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          {([3, 4] as Size[]).map(s => (
            <button
              key={s}
              onClick={() => changeSize(s)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all min-h-[44px] ${
                size === s
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
              }`}
            >
              {t(...SIZE_CONFIG[s].label)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-3 mb-4">
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1"><Footprints className="w-3 h-3" />{t('步数', 'Moves')}</div>
            <div className="text-xl font-bold text-primary tabular-nums">{moves}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{t('用时', 'Time')}</div>
            <div className="text-xl font-bold text-primary tabular-nums">{formatTime(elapsed)}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳步数', 'Best Moves')}</div>
            <div className="text-xl font-bold text-tertiary tabular-nums">{bestMoves || '—'}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳用时', 'Best Time')}</div>
            <div className="text-xl font-bold text-tertiary tabular-nums">{bestTime > 0 ? formatTime(bestTime) : '—'}</div>
          </div>
        </div>

        {/* Puzzle Grid */}
        <div className="bg-surface-container-high rounded-2xl p-3 mb-4">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {tiles.map((val, i) => {
              const isEmpty = val === 0;
              return (
                <motion.button
                  key={`${size}-${i}-${val}`}
                  onClick={() => handleTileClick(i)}
                  whileTap={isEmpty ? {} : { scale: 0.92 }}
                  className={`aspect-square rounded-xl font-extrabold text-lg sm:text-2xl flex items-center justify-center transition-colors min-h-[44px] ${
                    isEmpty
                      ? 'bg-surface-container-lowest/30 cursor-default'
                      : `${TILE_COLORS[val - 1] || 'bg-surface-container-lowest text-on-surface'} cursor-pointer hover:opacity-90`
                  }`}
                  disabled={isEmpty || won}
                >
                  {isEmpty ? '' : val}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => newGame()}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('新游戏', 'New Game')}
          </button>
        </div>

        {/* Win overlay */}
        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
            >
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-xl font-bold text-green-600 mb-2">{t('恭喜完成！', 'Congratulations!')}</p>
              <p className="text-sm text-green-500 mb-1">{t('步数', 'Moves')}: {moves}</p>
              <p className="text-sm text-green-500 mb-4">{t('用时', 'Time')}: {formatTime(elapsed)}</p>
              <button onClick={() => newGame()} className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors min-h-[44px]">
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
