import { useState, useEffect, useCallback, useRef, type TouchEvent as ReactTouchEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Undo2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Grid = number[][];
type Direction = 'up' | 'down' | 'left' | 'right';

interface MergePopup {
  id: number;
  row: number;
  col: number;
  value: number;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '⭐', '🌟', '💫', '🏆', '🥳'];

let mergePopupId = 0;
let confettiId = 0;

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

function slide(row: number[]): { row: number[]; score: number; mergeIndices: number[] } {
  let arr = row.filter(v => v !== 0);
  let score = 0;
  const mergeIndices: number[] = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
      mergeIndices.push(i);
    }
  }
  arr = arr.filter(v => v !== 0);
  while (arr.length < 4) arr.push(0);
  return { row: arr, score, mergeIndices };
}

function moveGrid(grid: Grid, dir: Direction): { grid: Grid; score: number; moved: boolean; merges: MergePopup[] } {
  const newGrid: Grid = grid.map(r => [...r]);
  let totalScore = 0;
  let moved = false;
  const merges: MergePopup[] = [];

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

    // Track merge positions: the result row has the merged value at the compressed index
    // We need to figure out which cell in the output row received the merge
    // mergeIndices are indices in the filtered array before padding, which map to final positions
    // after filtering and pushing zeros, merge index k maps to position k in the result
    for (const mi of result.mergeIndices) {
      let mergeRow = -1;
      let mergeCol = -1;
      if (dir === 'left') { mergeRow = i; mergeCol = mi; }
      else if (dir === 'right') { mergeRow = i; mergeCol = 3 - mi; }
      else if (dir === 'up') { mergeRow = mi; mergeCol = i; }
      else { mergeRow = 3 - mi; mergeCol = i; }
      merges.push({ id: mergePopupId++, row: mergeRow, col: mergeCol, value: result.row[mi] });
    }

    for (let j = 0; j < 4; j++) {
      if (dir === 'left') { if (newGrid[i][j] !== result.row[j]) moved = true; newGrid[i][j] = result.row[j]; }
      else if (dir === 'right') { if (newGrid[i][3 - j] !== result.row[j]) moved = true; newGrid[i][3 - j] = result.row[j]; }
      else if (dir === 'up') { if (newGrid[j][i] !== result.row[j]) moved = true; newGrid[j][i] = result.row[j]; }
      else { if (newGrid[3 - j][i] !== result.row[j]) moved = true; newGrid[3 - j][i] = result.row[j]; }
    }
  }

  if (moved) addRandom(newGrid);
  return { grid: newGrid, score: totalScore, moved, merges };
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

function hasReached2048(grid: Grid): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] >= 2048) return true;
    }
  }
  return false;
}

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_2048_best') || '0'); } catch { return 0; }
}

function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_2048_best', JSON.stringify(score));
}

// ── Tile visual config ──────────────────────────────────────────
interface TileStyle {
  bg: string;
  text: string;
  glow?: string;
  fontSize: string;
}

function getTileStyle(val: number): TileStyle {
  const styles: Record<number, TileStyle> = {
    2:    { bg: 'linear-gradient(135deg, #f0ede8 0%, #eee4da 100%)', text: '#776e65', fontSize: 'text-2xl sm:text-3xl' },
    4:    { bg: 'linear-gradient(135deg, #f2e8d8 0%, #ede0c8 100%)', text: '#776e65', fontSize: 'text-2xl sm:text-3xl' },
    8:    { bg: 'linear-gradient(135deg, #f5c28a 0%, #f2b179 100%)', text: '#ffffff', fontSize: 'text-2xl sm:text-3xl' },
    16:   { bg: 'linear-gradient(135deg, #f8a573 0%, #f59563 100%)', text: '#ffffff', fontSize: 'text-2xl sm:text-3xl' },
    32:   { bg: 'linear-gradient(135deg, #f98d70 0%, #f67c5f 100%)', text: '#ffffff', fontSize: 'text-2xl sm:text-3xl' },
    64:   { bg: 'linear-gradient(135deg, #f8704c 0%, #f65e3b 100%)', text: '#ffffff', fontSize: 'text-2xl sm:text-3xl' },
    128:  { bg: 'linear-gradient(135deg, #f0da7e 0%, #edcf72 100%)', text: '#ffffff', glow: '0 0 20px 4px rgba(237,207,114,0.5)', fontSize: 'text-xl sm:text-2xl' },
    256:  { bg: 'linear-gradient(135deg, #f0d76d 0%, #edcc61 100%)', text: '#ffffff', glow: '0 0 22px 5px rgba(237,204,97,0.55)', fontSize: 'text-xl sm:text-2xl' },
    512:  { bg: 'linear-gradient(135deg, #f0d35c 0%, #edc850 100%)', text: '#ffffff', glow: '0 0 24px 6px rgba(237,200,80,0.6)', fontSize: 'text-xl sm:text-2xl' },
    1024: { bg: 'linear-gradient(135deg, #f0cf4b 0%, #edc53f 100%)', text: '#ffffff', glow: '0 0 26px 7px rgba(237,197,63,0.65)', fontSize: 'text-lg sm:text-xl' },
    2048: { bg: 'linear-gradient(135deg, #f0cc38 0%, #edc22e 100%)', text: '#ffffff', glow: '0 0 30px 8px rgba(237,194,46,0.7)', fontSize: 'text-lg sm:text-xl' },
    4096: { bg: 'linear-gradient(135deg, #4a4840 0%, #3c3a32 100%)', text: '#ffffff', glow: '0 0 28px 8px rgba(60,58,50,0.6)', fontSize: 'text-lg sm:text-xl' },
    8192: { bg: 'linear-gradient(135deg, #4a4840 0%, #3c3a32 100%)', text: '#ffffff', glow: '0 0 30px 10px rgba(60,58,50,0.7)', fontSize: 'text-base sm:text-lg' },
  };
  return styles[val] || { bg: 'transparent', text: 'transparent', fontSize: 'text-2xl sm:text-3xl' };
}

export default function Game2048({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [gameOver, setGameOver] = useState(false);
  const [prevGrid, setPrevGrid] = useState<Grid | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [mergePopups, setMergePopups] = useState<MergePopup[]>([]);
  const [showWin, setShowWin] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const winTriggeredRef = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);

  // ── Confetti burst ────────────────────────────────────────────
  const spawnConfetti = useCallback((count: number = 30) => {
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const speed = 3 + Math.random() * 6;
      particles.push({
        id: confettiId++,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 40 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
        size: 14 + Math.random() * 14,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720,
      });
    }
    setConfetti(prev => [...prev, ...particles]);
    setTimeout(() => {
      setConfetti(prev => prev.filter(p => !particles.find(np => np.id === p.id)));
    }, 2000);
  }, []);

  const handleMove = useCallback((dir: Direction) => {
    if (gameOver || showWin) return;
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

      // Show merge popups
      if (result.merges.length > 0) {
        setMergePopups(result.merges);
        setTimeout(() => setMergePopups([]), 800);
      }

      // Win condition
      if (!winTriggeredRef.current && hasReached2048(result.grid)) {
        winTriggeredRef.current = true;
        setShowWin(true);
        spawnConfetti(35);
      }

      if (isGameOver(result.grid)) {
        setGameOver(true);
      }
    }
  }, [grid, score, bestScore, gameOver, showWin, spawnConfetti]);

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
    if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
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
    setMergePopups([]);
    setShowWin(false);
    setConfetti([]);
    winTriggeredRef.current = false;
  };

  const continueAfterWin = () => {
    setShowWin(false);
  };

  const undo = () => {
    if (prevGrid && prevScore !== null) {
      setGrid(prevGrid);
      setScore(prevScore);
      setGameOver(false);
      setPrevGrid(null);
      setPrevScore(null);
      setMergePopups([]);
    }
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <motion.button onClick={onBack} whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px]">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">2048</h1>
            <p className="text-sm text-secondary">{t('合并方块，挑战 2048！', 'Merge tiles to reach 2048!')}</p>
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }} className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <motion.div
                key={score}
                initial={{ scale: 1.5, color: '#f59563' }}
                animate={{ scale: 1, color: 'var(--color-primary)' }}
                transition={{ type: 'spring', stiffness: 600, damping: 10 }}
                className="text-xl font-bold tabular-nums"
              >
                {score}
              </motion.div>
            </motion.div>
            <motion.div whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }} className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
              <div className="text-xl font-bold text-tertiary tabular-nums">{bestScore}</div>
            </motion.div>
          </div>
        </div>

        {/* Grid */}
        <div
          className="relative bg-surface-container-high rounded-2xl p-3 mb-4 touch-none"
          style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15), inset 0 -1px 4px rgba(255,255,255,0.05)' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-[6px]">
            {grid.flat().map((val, i) => {
              const ts = getTileStyle(val);
              const isHighValue = val >= 128;
              return (
                <motion.div
                  key={`${i}-${val}`}
                  initial={val ? { scale: 0, rotate: -10 } : false}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className={`aspect-square rounded-xl flex items-center justify-center font-extrabold relative ${ts.fontSize}`}
                  style={{
                    background: val ? ts.bg : 'rgba(238,228,218,0.12)',
                    color: val ? ts.text : 'transparent',
                    boxShadow: val
                      ? (isHighValue && ts.glow
                          ? `${ts.glow}, 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)`
                          : '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)')
                      : 'none',
                  }}
                >
                  {val || ''}
                </motion.div>
              );
            })}
          </div>

          {/* Merge score popup layer */}
          <div className="absolute inset-3 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {mergePopups.map(mp => {
                const cellSize = 100 / 4;
                const x = mp.col * cellSize + cellSize / 2;
                const y = mp.row * cellSize + cellSize / 2;
                return (
                  <motion.div
                    key={mp.id}
                    initial={{ left: `${x}%`, top: `${y}%`, opacity: 1, scale: 0.6, x: '-50%', y: '-50%' }}
                    animate={{ top: `${y - 18}%`, opacity: 0, scale: 1.3, x: '-50%', y: '-50%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute font-black text-lg drop-shadow-md"
                    style={{ color: '#f59563', textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 8px rgba(245,149,99,0.4)' }}
                  >
                    +{mp.value}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Confetti layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {confetti.map(p => (
              <motion.div
                key={p.id}
                initial={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  scale: 1,
                  opacity: 1,
                  rotate: p.rotation,
                }}
                animate={{
                  left: `${p.x + p.vx * 6}%`,
                  top: `${p.y + p.vy * 6}%`,
                  scale: 0,
                  opacity: 0,
                  rotate: p.rotation + p.rotationSpeed,
                }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="absolute text-center"
                style={{ fontSize: `${p.size}px` }}
              >
                {p.emoji}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('重新开始', 'Restart')}
          </motion.button>
          <motion.button
            onClick={undo}
            disabled={!prevGrid}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-5 h-5" />
            {t('撤回', 'Undo')}
          </motion.button>
        </div>

        {/* Win celebration */}
        <AnimatePresence>
          {showWin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl text-center"
            >
              <motion.p
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.1 }}
                className="text-4xl mb-2"
              >
                🏆
              </motion.p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">{t('恭喜通关！', 'You Win!')}</p>
              <p className="text-lg font-bold text-amber-500 mb-4">{t('得分', 'Score')}: {score}</p>
              <div className="flex justify-center gap-3">
                <motion.button
                  onClick={continueAfterWin}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="px-6 py-3 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors"
                >
                  {t('继续挑战', 'Keep Going')}
                </motion.button>
                <motion.button
                  onClick={reset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all"
                >
                  {t('再来一局', 'Play Again')}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game over panel */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="mt-6 p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-700/30 rounded-2xl text-center"
            >
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.1 }}
                className="text-3xl mb-2"
              >
                😵
              </motion.p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400 mb-1">{t('游戏结束', 'Game Over')}</p>
              <p className="text-xl font-bold text-red-400 mb-1">{t('最终得分', 'Final Score')}: {score}</p>
              {score > 0 && score === bestScore && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                  className="text-sm text-orange-500 mb-4"
                >
                  🏆 {t('新纪录！', 'New Record!')}
                </motion.p>
              )}
              <motion.button
                onClick={reset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
              >
                {t('再来一局', 'Play Again')}
              </motion.button>
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
