import { useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw, Search } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Cell = { row: number; col: number; letter: string };
type Puzzle = { grid: Cell[][]; words: string[]; paths: Record<string, string[]> };

const size = 10;
const words = ['SPRING', 'NEST', 'FOCUS', 'TOOLS', 'STUDY', 'GARDEN'];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
];

function cellId(row: number, col: number) {
  return `${row}-${col}`;
}

function createEmptyGrid() {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
}

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dr: number,
  dc: number,
) {
  for (let index = 0; index < word.length; index += 1) {
    const nextRow = row + dr * index;
    const nextCol = col + dc * index;
    if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) return false;
    if (grid[nextRow][nextCol] && grid[nextRow][nextCol] !== word[index]) return false;
  }
  return true;
}

function createPuzzle(): Puzzle {
  const rawGrid = createEmptyGrid();
  const paths: Record<string, string[]> = {};

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 160 && !placed; attempt += 1) {
      const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (!canPlace(rawGrid, word, row, col, dr, dc)) continue;
      paths[word] = [];
      for (let index = 0; index < word.length; index += 1) {
        const nextRow = row + dr * index;
        const nextCol = col + dc * index;
        rawGrid[nextRow][nextCol] = word[index];
        paths[word].push(cellId(nextRow, nextCol));
      }
      placed = true;
    }
  }

  const grid = rawGrid.map((row, rowIndex) =>
    row.map((letter, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      letter: letter || alphabet[Math.floor(Math.random() * alphabet.length)],
    })),
  );

  return { grid, words, paths };
}

function getPathBetween(start: Cell, end: Cell) {
  const dr = Math.sign(end.row - start.row);
  const dc = Math.sign(end.col - start.col);
  const rowDistance = Math.abs(end.row - start.row);
  const colDistance = Math.abs(end.col - start.col);
  if (!(start.row === end.row || start.col === end.col || rowDistance === colDistance)) return [];

  const steps = Math.max(rowDistance, colDistance);
  return Array.from({ length: steps + 1 }, (_, index) =>
    cellId(start.row + dr * index, start.col + dc * index),
  );
}

export default function WordSearch({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [puzzle, setPuzzle] = useState(() => createPuzzle());
  const [selected, setSelected] = useState<Cell | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const foundCells = useMemo(
    () => new Set(foundWords.flatMap((word) => puzzle.paths[word] ?? [])),
    [foundWords, puzzle.paths],
  );
  const complete = foundWords.length === puzzle.words.length;

  useEffect(() => {
    if (!startedAt || complete) return;
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => window.clearInterval(timer);
  }, [complete, startedAt]);

  function reset() {
    setPuzzle(createPuzzle());
    setSelected(null);
    setFoundWords([]);
    setStartedAt(null);
    setElapsed(0);
  }

  function handleCell(cell: Cell) {
    if (!startedAt) setStartedAt(Date.now());
    if (!selected) {
      setSelected(cell);
      return;
    }

    const path = getPathBetween(selected, cell);
    const matchedWord = puzzle.words.find((word) => {
      const target = puzzle.paths[word] ?? [];
      const reverse = [...target].reverse();
      return (
        path.length === target.length &&
        (path.every((id, index) => id === target[index]) ||
          path.every((id, index) => id === reverse[index]))
      );
    });

    if (matchedWord && !foundWords.includes(matchedWord)) {
      setFoundWords((current) => [...current, matchedWord]);
    }
    setSelected(null);
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

      <div className="space-y-5">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-on-surface">
            <Search className="h-8 w-8 text-primary" />
            {t('找词游戏', 'Word Search')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '点击一个起点，再点击同一行、列或斜线上的终点，找出隐藏单词。',
              'Click a start cell, then an end cell in the same row, column, or diagonal.',
            )}
          </p>
        </div>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-3xl border border-surface-variant/30 bg-white/85 p-4 shadow-lg dark:bg-surface-container-high/80">
            <div
              className="grid aspect-square w-full gap-1"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {puzzle.grid.flat().map((cell) => {
                const id = cellId(cell.row, cell.col);
                const isSelected =
                  selected && selected.row === cell.row && selected.col === cell.col;
                const isFound = foundCells.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleCell(cell)}
                    className={`grid min-h-0 place-items-center rounded-lg text-sm font-black transition sm:text-base ${
                      isFound
                        ? 'bg-primary text-on-primary shadow-sm'
                        : isSelected
                          ? 'bg-tertiary-container text-on-tertiary-container'
                          : 'bg-surface-container-low text-on-surface hover:bg-primary-container/40'
                    }`}
                    aria-label={`${cell.letter} ${cell.row + 1}, ${cell.col + 1}`}
                  >
                    {cell.letter}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-surface-variant/30 bg-white/85 p-5 shadow-lg dark:bg-surface-container-high/80">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-primary-container/30 p-3">
                  <p className="text-2xl font-black text-primary">{foundWords.length}</p>
                  <p className="text-xs font-semibold text-secondary">{t('已找到', 'Found')}</p>
                </div>
                <div className="rounded-2xl bg-tertiary-container/30 p-3">
                  <p className="text-2xl font-black text-tertiary">{Math.floor(elapsed / 1000)}s</p>
                  <p className="text-xs font-semibold text-secondary">{t('用时', 'Time')}</p>
                </div>
              </div>
              {complete && (
                <p className="mt-4 rounded-2xl bg-primary-container/40 p-3 text-sm font-semibold text-on-primary-container">
                  {t('全部找到，完成本局。', 'All words found. Puzzle complete.')}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-md transition-colors hover:bg-primary/90"
              >
                <RotateCcw className="h-4 w-4" />
                {t('换一局', 'New puzzle')}
              </button>
            </div>

            <div className="rounded-3xl border border-surface-variant/30 bg-white/85 p-5 shadow-lg dark:bg-surface-container-high/80">
              <h2 className="text-lg font-bold text-on-surface">{t('单词列表', 'Words')}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {puzzle.words.map((word) => (
                  <span
                    key={word}
                    className={`rounded-full px-3 py-2 text-xs font-black tracking-wide ${
                      foundWords.includes(word)
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-secondary'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
