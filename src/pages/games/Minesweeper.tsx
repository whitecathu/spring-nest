import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Timer, Flag, Bomb } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Difficulty = 'easy' | 'medium' | 'hard';
type CellState = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };
type DebrisParticle = {
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
type ConfettiParticle = {
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
type RippleCell = { r: number; c: number; id: number };

const DIFFICULTIES: Record<
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

function createBoard(
  rows: number,
  cols: number,
  mines: number,
  firstR: number,
  firstC: number,
): CellState[][] {
  const board: CellState[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  );

  // Place mines, avoiding first click and its neighbors
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1) continue;
    if (board[r][c].mine) continue;
    board[r][c].mine = true;
    placed++;
  }

  // Calculate adjacent counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr,
            nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }

  return board;
}

function floodFill(board: CellState[][], r: number, c: number): void {
  const rows = board.length,
    cols = board[0].length;
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  if (board[r][c].revealed || board[r][c].flagged) return;
  board[r][c].revealed = true;
  if (board[r][c].adjacent === 0 && !board[r][c].mine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        floodFill(board, r + dr, c + dc);
      }
    }
  }
}

function checkWin(board: CellState[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.mine && !cell.revealed) return false;
    }
  }
  return true;
}

function loadBestTime(d: Difficulty): number {
  try {
    return JSON.parse(localStorage.getItem(`spring_nest_minesweeper_best_${d}`) || '0');
  } catch {
    return 0;
  }
}

function saveBestTime(d: Difficulty, time: number) {
  localStorage.setItem(`spring_nest_minesweeper_best_${d}`, JSON.stringify(time));
}

const ADJACENT_COLORS = [
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

const REVEALED_EMPTY_BG = 'bg-surface-container-lowest/80';
const UNREVEALED_BG = 'bg-gradient-to-br from-surface-container-low to-surface-container';

interface CellProps {
  r: number;
  c: number;
  cell: CellState;
  cellSize: string;
  isAnimating: boolean;
  animDelay: number;
  isBoom: boolean;
  isRipple: boolean;
  isPressed: boolean;
  onTouchStart: (r: number, c: number, e: React.TouchEvent) => void;
  onTouchEnd: (r: number, c: number, e: React.TouchEvent) => void;
  onClick: (r: number, c: number) => void;
  onContextMenu: (r: number, c: number, e: React.MouseEvent) => void;
}

const GameCell = memo(function GameCell({
  r,
  c,
  cell,
  cellSize,
  isAnimating,
  animDelay,
  isBoom,
  isRipple,
  isPressed,
  onTouchStart,
  onTouchEnd,
  onClick,
  onContextMenu,
}: CellProps) {
  let content = '';
  let contentClass = '';
  let bgClass = `${UNREVEALED_BG} hover:bg-surface-variant active:bg-surface-variant`;
  let stateLabel = 'hidden';

  if (cell.revealed) {
    if (cell.mine) {
      content = '💥';
      bgClass = 'bg-red-100';
      stateLabel = 'mine revealed';
    } else if (cell.adjacent > 0) {
      content = String(cell.adjacent);
      contentClass = ADJACENT_COLORS[cell.adjacent] || '';
      bgClass = REVEALED_EMPTY_BG;
      stateLabel = `${cell.adjacent} adjacent mines`;
    } else {
      bgClass = REVEALED_EMPTY_BG;
      stateLabel = 'empty revealed';
    }
  } else if (cell.flagged) {
    content = '🚩';
    bgClass = 'bg-yellow-100 hover:bg-yellow-200';
    stateLabel = 'flagged';
  }

  return (
    <motion.button
      onTouchStart={(e) => onTouchStart(r, c, e)}
      onTouchEnd={(e) => onTouchEnd(r, c, e)}
      onClick={() => onClick(r, c)}
      onContextMenu={(e) => onContextMenu(r, c, e)}
      whileTap={{ scale: 0.9 }}
      initial={isAnimating ? { scale: 0.3, opacity: 0 } : false}
      animate={
        isAnimating
          ? { scale: [0.3, 1.12, 0.92, 1.04, 0.98, 1], opacity: 1 }
          : isBoom
            ? {
                backgroundColor: ['#ffffff', '#ef4444', '#fca5a5', '#fecaca'],
                scale: [1, 1.15, 1.05, 1],
              }
            : {}
      }
      transition={
        isAnimating
          ? { delay: animDelay / 1000, type: 'spring', stiffness: 400, damping: 12 }
          : isBoom
            ? { duration: 0.6, times: [0, 0.2, 0.5, 1] }
            : { type: 'spring', stiffness: 400, damping: 12 }
      }
      className={`${cellSize} rounded flex items-center justify-center font-bold transition-colors ${bgClass} ${contentClass} relative overflow-hidden`}
      aria-label={`Minesweeper row ${r + 1}, column ${c + 1}, ${stateLabel}`}
      aria-pressed={cell.flagged}
    >
      {content}
      {isRipple && (
        <motion.span
          className="absolute inset-0 bg-white/40 rounded"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
      {/* Haptic-like visual press feedback */}
      {isPressed && (
        <motion.span
          className="absolute inset-0 bg-white/30 rounded pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0.3] }}
          transition={{ duration: 0.15 }}
        />
      )}
    </motion.button>
  );
});

export default function Minesweeper({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<CellState[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [minesLeft, setMinesLeft] = useState(0);
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => loadBestTime(difficulty));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const boardCreatedRef = useRef(false);
  const [flagMode, setFlagMode] = useState<'reveal' | 'flag'>('reveal');
  const timeRef = useRef(0);
  const [cellAnimDelays, setCellAnimDelays] = useState<Map<string, number>>(new Map());
  const [boardShake, setBoardShake] = useState(0);
  const [boomCell, setBoomCell] = useState<{ r: number; c: number } | null>(null);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [whiteFlash, setWhiteFlash] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [debris, setDebris] = useState<DebrisParticle[]>([]);
  const [boardGlow, setBoardGlow] = useState(false);
  const [mineCounterPulse, setMineCounterPulse] = useState(false);
  const [timerTick, setTimerTick] = useState(false);
  const [rippleCells, setRippleCells] = useState<RippleCell[]>([]);
  const [pressCell, setPressCell] = useState<{ r: number; c: number } | null>(null);
  const rippleIdRef = useRef(0);
  const prevMinesLeftRef = useRef(minesLeft);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const startGame = useCallback(() => {
    clearTimer();
    const cfg = DIFFICULTIES[difficulty];
    // Create empty board (no mines yet, placed on first click)
    const empty: CellState[][] = Array.from({ length: cfg.rows }, () =>
      Array.from({ length: cfg.cols }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      })),
    );
    setBoard(empty);
    setGameState('idle');
    setMinesLeft(cfg.mines);
    setTime(0);
    boardCreatedRef.current = false;
    setFlagMode('reveal');
    timeRef.current = 0;
    setCellAnimDelays(new Map());
    setBoardShake(0);
    setBoomCell(null);
    setConfetti([]);
    setWhiteFlash(false);
    setRedFlash(false);
    setDebris([]);
    setBoardGlow(false);
    setMineCounterPulse(false);
    setTimerTick(false);
    setRippleCells([]);
    setBestTime(loadBestTime(difficulty));
  }, [difficulty, clearTimer]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleReveal = useCallback(
    (r: number, c: number) => {
      setBoard((prev) => {
        if (prev.length === 0) return prev;
        const cell = prev[r][c];
        if (cell.revealed || cell.flagged) return prev;

        let currentBoard = prev;

        // First click: create board with mines
        if (!boardCreatedRef.current) {
          const cfg = DIFFICULTIES[difficulty];
          currentBoard = createBoard(cfg.rows, cfg.cols, cfg.mines, r, c);
          boardCreatedRef.current = true;
          setGameState('playing');
          clearTimer();
          setTime(0);
          timeRef.current = 0;
          timerRef.current = setInterval(
            () =>
              setTime((t) => {
                timeRef.current = t + 1;
                return t + 1;
              }),
            1000,
          );
        }

        // Deep copy
        const newBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })));

        if (newBoard[r][c].mine) {
          // Triggered mine: white flash, then red flash, then show explosion
          newBoard[r][c].revealed = true;
          setBoomCell({ r, c });
          setWhiteFlash(true);
          // Intensifying shake: start mild (set 1), ramp up (set 2), then settle (set 3)
          setBoardShake(1);
          setTimeout(() => {
            setWhiteFlash(false);
            setRedFlash(true);
          }, 80);
          setTimeout(() => setBoardShake(2), 120);
          setTimeout(() => setBoardShake(3), 300);
          setTimeout(() => setBoardShake(0), 650);
          setTimeout(() => setBoomCell(null), 650);
          setTimeout(() => setRedFlash(false), 400);

          // Spawn larger, more colorful debris particles from the clicked mine
          const debrisColors = [
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
          const newDebris: DebrisParticle[] = Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const speed = 50 + Math.random() * 150;
            return {
              id: i,
              x: c,
              y: r,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: debrisColors[i % debrisColors.length],
              size: 4 + Math.random() * 8,
              rotate: Math.random() * 720 - 360,
              duration: 0.8 + Math.random() * 0.5,
            };
          });
          setDebris(newDebris);
          setTimeout(() => setDebris([]), 1400);

          // Collect all other mines with distance from triggered mine (Euclidean for radial wave)
          const mines: { r: number; c: number; dist: number }[] = [];
          for (let ri = 0; ri < newBoard.length; ri++) {
            for (let ci = 0; ci < newBoard[ri].length; ci++) {
              if (newBoard[ri][ci].mine && !(ri === r && ci === c)) {
                const dist = Math.sqrt(Math.pow(ri - r, 2) + Math.pow(ci - c, 2));
                mines.push({ r: ri, c: ci, dist });
              }
            }
          }

          // Sort by distance and reveal with delay (clear radial wave)
          mines.sort((a, b) => a.dist - b.dist);
          mines.forEach((m, i) => {
            setTimeout(
              () => {
                setBoard((prev) => {
                  const nb = prev.map((row) => row.map((cell) => ({ ...cell })));
                  nb[m.r][m.c].revealed = true;
                  return nb;
                });
              },
              300 + i * 40,
            );
          });

          clearTimer();
          setTimeout(() => setGameState('lost'), mines.length * 40 + 1000);
          return newBoard;
        }

        floodFill(newBoard, r, c);

        // Track newly revealed cells for wave-like cascade animation
        const newlyRevealed = new Map<string, number>();
        for (let ri = 0; ri < newBoard.length; ri++) {
          for (let ci = 0; ci < newBoard[ri].length; ci++) {
            if (newBoard[ri][ci].revealed && !prev[ri]?.[ci]?.revealed) {
              const dist = Math.abs(ri - r) + Math.abs(ci - c);
              newlyRevealed.set(`${ri}-${ci}`, dist * 35);
            }
          }
        }
        if (newlyRevealed.size > 0) {
          setCellAnimDelays(newlyRevealed);
          const maxDelay = Math.max(...newlyRevealed.values());
          setTimeout(() => setCellAnimDelays(new Map()), maxDelay + 400);
        }

        if (checkWin(newBoard)) {
          clearTimer();
          setGameState('won');
          // Spawn varied confetti particles with different shapes and sizes
          const colors = [
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
          const shapes: ConfettiParticle['shape'][] = ['rect', 'circle', 'triangle'];
          const particles: ConfettiParticle[] = Array.from({ length: 70 }, (_, i) => {
            const isLarge = i < 12;
            return {
              id: i,
              x: 5 + Math.random() * 90,
              color: colors[Math.floor(Math.random() * colors.length)],
              delay: Math.random() * 0.8,
              size: isLarge ? 14 + Math.random() * 12 : 4 + Math.random() * 10,
              shape: shapes[Math.floor(Math.random() * shapes.length)],
              spin: (Math.random() > 0.5 ? 1 : -1) * (720 + Math.random() * 1080),
              xDrift: (Math.random() - 0.5) * 24,
              duration: isLarge ? 3.0 + Math.random() * 1.5 : 2.5 + Math.random() * 1.5,
            };
          });
          setConfetti(particles);
          setTimeout(() => setConfetti([]), 4500);
          setBoardGlow(true);
          setTimeout(() => setBoardGlow(false), 4000);

          const bt = loadBestTime(difficulty);
          const currentTime = timeRef.current;
          if (bt === 0 || currentTime < bt) {
            saveBestTime(difficulty, currentTime);
            setBestTime(currentTime);
          }
        }

        return newBoard;
      });
    },
    [difficulty, clearTimer],
  );

  const handleFlag = useCallback(
    (r: number, c: number) => {
      setBoard((prev) => {
        if (prev.length === 0) return prev;
        const cell = prev[r][c];
        if (cell.revealed) return prev;
        const newBoard = prev.map((row) => row.map((cell) => ({ ...cell })));
        newBoard[r][c].flagged = !newBoard[r][c].flagged;
        const cfg = DIFFICULTIES[difficulty];
        const flagCount = newBoard.flat().filter((cell) => cell.flagged).length;
        setMinesLeft(cfg.mines - flagCount);
        return newBoard;
      });
    },
    [difficulty],
  );

  const addRipple = useCallback((r: number, c: number) => {
    const id = ++rippleIdRef.current;
    setRippleCells((prev) => [...prev, { r, c, id }]);
    setTimeout(() => setRippleCells((prev) => prev.filter((rc) => rc.id !== id)), 500);
  }, []);

  const handleTouchStart = useCallback(
    (r: number, c: number, e: React.TouchEvent) => {
      longPressTriggeredRef.current = false;
      setPressCell({ r, c });
      longPressTimerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        setPressCell(null);
        handleFlag(r, c);
      }, 350);
    },
    [handleFlag],
  );

  const handleTouchEnd = useCallback(
    (r: number, c: number, e: React.TouchEvent) => {
      setPressCell(null);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (!longPressTriggeredRef.current) {
        addRipple(r, c);
        if (flagMode === 'flag') {
          handleFlag(r, c);
        } else {
          handleReveal(r, c);
        }
      }
    },
    [handleReveal, handleFlag, flagMode, addRipple],
  );

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      // For non-touch (mouse) clicks
      if (longPressTriggeredRef.current) return;
      addRipple(r, c);
      if (flagMode === 'flag') {
        handleFlag(r, c);
      } else {
        handleReveal(r, c);
      }
    },
    [handleReveal, handleFlag, flagMode, addRipple],
  );

  const handleRightClick = useCallback(
    (r: number, c: number, e: React.MouseEvent) => {
      e.preventDefault();
      handleFlag(r, c);
    },
    [handleFlag],
  );

  const cfg = DIFFICULTIES[difficulty];
  const cellSize =
    cfg.cols > 16
      ? 'w-7 h-7 text-[10px] sm:w-7 sm:h-7 sm:text-xs'
      : cfg.cols > 10
        ? 'w-8 h-8 text-xs sm:w-8 sm:h-8 sm:text-sm'
        : 'w-9 h-9 text-sm sm:w-10 sm:h-10 sm:text-base';

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  // Pulse mine counter when it changes
  useEffect(() => {
    if (minesLeft !== prevMinesLeftRef.current) {
      prevMinesLeftRef.current = minesLeft;
      setMineCounterPulse(true);
      const t = setTimeout(() => setMineCounterPulse(false), 300);
      return () => clearTimeout(t);
    }
  }, [minesLeft]);

  // Subtle tick on timer each second
  useEffect(() => {
    if (time > 0 && gameState === 'playing') {
      setTimerTick(true);
      const t = setTimeout(() => setTimerTick(false), 200);
      return () => clearTimeout(t);
    }
  }, [time, gameState]);

  return (
    <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('扫雷', 'Minesweeper')}</h1>
            <p className="text-sm text-secondary">
              {t('经典扫雷，小心地雷！', 'Classic minesweeper, watch out for mines!')}
            </p>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-4">
          <div className="flex justify-center gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <motion.button
                key={d}
                onClick={() => {
                  if (gameState === 'playing') return;
                  setDifficulty(d);
                }}
                disabled={gameState === 'playing'}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-[48px] ${
                  difficulty === d
                    ? 'bg-primary text-on-primary'
                    : gameState === 'playing'
                      ? 'bg-surface-container-lowest/30 text-on-surface/30 cursor-default'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
                }`}
              >
                {t(...DIFFICULTIES[d].label)}
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-secondary text-center mt-1.5">
            {t(...DIFFICULTIES[difficulty].desc)}
          </p>
        </div>

        {/* Status Bar */}
        <div className="flex justify-between items-center mb-3 max-w-md mx-auto">
          <motion.div
            animate={
              mineCounterPulse
                ? {
                    scale: [1, 1.25, 0.95, 1.05, 1],
                    backgroundColor: [
                      'rgba(239,68,68,0)',
                      'rgba(239,68,68,0.15)',
                      'rgba(239,68,68,0)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.4 }}
            className="bg-surface-container-high rounded-xl px-3 py-1.5 flex items-center gap-1.5"
          >
            <Bomb className="w-4 h-4 text-red-500" />
            <span className="font-bold text-on-surface tabular-nums text-sm">{minesLeft}</span>
          </motion.div>
          <div className="flex gap-2">
            <motion.button
              onClick={startGame}
              whileTap={{ scale: 0.9 }}
              className="bg-surface-container-high rounded-xl px-3 py-1.5 flex items-center gap-1.5 min-h-[48px]"
            >
              <RotateCcw className="w-4 h-4 text-on-surface" />
              <span className="text-sm font-semibold text-on-surface">
                {gameState === 'idle' ? t('开始', 'Start') : t('重置', 'Reset')}
              </span>
            </motion.button>
          </div>
          <motion.div
            animate={
              timerTick
                ? {
                    scale: [1, 1.12, 0.97, 1],
                    backgroundColor: [
                      'rgba(59,130,246,0)',
                      'rgba(59,130,246,0.12)',
                      'rgba(59,130,246,0)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.3 }}
            className="bg-surface-container-high rounded-xl px-3 py-1.5 flex items-center gap-1.5"
          >
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-on-surface tabular-nums text-sm">
              {formatTime(time)}
            </span>
          </motion.div>
        </div>

        {/* Best Time */}
        {bestTime > 0 && (
          <div className="text-center mb-2">
            <span className="text-xs text-secondary flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" />
              {t('最佳', 'Best')}: {formatTime(bestTime)}
            </span>
          </div>
        )}

        {/* Game Board */}
        <div className="flex justify-center overflow-x-auto">
          <div className="relative">
            <motion.div
              animate={
                boardShake === 1
                  ? { x: [0, -3, 3, -2, 2, 0], rotate: [0, -0.3, 0.3, 0] }
                  : boardShake === 2
                    ? { x: [0, -8, 10, -8, 8, -4, 0], rotate: [0, -1, 1, -0.5, 0.5, 0] }
                    : boardShake === 3
                      ? {
                          x: [0, -14, 16, -12, 14, -8, 6, -3, 0],
                          rotate: [0, -2, 2.5, -1.5, 1, -0.5, 0],
                        }
                      : { x: 0, rotate: 0 }
              }
              transition={{ duration: boardShake === 3 ? 0.45 : 0.3 }}
              className={`inline-grid gap-0.5 p-2 rounded-2xl select-none touch-none relative transition-shadow duration-500 ${
                boardGlow
                  ? 'bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-100 shadow-[0_0_30px_rgba(234,179,8,0.4)]'
                  : 'bg-surface-container-high'
              }`}
              style={{
                gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))`,
                backgroundImage: boardGlow
                  ? undefined
                  : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isAnimating = cellAnimDelays.has(`${r}-${c}`);
                  const animDelay = cellAnimDelays.get(`${r}-${c}`) ?? 0;
                  const isBoom = boomCell?.r === r && boomCell?.c === c;
                  const isRipple = rippleCells.some((rc) => rc.r === r && rc.c === c);
                  const isPressed = pressCell?.r === r && pressCell?.c === c;

                  return (
                    <GameCell
                      key={`${r}-${c}`}
                      r={r}
                      c={c}
                      cell={cell}
                      cellSize={cellSize}
                      isAnimating={isAnimating}
                      animDelay={animDelay}
                      isBoom={isBoom}
                      isRipple={isRipple}
                      isPressed={isPressed}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      onClick={handleCellClick}
                      onContextMenu={handleRightClick}
                    />
                  );
                }),
              )}
            </motion.div>

            {/* White flash followed by red flash overlay on mine hit */}
            <AnimatePresence>
              {whiteFlash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, times: [0, 0.4, 1] }}
                  className="absolute inset-0 bg-white rounded-2xl pointer-events-none z-10"
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {redFlash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.45, 0.2, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, times: [0, 0.15, 0.5, 1] }}
                  className="absolute inset-0 bg-red-500 rounded-2xl pointer-events-none z-10"
                />
              )}
            </AnimatePresence>

            {/* Debris particles on explosion */}
            <AnimatePresence>
              {debris.map((d) => (
                <motion.div
                  key={d.id}
                  initial={{
                    x: `${(d.x / cfg.cols) * 100}%`,
                    y: `${(d.y / cfg.rows) * 100}%`,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    x: `${(d.x / cfg.cols) * 100 + d.vx}%`,
                    y: `${(d.y / cfg.rows) * 100 + d.vy * 0.8}%`,
                    opacity: 0,
                    scale: 0.3,
                    rotate: d.rotate,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: d.duration, ease: 'easeOut' }}
                  className="absolute rounded-sm pointer-events-none z-20"
                  style={{
                    width: d.size,
                    height: d.size,
                    backgroundColor: d.color,
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Controls - Flag Toggle with Sliding Indicator */}
        <div className="flex justify-center gap-3 mt-3">
          <motion.button
            onClick={() => setFlagMode((m) => (m === 'reveal' ? 'flag' : 'reveal'))}
            whileTap={{ scale: 0.95 }}
            className={`relative px-2 py-3.5 rounded-full font-semibold text-sm flex items-center min-h-[52px] overflow-hidden ${'bg-surface-container-high'}`}
          >
            {/* Sliding background indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30"
              animate={{
                x: flagMode === 'reveal' ? 0 : '100%',
                width: '50%',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{ left: 0 }}
            />
            <div className="relative flex items-center z-10">
              <motion.span
                className="flex items-center gap-2 px-5 py-1.5 rounded-full transition-colors"
                animate={{ color: flagMode === 'reveal' ? '#1c1917' : '#ffffff' }}
                transition={{ duration: 0.15 }}
              >
                <Flag className="w-5 h-5" />
                {t('揭开', 'Reveal')}
              </motion.span>
              <motion.span
                className="flex items-center gap-2 px-5 py-1.5 rounded-full transition-colors"
                animate={{ color: flagMode === 'flag' ? '#ffffff' : '#1c1917' }}
                transition={{ duration: 0.15 }}
              >
                <Flag className="w-5 h-5" />
                {t('标旗', 'Flag')}
              </motion.span>
            </div>
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-4 text-xs text-secondary/50">
          {t('点击揭开格子，长按/右键标旗', 'Tap to reveal, long-press / right-click to flag')}
        </div>

        {/* Confetti Particles */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <AnimatePresence>
            {confetti.map((p) => {
              const shapeClass =
                p.shape === 'circle' ? 'rounded-full' : p.shape === 'triangle' ? '' : 'rounded-sm';
              const shapeStyle: React.CSSProperties =
                p.shape === 'triangle'
                  ? {
                      backgroundColor: 'transparent',
                      width: 0,
                      height: 0,
                      borderLeft: `${p.size / 2}px solid transparent`,
                      borderRight: `${p.size / 2}px solid transparent`,
                      borderBottom: `${p.size}px solid ${p.color}`,
                    }
                  : {
                      backgroundColor: p.color,
                      width: p.size,
                      height: p.size,
                    };
              return (
                <motion.div
                  key={p.id}
                  initial={{ x: `${p.x}vw`, y: -20, opacity: 1, scale: 1, rotate: 0 }}
                  animate={{
                    y: '110vh',
                    opacity: [1, 1, 0.6, 0],
                    scale: [1, 1.3, 0.9, 0.5],
                    rotate: p.spin,
                    x: `${p.x + p.xDrift}vw`,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: 'easeIn',
                  }}
                  className={`absolute ${shapeClass}`}
                  style={shapeStyle}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {(gameState === 'won' || gameState === 'lost') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`mt-6 p-6 rounded-2xl text-center ${
                gameState === 'won'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {gameState === 'won' ? (
                <>
                  <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.1 }}
                    className="text-2xl mb-1"
                  >
                    {t('恭喜通关！', 'You Win!')}
                  </motion.p>
                  <motion.p
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10, delay: 0.2 }}
                    className="text-4xl mb-3"
                  >
                    🎉
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold text-green-600 mb-1"
                  >
                    {t('用时', 'Time')}: {formatTime(time)}
                  </motion.p>
                  {time > 0 && time <= bestTime && (
                    <motion.p
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{
                        scale: [0, 1.5, 0.8, 1.2, 0.95, 1.05, 1],
                        rotate: [-10, 5, -3, 2, 0],
                      }}
                      transition={{
                        delay: 0.5,
                        duration: 0.8,
                        type: 'spring',
                        stiffness: 300,
                        damping: 8,
                      }}
                      className="text-sm text-green-500 mb-2 font-bold"
                    >
                      🏆 {t('新纪录！', 'New Record!')}
                    </motion.p>
                  )}
                </>
              ) : (
                <>
                  <motion.p
                    initial={{ x: -10 }}
                    animate={{ x: [0, -5, 5, -3, 3, 0] }}
                    transition={{ duration: 0.4 }}
                    className="text-2xl mb-1"
                  >
                    {t('踩到地雷！', 'Boom! Game Over')}
                  </motion.p>
                  <motion.p
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="text-4xl mb-3"
                  >
                    💥
                  </motion.p>
                </>
              )}
              <div className="flex justify-center gap-3">
                <button
                  onClick={startGame}
                  className={`px-6 py-3 rounded-full font-semibold text-white min-h-[48px] transition-colors ${
                    gameState === 'won'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {t('再来一局', 'Play Again')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
