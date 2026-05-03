import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const GRID_SIZE = 10;
type Direction = 'up' | 'down' | 'left' | 'right';
type Point = { x: number; y: number };
type Difficulty = 'easy' | 'normal' | 'hard';

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const SPEEDS: Record<Difficulty, { base: number; min: number; label: [string, string]; desc: [string, string] }> = {
  easy:   { base: 220, min: 140, label: ['轻松', 'Easy'],   desc: ['适合新手，移动更慢', 'Slower, great for beginners'] },
  normal: { base: 160, min: 100, label: ['普通', 'Normal'], desc: ['经典速度', 'Classic speed'] },
  hard:   { base: 110, min: 70,  label: ['挑战', 'Hard'],   desc: ['更快节奏', 'Faster pace'] },
};

function getSpeed(difficulty: Difficulty, score: number): number {
  const cfg = SPEEDS[difficulty];
  return Math.max(cfg.min, cfg.base - score * 2);
}

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
  const available: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y });
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_snake_best') || '0'); } catch { return 0; }
}

function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_snake_best', JSON.stringify(score));
}

export default function Snake({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [snake, setSnake] = useState<Point[]>([{ x: 5, y: 5 }]);
  const [food, setFood] = useState<Point>({ x: 7, y: 5 });
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const difficultyRef = useRef<Difficulty>('easy');

  const directionRef = useRef<Direction>('right');
  const nextDirectionRef = useRef<Direction>('right');
  const snakeRef = useRef<Point[]>([{ x: 5, y: 5 }]);
  const foodRef = useRef<Point>({ x: 7, y: 5 });
  const scoreRef = useRef(0);
  const playingRef = useRef(false);
  const gameOverRef = useRef(false);
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const clearLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (!playingRef.current || gameOverRef.current) return;

    const currentSnake = snakeRef.current;
    const currentFood = foodRef.current;
    const dir = nextDirectionRef.current;
    directionRef.current = dir;

    const head = currentSnake[0];
    const vec = DIRECTION_VECTORS[dir];
    const newHead: Point = { x: head.x + vec.x, y: head.y + vec.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      playingRef.current = false;
      gameOverRef.current = true;
      setPlaying(false);
      setGameOver(true);
      clearLoop();
      return;
    }

    // Self collision
    if (currentSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      playingRef.current = false;
      gameOverRef.current = true;
      setPlaying(false);
      setGameOver(true);
      clearLoop();
      return;
    }

    const newSnake = [newHead, ...currentSnake];
    let ate = false;

    if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
      ate = true;
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      if (newScore > loadBestScore()) {
        saveBestScore(newScore);
        setBestScore(newScore);
      }
      const nf = randomFood(newSnake);
      foodRef.current = nf;
      setFood(nf);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    setSnake([...newSnake]);

    if (playingRef.current && !gameOverRef.current) {
      gameLoopRef.current = setTimeout(tick, getSpeed(difficultyRef.current, scoreRef.current));
    }
  }, [clearLoop]);

  const startGame = useCallback(() => {
    clearLoop();
    const initialSnake = [{ x: 5, y: 5 }];
    const initialFood = randomFood(initialSnake);
    snakeRef.current = initialSnake;
    foodRef.current = initialFood;
    scoreRef.current = 0;
    directionRef.current = 'right';
    nextDirectionRef.current = 'right';
    playingRef.current = true;
    gameOverRef.current = false;
    setSnake(initialSnake);
    setFood(initialFood);
    setScore(0);
    setPlaying(true);
    setGameOver(false);
    gameLoopRef.current = setTimeout(tick, getSpeed(difficultyRef.current, 0));
  }, [clearLoop, tick]);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    if (playingRef.current && !gameOverRef.current) return;
    setDifficulty(d);
    difficultyRef.current = d;
  }, []);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      clearLoop();
    };
  }, [clearLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        if (dir !== OPPOSITE[directionRef.current]) {
          nextDirectionRef.current = dir;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Swipe controls
  const touchStartRef = useRef<Point>({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    let dir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }
    if (dir !== OPPOSITE[directionRef.current]) {
      nextDirectionRef.current = dir;
    }
  }, []);

  // Direction buttons for mobile
  const handleDirection = useCallback((dir: Direction) => {
    if (!playingRef.current || gameOverRef.current) return;
    if (dir !== OPPOSITE[directionRef.current]) {
      nextDirectionRef.current = dir;
    }
  }, []);

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
            <h1 className="text-3xl font-black text-on-surface">{t('贪吃蛇', 'Snake')}</h1>
            <p className="text-sm text-secondary">{t('吃掉食物，不断成长！', 'Eat food and keep growing!')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div className="text-xl font-bold text-primary tabular-nums">{score}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
              <div className="text-xl font-bold text-tertiary tabular-nums">{bestScore}</div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div
          ref={boardRef}
          className="bg-surface-container-high rounded-2xl p-2 mb-4 touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnake = snake.some(p => p.x === x && p.y === y);
              const isHead = snake[0]?.x === x && snake[0]?.y === y;
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-sm flex items-center justify-center text-xs ${
                    isFood
                      ? 'bg-orange-100'
                      : isHead
                        ? 'bg-emerald-500'
                        : isSnake
                          ? 'bg-emerald-400'
                          : 'bg-surface-container-lowest/50'
                  }`}
                >
                  {isFood && '🍎'}
                </div>
              );
            })}
          </div>
        </div>

        {/* D-Pad Controls for mobile */}
        {playing && !gameOver && (
          <div className="grid grid-cols-3 gap-2 w-40 mx-auto mb-4">
            <div />
            <button
              onClick={() => handleDirection('up')}
              className="w-full aspect-square bg-surface-container-high rounded-xl text-on-surface font-bold text-xl flex items-center justify-center active:scale-90 transition-transform min-h-[44px]"
            >
              ↑
            </button>
            <div />
            <button
              onClick={() => handleDirection('left')}
              className="w-full aspect-square bg-surface-container-high rounded-xl text-on-surface font-bold text-xl flex items-center justify-center active:scale-90 transition-transform min-h-[44px]"
            >
              ←
            </button>
            <div />
            <button
              onClick={() => handleDirection('right')}
              className="w-full aspect-square bg-surface-container-high rounded-xl text-on-surface font-bold text-xl flex items-center justify-center active:scale-90 transition-transform min-h-[44px]"
            >
              →
            </button>
            <div />
            <button
              onClick={() => handleDirection('down')}
              className="w-full aspect-square bg-surface-container-high rounded-xl text-on-surface font-bold text-xl flex items-center justify-center active:scale-90 transition-transform min-h-[44px]"
            >
              ↓
            </button>
            <div />
          </div>
        )}

        {/* Difficulty Selection */}
        <div className="mb-4">
          <p className="text-xs text-secondary text-center mb-2">{t('难度', 'Difficulty')}</p>
          <div className="flex justify-center gap-2">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                disabled={playing && !gameOver}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-[44px] ${
                  difficulty === d
                    ? 'bg-primary text-on-primary'
                    : playing && !gameOver
                      ? 'bg-surface-container-lowest/30 text-on-surface/30 cursor-default'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
                }`}
              >
                {t(...SPEEDS[d].label)}
              </button>
            ))}
          </div>
          <p className="text-xs text-secondary text-center mt-1.5">
            {t(...SPEEDS[difficulty].desc)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!playing && !gameOver && (
            <button
              onClick={startGame}
              className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {t('开始游戏', 'Start Game')}
            </button>
          )}
          {(playing || gameOver) && (
            <button
              onClick={startGame}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {t('重新开始', 'Restart')}
            </button>
          )}
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-2xl text-center"
            >
              <p className="text-2xl mb-2">{t('游戏结束', 'Game Over')}</p>
              <p className="text-xl font-bold text-orange-600 mb-1">{t('得分', 'Score')}: {score}</p>
              <p className="text-xs text-orange-400 mb-1">{t('难度', 'Difficulty')}: {t(...SPEEDS[difficulty].label)}</p>
              {score > 0 && score === bestScore && (
                <p className="text-sm text-orange-500 mb-4">🏆 {t('新纪录！', 'New Record!')}</p>
              )}
              <div className="flex justify-center gap-3">
                <button onClick={startGame} className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors min-h-[44px]">
                  {t('再来一局', 'Play Again')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('方向键/WASD 控制移动，手机可滑动或点击方向按钮', 'Arrow keys/WASD to move, swipe or tap direction buttons on mobile')}
        </div>
      </motion.div>
    </div>
  );
}
