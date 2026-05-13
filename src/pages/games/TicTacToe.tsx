import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Users, Bot } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Cell = 'X' | 'O' | null;
type Board = Cell[];
type GameMode = 'pvp' | 'ai';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
];

function loadScores(): { x: number; o: number; draw: number } {
  try {
    return JSON.parse(localStorage.getItem('spring_nest_tictactoe_scores') || '{"x":0,"o":0,"draw":0}');
  } catch {
    return { x: 0, o: 0, draw: 0 };
  }
}

function saveScores(scores: { x: number; o: number; draw: number }) {
  localStorage.setItem('spring_nest_tictactoe_scores', JSON.stringify(scores));
}

function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
}

function checkDraw(board: Board): boolean {
  return board.every(cell => cell !== null);
}

// AI: prefer center, then corners, then edges
function getAIMove(board: Board): number {
  const empty = board.map((c, i) => c === null ? i : -1).filter(i => i >= 0);
  if (empty.length === 0) return -1;

  // Check if AI can win
  for (const i of empty) {
    const test = [...board];
    test[i] = 'O';
    if (checkWinner(test).winner === 'O') return i;
  }

  // Check if AI needs to block
  for (const i of empty) {
    const test = [...board];
    test[i] = 'X';
    if (checkWinner(test).winner === 'X') return i;
  }

  // Prefer center
  if (empty.includes(4)) return 4;

  // Prefer corners
  const corners = [0, 2, 6, 8].filter(i => empty.includes(i));
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  // Edges
  const edges = [1, 3, 5, 7].filter(i => empty.includes(i));
  if (edges.length > 0) return edges[Math.floor(Math.random() * edges.length)];

  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToe({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [mode, setMode] = useState<GameMode>('pvp');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Cell>(null);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState(loadScores);
  const aiThinkingRef = useRef(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAITimer = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearAITimer();
    };
  }, [clearAITimer]);

  const resetBoard = useCallback(() => {
    clearAITimer();
    aiThinkingRef.current = false;
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinLine(null);
    setIsDraw(false);
  }, [clearAITimer]);

  const makeMove = useCallback((index: number, boardState: Board, player: 'X' | 'O') => {
    if (boardState[index] !== null) return;

    const newBoard = [...boardState];
    newBoard[index] = player;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinLine(result.line);
      setScores(prev => {
        const updated = { ...prev, [result.winner!.toLowerCase() as 'x' | 'o']: prev[result.winner!.toLowerCase() as 'x' | 'o'] + 1 };
        saveScores(updated);
        return updated;
      });
      return;
    }

    if (checkDraw(newBoard)) {
      setIsDraw(true);
      setScores(prev => {
        const updated = { ...prev, draw: prev.draw + 1 };
        saveScores(updated);
        return updated;
      });
      return;
    }

    setCurrentPlayer(player === 'X' ? 'O' : 'X');
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (winner || isDraw || board[index] !== null) return;
    if (mode === 'ai' && currentPlayer === 'O') return;
    if (aiThinkingRef.current) return;

    makeMove(index, board, currentPlayer);
  }, [winner, isDraw, board, currentPlayer, mode, makeMove]);

  // AI move effect
  useEffect(() => {
    if (mode !== 'ai' || currentPlayer !== 'O' || winner || isDraw) return;

    aiThinkingRef.current = true;
    aiTimeoutRef.current = setTimeout(() => {
      const move = getAIMove(board);
      if (move >= 0) {
        aiThinkingRef.current = false;
        makeMove(move, board, 'O');
      }
    }, 400);

    return () => {
      clearAITimer();
    };
  }, [mode, currentPlayer, winner, isDraw, board, makeMove, clearAITimer]);

  const handleModeChange = useCallback((newMode: GameMode) => {
    setMode(newMode);
    clearAITimer();
    aiThinkingRef.current = false;
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinLine(null);
    setIsDraw(false);
  }, [clearAITimer]);

  const statusText = () => {
    if (winner) {
      if (mode === 'ai') {
        return winner === 'X' ? t('你赢了！', 'You win!') : t('电脑赢了', 'AI wins');
      }
      return t('玩家', 'Player ') + winner + t(' 赢了！', ' wins!');
    }
    if (isDraw) return t('平局！', "It's a draw!");
    if (mode === 'ai' && currentPlayer === 'O') return t('电脑思考中...', 'AI is thinking...');
    return t('轮到玩家', 'Player ') + currentPlayer;
  };

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[44px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-black text-on-surface">{t('井字棋', 'Tic-Tac-Toe')}</h1>
          <p className="text-sm text-secondary">{t('经典三子棋', 'Classic noughts and crosses')}</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <motion.button
            onClick={() => handleModeChange('pvp')}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-[44px] ${
              mode === 'pvp' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('双人对战', 'PvP')}
          </motion.button>
          <motion.button
            onClick={() => handleModeChange('ai')}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-[44px] ${
              mode === 'ai' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
            }`}
          >
            <Bot className="w-4 h-4" />
            {t('人机对战', 'vs AI')}
          </motion.button>
        </div>

        {/* Score Display */}
        <div className="flex justify-center gap-3 mb-4">
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium">
              {mode === 'ai' ? t('你 (X)', 'You (X)') : 'X'}
            </div>
            <div className="text-xl font-bold text-primary">{scores.x}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium">{t('平局', 'Draw')}</div>
            <div className="text-xl font-bold text-secondary">{scores.draw}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium">
              {mode === 'ai' ? t('电脑 (O)', 'AI (O)') : 'O'}
            </div>
            <div className="text-xl font-bold text-tertiary">{scores.o}</div>
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="text-center mb-3">
          <motion.p
            key={`${currentPlayer}-${winner}-${isDraw}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-lg font-bold ${
              winner ? 'text-green-500' : isDraw ? 'text-yellow-500' : 'text-on-surface'
            }`}
          >
            {statusText()}
          </motion.p>
        </div>

        {/* Game Board */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-3 gap-2 w-[280px] sm:w-[320px]">
            {board.map((cell, i) => {
              const isWinCell = winLine?.includes(i);
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: cell ? 1 : 0.9 }}
                  animate={isWinCell ? { scale: [1, 1.1, 1] } : undefined}
                  transition={isWinCell ? { duration: 0.5, repeat: 2 } : undefined}
                  onClick={() => handleCellClick(i)}
                  aria-label={cell
                    ? t(`第 ${Math.floor(i / 3) + 1} 行第 ${(i % 3) + 1} 列，${cell}`, `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, ${cell}`)
                    : t(`第 ${Math.floor(i / 3) + 1} 行第 ${(i % 3) + 1} 列，空位，点击落子`, `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, empty, place mark`)
                  }
                  disabled={!!cell || !!winner || isDraw || (mode === 'ai' && currentPlayer === 'O')}
                  className={`aspect-square rounded-xl text-4xl sm:text-5xl font-black flex items-center justify-center transition-colors min-h-[48px] min-w-[48px] ${
                    isWinCell
                      ? 'bg-green-100 border-2 border-green-400'
                      : cell
                        ? 'bg-surface-container-high'
                        : 'bg-surface-container-high hover:bg-surface-variant active:bg-surface-variant'
                  } ${cell === 'X' ? 'text-primary' : cell === 'O' ? 'text-tertiary' : 'text-transparent'}`}
                >
                  <AnimatePresence mode="wait">
                    {cell && (
                      <motion.span
                        key={cell}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                      >
                        {cell}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={resetBoard}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 min-h-[44px]"
          >
            <RotateCcw className="w-5 h-5" />
            {t('新游戏', 'New Game')}
          </button>
        </div>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {(winner || isDraw) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="mt-6 p-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-700/30 rounded-2xl text-center"
            >
              {winner && (
                <>
                  <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.1 }} className="text-3xl mb-2">
                    {winner === 'X' ? '🎉' : (mode === 'ai' ? '🤖' : '🎉')}
                  </motion.p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {mode === 'ai'
                      ? (winner === 'X' ? t('你赢了！', 'You win!') : t('电脑赢了', 'AI wins'))
                      : t('玩家', 'Player ') + winner + t(' 赢了！', ' wins!')}
                  </p>
                </>
              )}
              {isDraw && (
                <>
                  <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.1 }} className="text-3xl mb-2">🤝</motion.p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{t('平局！', "It's a draw!")}</p>
                </>
              )}
              <button
                onClick={resetBoard}
                className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors min-h-[44px]"
              >
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
