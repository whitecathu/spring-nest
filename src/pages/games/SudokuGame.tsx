import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Eraser, Lightbulb } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy, springSmooth } from '../../lib/animations';

type Difficulty = 'easy' | 'medium' | 'hard';
type Board = (number | 0)[][];
type Solution = number[][];

const DIFFICULTIES: Record<
  Difficulty,
  { clues: number; label: [string, string]; desc: [string, string] }
> = {
  easy: { clues: 38, label: ['简单', 'Easy'], desc: ['适合新手', 'For beginners'] },
  medium: { clues: 30, label: ['中等', 'Medium'], desc: ['需要思考', 'Requires thinking'] },
  hard: { clues: 24, label: ['困难', 'Hard'], desc: ['高难度挑战', 'High difficulty'] },
};

const GRID_SIZE = 9;
const BOX_SIZE = 3;

function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < GRID_SIZE; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function solveSudoku(board: Board): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        const nums = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Solution } {
  // Generate a solved board
  const solution: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudoku(solution);

  // Remove cells to create puzzle
  const puzzle: Board = solution.map((row) => [...row]);
  const positions = shuffleInPlace(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
  );

  const clues = DIFFICULTIES[difficulty].clues;
  let removed = 0;
  for (const [r, c] of positions) {
    if (81 - removed <= clues) break;
    puzzle[r][c] = 0;
    removed++;
  }

  return { puzzle, solution: solution as Solution };
}

function loadBestTime(d: Difficulty): number {
  try {
    return JSON.parse(localStorage.getItem(`spring_nest_sudoku_best_${d}`) || '0');
  } catch {
    return 0;
  }
}

function saveBestTime(d: Difficulty, time: number) {
  localStorage.setItem(`spring_nest_sudoku_best_${d}`, JSON.stringify(time));
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const SudokuCell = memo(function SudokuCell({
  value,
  isOriginal,
  isSelected,
  isError,
  isHighlight,
  onClick,
  isHint,
  isCorrectBrief,
}: {
  value: number;
  isOriginal: boolean;
  isSelected: boolean;
  isError: boolean;
  isHighlight: boolean;
  onClick: () => void;
  isHint: boolean;
  isCorrectBrief: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={isError ? { x: [0, -3, 3, -3, 3, 0] } : { x: 0 }}
      transition={isError ? { duration: 0.4 } : { duration: 0.15 }}
      className={`
        relative w-full aspect-square flex items-center justify-center text-sm sm:text-base font-bold rounded
        transition-colors duration-150
        ${isOriginal ? 'text-on-surface' : 'text-blue-600 dark:text-blue-400'}
        ${isSelected ? 'bg-primary-container' : ''}
        ${isError ? 'bg-red-100 dark:bg-red-900/30 text-red-600!' : ''}
        ${!isSelected && !isError ? (isHighlight ? 'bg-primary-container/30' : 'bg-surface-container-lowest hover:bg-surface-container') : ''}
      `}
    >
      {/* Pulsing ring on selected cell */}
      {isSelected && (
        <motion.span
          className="absolute inset-0 rounded border-[3px] border-primary pointer-events-none"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* Green glow on correct placement */}
      <AnimatePresence>
        {isCorrectBrief && (
          <motion.div
            className="absolute inset-0 rounded bg-green-400/25 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
      {/* Number with scale-from-zero entrance */}
      <AnimatePresence mode="wait">
        {value !== 0 && (
          <motion.span
            key={value}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={springBouncy}
            className={`relative z-10 ${isHint ? 'text-amber-500 dark:text-amber-400' : ''}`}
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
      {/* Hint golden glow pulse */}
      {isHint && (
        <motion.div
          className="absolute inset-0 rounded bg-amber-400/20 pointer-events-none"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1, repeat: 2, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
});

// Simple confetti particles for win celebration
function WinConfetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899'];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 500,
      y: Math.random() * -350 - 50,
      rotate: Math.random() * 720 - 360,
      color: colors[i % colors.length],
      delay: Math.random() * 0.4,
      size: Math.random() * 8 + 4,
      duration: 1.2 + Math.random() * 0.8,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: p.x,
            y: [0, p.y, p.y + 500],
            opacity: [1, 1, 0],
            rotate: p.rotate,
            scale: [1, 1.2, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}

export default function SudokuGame({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<Board>([]);
  const [board, setBoard] = useState<Board>([]);
  const [solution, setSolution] = useState<Solution>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => loadBestTime(difficulty));
  const [hints, setHints] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timeRef = useRef(0);

  // Animation states
  const [hintCells, setHintCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [mistakeCount, setMistakeCount] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    },
    [clearTimer],
  );

  const startGame = useCallback(() => {
    clearTimer();
    const { puzzle: p, solution: s } = generatePuzzle(difficulty);
    setPuzzle(p);
    setBoard(p.map((r) => [...r]));
    setSolution(s);
    setSelected(null);
    setErrors(new Set());
    setGameState('playing');
    setTime(0);
    timeRef.current = 0;
    setHints(3);
    setBestTime(loadBestTime(difficulty));
    setHintCells(new Set());
    setCorrectCells(new Set());
    setMistakeCount(0);
    setIsNewRecord(false);
    timerRef.current = setInterval(() => {
      timeRef.current++;
      setTime(timeRef.current);
    }, 1000);
  }, [difficulty, clearTimer]);

  const checkWin = useCallback((b: Board) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) return false;
      }
    }
    return true;
  }, []);

  const handleWin = useCallback(() => {
    clearTimer();
    setGameState('won');
    const bt = loadBestTime(difficulty);
    if (bt === 0 || timeRef.current < bt) {
      saveBestTime(difficulty, timeRef.current);
      setBestTime(timeRef.current);
      setIsNewRecord(true);
    }
  }, [clearTimer, difficulty]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (gameState !== 'playing') return;
      if (puzzle[r][c] !== 0) return; // Can't select original cells
      setSelected([r, c]);
    },
    [gameState, puzzle],
  );

  const handleNumber = useCallback(
    (num: number) => {
      if (!selected || gameState !== 'playing') return;
      const [r, c] = selected;
      if (puzzle[r][c] !== 0) return;

      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = num;
      setBoard(newBoard);

      // Check if this cell is correct
      const newErrors = new Set(errors);
      const key = `${r}-${c}`;
      if (num !== 0 && num !== solution[r][c]) {
        if (!newErrors.has(key)) {
          setMistakeCount((prev) => prev + 1);
        }
        newErrors.add(key);
        setCorrectCells((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        newErrors.delete(key);
        if (num !== 0 && num === solution[r][c]) {
          // Brief green glow on correct placement
          setCorrectCells((prev) => new Set(prev).add(key));
          const glowTimeout = setTimeout(() => {
            setCorrectCells((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }, 500);
          timeoutsRef.current.push(glowTimeout);
        }
      }
      setErrors(newErrors);

      if (checkWin(newBoard) && newErrors.size === 0) handleWin();
    },
    [selected, gameState, puzzle, board, solution, errors, checkWin, handleWin],
  );

  const handleErase = useCallback(() => {
    if (!selected || gameState !== 'playing') return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0) return;
    handleNumber(0);
  }, [selected, gameState, puzzle, handleNumber]);

  const handleHint = useCallback(() => {
    if (!selected || gameState !== 'playing' || hints <= 0) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0 || board[r][c] === solution[r][c]) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    setHints((h) => h - 1);

    // Track hint cells for golden glow
    setHintCells((prev) => new Set(prev).add(`${r}-${c}`));

    // Remove error if any
    const newErrors = new Set(errors);
    newErrors.delete(`${r}-${c}`);
    setErrors(newErrors);

    if (checkWin(newBoard) && newErrors.size === 0) handleWin();
  }, [selected, gameState, hints, puzzle, board, solution, errors, checkWin, handleWin]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !selected) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) handleNumber(num);
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') handleErase();
      if (e.key === 'ArrowUp' && selected[0] > 0) setSelected([selected[0] - 1, selected[1]]);
      if (e.key === 'ArrowDown' && selected[0] < 8) setSelected([selected[0] + 1, selected[1]]);
      if (e.key === 'ArrowLeft' && selected[1] > 0) setSelected([selected[0], selected[1] - 1]);
      if (e.key === 'ArrowRight' && selected[1] < 8) setSelected([selected[0], selected[1] + 1]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, selected, handleNumber, handleErase]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
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
            <h1 className="text-3xl font-black text-on-surface">{t('数独', 'Sudoku')}</h1>
            <p className="text-sm text-secondary">
              {t('填入 1-9，每行每列每宫不重复', 'Fill 1-9, no repeats in row/col/box')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-3 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('时间', 'Time')}</div>
              <div className="text-lg font-bold text-primary tabular-nums">{formatTime(time)}</div>
            </div>
            {bestTime > 0 && (
              <div
                className={`bg-surface-container-high rounded-xl px-3 py-2 text-center relative ${isNewRecord ? 'ring-2 ring-amber-400' : ''}`}
              >
                <div className="text-xs text-secondary font-medium flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {t('最佳', 'Best')}
                </div>
                <motion.div
                  className="text-lg font-bold text-tertiary tabular-nums"
                  animate={isNewRecord ? { scale: [1, 1.25, 1] } : {}}
                  transition={isNewRecord ? { duration: 0.5, ...springBouncy } : {}}
                >
                  {formatTime(bestTime)}
                </motion.div>
                {isNewRecord && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-amber-400/20 pointer-events-none"
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 0.8, repeat: 2 }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex justify-center gap-2 mb-4">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <motion.button
              key={d}
              onClick={() => {
                if (gameState === 'playing') return;
                setDifficulty(d);
              }}
              disabled={gameState === 'playing'}
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.05 }}
              animate={difficulty === d ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={springBouncy}
              className={`px-4 py-2 rounded-full font-semibold text-sm min-h-[48px] transition-all ${
                difficulty === d
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
              }`}
            >
              {t(...DIFFICULTIES[d].label)}
            </motion.button>
          ))}
        </div>

        {/* Mistake counter */}
        {gameState === 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-3"
          >
            <div className="bg-surface-container-high rounded-full px-4 py-1.5 flex items-center gap-2 text-sm">
              <span className="text-secondary font-medium">{t('错误', 'Mistakes')}:</span>
              <motion.span
                key={mistakeCount}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                transition={springBouncy}
                className={`font-bold tabular-nums ${mistakeCount > 0 ? 'text-red-500' : 'text-green-500'}`}
              >
                {mistakeCount}
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* Board */}
        <AnimatePresence mode="wait">
          {gameState !== 'idle' && (
            <motion.div
              key="board"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springSmooth}
              className="mb-4"
            >
              <div className="grid grid-cols-9 gap-0 max-w-[360px] mx-auto border-2 border-on-surface/20 rounded-lg overflow-hidden">
                {board.map((row, r) =>
                  row.map((val, c) => {
                    const isSelected = selected?.[0] === r && selected?.[1] === c;
                    const isError = errors.has(`${r}-${c}`);
                    const isHighlight =
                      selected !== null &&
                      (selected[0] === r ||
                        selected[1] === c ||
                        (Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                          Math.floor(selected[1] / 3) === Math.floor(c / 3)));
                    const isHint = hintCells.has(`${r}-${c}`);
                    const borderRight =
                      (c + 1) % 3 === 0 && c < 8
                        ? 'border-r-2 border-on-surface/20'
                        : 'border-r border-on-surface/10';
                    const borderBottom =
                      (r + 1) % 3 === 0 && r < 8
                        ? 'border-b-2 border-on-surface/20'
                        : 'border-b border-on-surface/10';

                    const isCorrectBrief = correctCells.has(`${r}-${c}`);

                    return (
                      <div key={`${r}-${c}`} className={`${borderRight} ${borderBottom}`}>
                        <SudokuCell
                          value={val}
                          isOriginal={puzzle[r]?.[c] !== 0}
                          isSelected={isSelected}
                          isError={isError}
                          isHighlight={isHighlight && !isSelected}
                          isHint={isHint}
                          isCorrectBrief={isCorrectBrief}
                          onClick={() => handleCellClick(r, c)}
                        />
                      </div>
                    );
                  }),
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number Pad + Actions */}
        {gameState === 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSmooth}
            className="max-w-[360px] mx-auto"
          >
            {/* Actions */}
            <div className="flex justify-center gap-3 mb-3">
              <motion.button
                onClick={handleErase}
                whileTap={{ scale: 0.9 }}
                className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface font-semibold text-sm flex items-center gap-1.5 min-h-[48px]"
              >
                <Eraser className="w-4 h-4" />
                {t('擦除', 'Erase')}
              </motion.button>
              <motion.button
                onClick={handleHint}
                disabled={hints <= 0}
                whileTap={{ scale: 0.9 }}
                className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1.5 min-h-[48px] ${
                  hints > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-surface-container-low text-secondary/30'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                {t('提示', 'Hint')} ({hints})
              </motion.button>
            </div>

            {/* Number Pad */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="grid grid-cols-9 gap-1.5 min-w-[320px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    onClick={() => handleNumber(num)}
                    whileTap={{ scale: 0.85 }}
                    className="aspect-square rounded-lg bg-primary text-on-primary font-bold text-lg flex items-center justify-center min-h-[48px]"
                  >
                    {num}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Start/Play Again */}
        <AnimatePresence mode="wait">
          {(gameState === 'idle' || gameState === 'won') && (
            <motion.div
              key={gameState}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={springSmooth}
              className="flex flex-col items-center gap-3 mt-4"
            >
              {gameState === 'won' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springBouncy}
                  className="text-center mb-2"
                >
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="text-2xl font-bold text-on-surface">
                    {t('恭喜通关！', 'You Win!')}
                  </p>
                  <p className="text-sm text-secondary">
                    {t('用时', 'Time')}: {formatTime(time)}
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    {t('错误', 'Mistakes')}: {mistakeCount}
                  </p>
                  {isNewRecord && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.6, ...springBouncy }}
                      className="text-sm text-green-500 font-bold mt-1"
                    >
                      🏆 {t('新纪录！', 'New Record!')}
                    </motion.p>
                  )}
                </motion.div>
              )}
              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                transition={springBouncy}
                className="px-8 py-3 bg-primary text-on-primary rounded-full font-semibold flex items-center gap-2 min-h-[48px]"
              >
                <RotateCcw className="w-5 h-5" />
                {gameState === 'won' ? t('再来一局', 'Play Again') : t('开始游戏', 'Start Game')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti on win */}
        <AnimatePresence>{gameState === 'won' && <WinConfetti />}</AnimatePresence>

        {/* Instructions */}
        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('点击空格选择，输入 1-9 填入数字', 'Tap a cell to select, enter 1-9 to fill')}
        </div>
      </motion.div>
    </div>
  );
}
