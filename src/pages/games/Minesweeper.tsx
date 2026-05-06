import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Timer, Flag, Bomb } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Difficulty = 'easy' | 'medium' | 'hard';
type CellState = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };

const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; mines: number; label: [string, string]; desc: [string, string] }> = {
  easy:   { rows: 9,  cols: 9,  mines: 10, label: ['简单', 'Easy'],   desc: ['9×9，10 颗雷', '9×9, 10 mines'] },
  medium: { rows: 16, cols: 16, mines: 40, label: ['中等', 'Medium'], desc: ['16×16，40 颗雷', '16×16, 40 mines'] },
  hard:   { rows: 16, cols: 30, mines: 99, label: ['困难', 'Hard'],   desc: ['16×30，99 颗雷', '16×30, 99 mines'] },
};

function createBoard(rows: number, cols: number, mines: number, firstR: number, firstC: number): CellState[][] {
  const board: CellState[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
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
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }

  return board;
}

function floodFill(board: CellState[][], r: number, c: number): void {
  const rows = board.length, cols = board[0].length;
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
  try { return JSON.parse(localStorage.getItem(`spring_nest_minesweeper_best_${d}`) || '0'); } catch { return 0; }
}

function saveBestTime(d: Difficulty, time: number) {
  localStorage.setItem(`spring_nest_minesweeper_best_${d}`, JSON.stringify(time));
}

const ADJACENT_COLORS = ['', 'text-blue-600', 'text-green-600', 'text-red-600', 'text-purple-700', 'text-yellow-700', 'text-cyan-600', 'text-gray-800', 'text-gray-500'];

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
      Array.from({ length: cfg.cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
    );
    setBoard(empty);
    setGameState('idle');
    setMinesLeft(cfg.mines);
    setTime(0);
    boardCreatedRef.current = false;
    setBestTime(loadBestTime(difficulty));
  }, [difficulty, clearTimer]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleReveal = useCallback((r: number, c: number) => {
    setBoard(prev => {
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
        timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
      }

      // Deep copy
      const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

      if (newBoard[r][c].mine) {
        // Game over - reveal all mines
        for (const row of newBoard) {
          for (const c2 of row) {
            if (c2.mine) c2.revealed = true;
          }
        }
        clearTimer();
        setGameState('lost');
        return newBoard;
      }

      floodFill(newBoard, r, c);

      if (checkWin(newBoard)) {
        clearTimer();
        setGameState('won');
        const bt = loadBestTime(difficulty);
        const currentTime = time; // Note: time state might not be updated yet
        if (bt === 0 || currentTime < bt) {
          saveBestTime(difficulty, currentTime);
          setBestTime(currentTime);
        }
      }

      return newBoard;
    });
  }, [difficulty, clearTimer, time]);

  const handleFlag = useCallback((r: number, c: number) => {
    setBoard(prev => {
      if (prev.length === 0) return prev;
      const cell = prev[r][c];
      if (cell.revealed) return prev;
      const newBoard = prev.map(row => row.map(cell => ({ ...cell })));
      newBoard[r][c].flagged = !newBoard[r][c].flagged;
      const cfg = DIFFICULTIES[difficulty];
      const flagCount = newBoard.flat().filter(c => c.flagged).length;
      setMinesLeft(cfg.mines - flagCount);
      return newBoard;
    });
  }, [difficulty]);

  const handleTouchStart = useCallback((r: number, c: number, e: React.TouchEvent) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      handleFlag(r, c);
    }, 400);
  }, [handleFlag]);

  const handleTouchEnd = useCallback((r: number, c: number, e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!longPressTriggeredRef.current) {
      handleReveal(r, c);
    }
  }, [handleReveal]);

  const handleCellClick = useCallback((r: number, c: number) => {
    // For non-touch (mouse) clicks
    if (longPressTriggeredRef.current) return;
    handleReveal(r, c);
  }, [handleReveal]);

  const handleRightClick = useCallback((r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    handleFlag(r, c);
  }, [handleFlag]);

  const cfg = DIFFICULTIES[difficulty];
  const cellSize = cfg.cols > 16 ? 'w-6 h-6 text-[10px] sm:w-7 sm:h-7 sm:text-xs' : cfg.cols > 10 ? 'w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-sm' : 'w-8 h-8 text-sm sm:w-10 sm:h-10 sm:text-base';

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  return (
    <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[44px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('扫雷', 'Minesweeper')}</h1>
            <p className="text-sm text-secondary">{t('经典扫雷，小心地雷！', 'Classic minesweeper, watch out for mines!')}</p>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-4">
          <div className="flex justify-center gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <motion.button
                key={d}
                onClick={() => {
                  if (gameState === 'playing') return;
                  setDifficulty(d);
                }}
                disabled={gameState === 'playing'}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-[44px] ${
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
          <div className="bg-surface-container-high rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <Bomb className="w-4 h-4 text-red-500" />
            <span className="font-bold text-on-surface tabular-nums text-sm">{minesLeft}</span>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={startGame}
              whileTap={{ scale: 0.9 }}
              className="bg-surface-container-high rounded-xl px-3 py-1.5 flex items-center gap-1.5 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-on-surface" />
              <span className="text-sm font-semibold text-on-surface">
                {gameState === 'idle' ? t('开始', 'Start') : t('重置', 'Reset')}
              </span>
            </motion.button>
          </div>
          <div className="bg-surface-container-high rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-on-surface tabular-nums text-sm">{formatTime(time)}</span>
          </div>
        </div>

        {/* Best Time */}
        {bestTime > 0 && (
          <div className="text-center mb-2">
            <span className="text-xs text-secondary flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" />{t('最佳', 'Best')}: {formatTime(bestTime)}
            </span>
          </div>
        )}

        {/* Game Board */}
        <div className="flex justify-center overflow-x-auto">
          <div
            className="inline-grid gap-0.5 p-2 bg-surface-container-high rounded-2xl select-none touch-none"
            style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))` }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                let content = '';
                let contentClass = '';
                let bgClass = 'bg-surface-container-low hover:bg-surface-variant active:bg-surface-variant';

                if (cell.revealed) {
                  if (cell.mine) {
                    content = '💥';
                    bgClass = 'bg-red-100';
                  } else if (cell.adjacent > 0) {
                    content = String(cell.adjacent);
                    contentClass = ADJACENT_COLORS[cell.adjacent] || '';
                    bgClass = 'bg-surface-container-lowest';
                  } else {
                    bgClass = 'bg-surface-container-lowest';
                  }
                } else if (cell.flagged) {
                  content = '🚩';
                  bgClass = 'bg-yellow-100 hover:bg-yellow-200';
                }

                return (
                  <motion.button
                    key={`${r}-${c}`}
                    onTouchStart={(e) => handleTouchStart(r, c, e)}
                    onTouchEnd={(e) => handleTouchEnd(r, c, e)}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleRightClick(r, c, e)}
                    whileTap={{ scale: 0.9 }}
                    className={`${cellSize} rounded flex items-center justify-center font-bold transition-colors ${bgClass} ${contentClass}`}
                  >
                    {content}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-4 text-xs text-secondary/50">
          {t('点击揭开格子，长按/右键标旗', 'Tap to reveal, long-press / right-click to flag')}
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
                  <p className="text-2xl mb-1">{t('恭喜通关！', 'You Win!')}</p>
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-lg font-bold text-green-600 mb-1">{t('用时', 'Time')}: {formatTime(time)}</p>
                  {time > 0 && time <= bestTime && (
                    <p className="text-sm text-green-500 mb-2">🏆 {t('新纪录！', 'New Record!')}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl mb-1">{t('踩到地雷！', 'Boom! Game Over')}</p>
                  <p className="text-4xl mb-3">💥</p>
                </>
              )}
              <div className="flex justify-center gap-3">
                <button onClick={startGame} className={`px-6 py-3 rounded-full font-semibold text-white min-h-[44px] transition-colors ${
                  gameState === 'won' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}>
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
