import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Circle, RotateCcw } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Bubble = 0 | 1 | 2 | 3 | 4;
type Board = Array<Array<Bubble | null>>;

const rows = 10;
const cols = 9;
const storageKey = 'spring-nest-bubble-pop-best';
const bubbleColors = [
  'bg-[#8fd4a5]',
  'bg-[#f7c5b0]',
  'bg-[#f9e4b7]',
  'bg-[#9ec7e8]',
  'bg-[#d7b8f0]',
] as const;

function createBoard(): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * bubbleColors.length) as Bubble),
  );
}

function neighbors(row: number, col: number) {
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ].filter(
    ([nextRow, nextCol]) => nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols,
  );
}

function getGroup(board: Board, row: number, col: number) {
  const color = board[row][col];
  if (color === null) return [];
  const seen = new Set<string>();
  const queue: Array<[number, number]> = [[row, col]];

  while (queue.length) {
    const [currentRow, currentCol] = queue.shift()!;
    const id = `${currentRow}-${currentCol}`;
    if (seen.has(id) || board[currentRow][currentCol] !== color) continue;
    seen.add(id);
    neighbors(currentRow, currentCol).forEach(([nextRow, nextCol]) =>
      queue.push([nextRow, nextCol]),
    );
  }

  return [...seen].map((id) => id.split('-').map(Number) as [number, number]);
}

function applyGravity(board: Board): Board {
  const next = board.map((row) => [...row]);
  for (let col = 0; col < cols; col += 1) {
    const bubbles = [];
    for (let row = rows - 1; row >= 0; row -= 1) {
      const value = next[row][col];
      if (value !== null) bubbles.push(value);
    }
    for (let row = rows - 1; row >= 0; row -= 1) {
      next[row][col] = bubbles[rows - 1 - row] ?? null;
    }
  }
  return next;
}

function hasMoves(board: Board) {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (getGroup(board, row, col).length >= 2) return true;
    }
  }
  return false;
}

function remainingCount(board: Board) {
  return board.flat().filter((item) => item !== null).length;
}

function getStoredBest() {
  if (typeof window === 'undefined') return 0;
  const value = Number(window.localStorage.getItem(storageKey) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export default function BubblePop({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(getStoredBest);
  const [message, setMessage] = useState('');
  const gameOver = useMemo(() => !hasMoves(board), [board]);

  function reset() {
    setBoard(createBoard());
    setScore(0);
    setMoves(0);
    setMessage('');
  }

  function pop(row: number, col: number) {
    const group = getGroup(board, row, col);
    if (group.length < 2) {
      setMessage(t('至少需要相邻两个同色泡泡。', 'Pick at least two adjacent bubbles.'));
      return;
    }

    const next = board.map((line) => [...line]);
    group.forEach(([groupRow, groupCol]) => {
      next[groupRow][groupCol] = null;
    });
    const gained = group.length * group.length * 10;
    const nextScore = score + gained;
    const gravityBoard = applyGravity(next);
    setBoard(gravityBoard);
    setScore(nextScore);
    setMoves((current) => current + 1);
    setMessage(
      t(`消除 ${group.length} 个，+${gained} 分。`, `Popped ${group.length}, +${gained}.`),
    );

    if (nextScore > best) {
      setBest(nextScore);
      window.localStorage.setItem(storageKey, String(nextScore));
    }
  }

  return (
    <div className="flex-grow mx-auto w-full max-w-4xl px-4 py-8">
      <button
        onClick={onBack}
        className="mb-4 flex min-h-[48px] items-center gap-2 px-2 -ml-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-5 w-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-on-surface">
            <Circle className="h-8 w-8 fill-primary/30 text-primary" />
            {t('泡泡消消', 'Bubble Pop')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '点击两个或更多相邻同色泡泡，一次消除越多得分越高。',
              'Tap two or more adjacent same-color bubbles. Larger groups score more.',
            )}
          </p>
        </div>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-3xl border border-surface-variant/30 bg-white/85 p-4 shadow-lg dark:bg-surface-container-high/80">
            <div
              className="grid gap-1 rounded-2xl bg-surface-container-low p-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {board.map((row, rowIndex) =>
                row.map((bubble, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    disabled={bubble === null}
                    onClick={() => pop(rowIndex, colIndex)}
                    className={`aspect-square rounded-full border border-white/70 shadow-inner transition-[transform,opacity,box-shadow] duration-150 hover:scale-105 active:scale-95 disabled:opacity-0 ${
                      bubble === null ? 'bg-transparent' : bubbleColors[bubble]
                    }`}
                    aria-label={
                      bubble === null
                        ? t('空格', 'Empty')
                        : t(
                            `第 ${rowIndex + 1} 行第 ${colIndex + 1} 列泡泡`,
                            `Bubble ${rowIndex + 1}, ${colIndex + 1}`,
                          )
                    }
                  />
                )),
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-surface-variant/30 bg-white/85 p-5 shadow-lg dark:bg-surface-container-high/80">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-primary-container/30 p-3">
                  <p className="text-2xl font-black text-primary">{score}</p>
                  <p className="text-xs font-semibold text-secondary">{t('得分', 'Score')}</p>
                </div>
                <div className="rounded-2xl bg-tertiary-container/30 p-3">
                  <p className="text-2xl font-black text-tertiary">{best}</p>
                  <p className="text-xs font-semibold text-secondary">{t('最佳', 'Best')}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-3">
                  <p className="text-2xl font-black text-on-surface">{moves}</p>
                  <p className="text-xs font-semibold text-secondary">{t('步数', 'Moves')}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-3">
                  <p className="text-2xl font-black text-on-surface">{remainingCount(board)}</p>
                  <p className="text-xs font-semibold text-secondary">{t('剩余', 'Left')}</p>
                </div>
              </div>

              {message && (
                <p className="mt-4 rounded-2xl bg-primary-container/25 p-3 text-sm font-semibold text-on-primary-container">
                  {message}
                </p>
              )}
              {gameOver && (
                <p className="mt-4 rounded-2xl bg-tertiary-container/35 p-3 text-sm font-semibold text-on-tertiary-container">
                  {t('没有可消除组合，本局结束。', 'No groups left. Game over.')}
                </p>
              )}

              <button
                type="button"
                onClick={reset}
                className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-md transition-colors hover:bg-primary/90"
              >
                <RotateCcw className="h-4 w-4" />
                {t('重新开始', 'Restart')}
              </button>
            </div>

            <div className="rounded-3xl border border-surface-variant/30 bg-white/85 p-5 text-sm leading-7 text-secondary shadow-lg dark:bg-surface-container-high/80">
              {t(
                '提示：优先找大块同色区域，连续消除后上方泡泡会下落，可能形成新的组合。',
                'Tip: clear larger color groups first. Falling bubbles can create new groups.',
              )}
            </div>
          </aside>
        </section>
      </motion.div>
    </div>
  );
}
