import { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { loadBestScore, saveBestScore } from '../../lib/gameScore';

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

const SPEEDS: Record<
  Difficulty,
  { base: number; min: number; label: [string, string]; desc: [string, string] }
> = {
  easy: {
    base: 220,
    min: 140,
    label: ['轻松', 'Easy'],
    desc: ['适合新手，移动更慢', 'Slower, great for beginners'],
  },
  normal: { base: 160, min: 100, label: ['普通', 'Normal'], desc: ['经典速度', 'Classic speed'] },
  hard: { base: 110, min: 70, label: ['挑战', 'Hard'], desc: ['更快节奏', 'Faster pace'] },
};

function getSpeed(difficulty: Difficulty, score: number): number {
  const cfg = SPEEDS[difficulty];
  return Math.max(cfg.min, cfg.base - score * 2);
}

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const available: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y });
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}

// ── Particle burst for eating food ──
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  size: number;
}

interface ScorePopup {
  id: number;
  cellX: number;
  cellY: number;
}

const EAT_EMOJIS = ['✨', '🍎', '⭐', '💫', '🌟'];

export default function Snake({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => loadBestScore('snake'));
  const [snake, setSnake] = useState<Point[]>([{ x: 5, y: 5 }]);
  const [food, setFood] = useState<Point>({ x: 7, y: 5 });
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const difficultyRef = useRef<Difficulty>('easy');

  // Animation states
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [deadSnake, setDeadSnake] = useState(false);
  const [shakeBoard, setShakeBoard] = useState(false);

  const directionRef = useRef<Direction>('right');
  const nextDirectionRef = useRef<Direction>('right');
  const snakeRef = useRef<Point[]>([{ x: 5, y: 5 }]);
  const foodRef = useRef<Point>({ x: 7, y: 5 });
  const scoreRef = useRef(0);
  const playingRef = useRef(false);
  const gameOverRef = useRef(false);
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const popupIdRef = useRef(0);

  const clearLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  // Spawn particle burst at grid cell position
  const spawnParticles = useCallback((cellX: number, cellY: number) => {
    const newParticles: Particle[] = [];
    const count = 3;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const speed = 1.5 + Math.random() * 2;
      newParticles.push({
        id: particleIdRef.current++,
        x: cellX,
        y: cellY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        emoji: EAT_EMOJIS[Math.floor(Math.random() * EAT_EMOJIS.length)],
        size: 10 + Math.random() * 6,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  }, []);

  // Spawn floating "+1" score popup
  const spawnScorePopup = useCallback((cellX: number, cellY: number) => {
    const id = popupIdRef.current++;
    setScorePopups((prev) => [...prev, { id, cellX, cellY }]);
    setTimeout(() => {
      setScorePopups((prev) => prev.filter((p) => p.id !== id));
    }, 1000);
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
      setDeadSnake(true);
      setGameOver(true);
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 500);
      clearLoop();
      return;
    }

    // Self collision
    if (currentSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      playingRef.current = false;
      gameOverRef.current = true;
      setPlaying(false);
      setDeadSnake(true);
      setGameOver(true);
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 500);
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
      if (newScore > loadBestScore('snake')) {
        saveBestScore('snake', newScore);
        setBestScore(newScore);
      }
      const nf = randomFood(newSnake);
      foodRef.current = nf;
      setFood(nf);

      // Particle burst + score popup at the eaten food location
      spawnParticles(currentFood.x, currentFood.y);
      spawnScorePopup(currentFood.x, currentFood.y);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    setSnake([...newSnake]);

    if (playingRef.current && !gameOverRef.current) {
      gameLoopRef.current = setTimeout(tick, getSpeed(difficultyRef.current, scoreRef.current));
    }
  }, [clearLoop, spawnParticles, spawnScorePopup]);

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
    setDeadSnake(false);
    setParticles([]);
    setScorePopups([]);
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
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        W: 'up',
        S: 'down',
        A: 'left',
        D: 'right',
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

  // Board shake animation keyframes
  const boardShakeVariants = {
    shaking: {
      x: [0, -6, 6, -4, 4, -2, 0],
      transition: { duration: 0.4, ease: 'easeInOut' as const },
    },
    still: { x: 0 },
  };

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('贪吃蛇', 'Snake')}</h1>
            <p className="text-sm text-secondary">
              {t('吃掉食物，不断成长！', 'Eat food and keep growing!')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div key={score} className="text-xl font-bold text-primary tabular-nums">
                {score}
              </div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {t('最佳', 'Best')}
              </div>
              <div className="text-xl font-bold text-tertiary tabular-nums">{bestScore}</div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div
          ref={boardRef}
          className="relative bg-surface-container-high rounded-2xl p-2 mb-4 touch-none select-none overflow-hidden"
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
              const snakeIndex = snake.findIndex((p) => p.x === x && p.y === y);
              const isSnake = snakeIndex >= 0;
              const isHead = snake[0]?.x === x && snake[0]?.y === y;
              const isFood = food.x === x && food.y === y;

              // Checkerboard background
              const isCheckerLight = (x + y) % 2 === 0;

              let cellBg: string;
              if (isFood) {
                cellBg = 'bg-orange-100 dark:bg-orange-900/30';
              } else if (isHead) {
                cellBg = deadSnake ? 'bg-red-500' : 'bg-emerald-600';
              } else if (isSnake) {
                cellBg = deadSnake
                  ? 'bg-red-400'
                  : isCheckerLight
                    ? 'bg-emerald-400'
                    : 'bg-emerald-500';
              } else {
                cellBg = isCheckerLight
                  ? 'bg-surface-container-lowest/40'
                  : 'bg-surface-container-lowest/60';
              }

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-sm flex items-center justify-center text-xs ${cellBg}`}
                >
                  {isHead && <div className="w-[85%] h-[85%] rounded-sm" />}
                  {isFood && <span className="drop-shadow-sm">🍎</span>}
                </div>
              );
            })}
          </div>

          {/* Particle layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => {
              const cellPercent = 100 / GRID_SIZE;
              const px = (p.x + 0.5) * cellPercent;
              const py = (p.y + 0.5) * cellPercent;
              return (
                <div
                  key={p.id}
                  className="absolute text-center"
                  style={{ fontSize: `${p.size}px` }}
                >
                  {p.emoji}
                </div>
              );
            })}
          </div>

          {/* Score popup layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {scorePopups.map((p) => {
              const cellPercent = 100 / GRID_SIZE;
              const px = (p.cellX + 0.5) * cellPercent;
              const py = (p.cellY + 0.5) * cellPercent;
              return (
                <div
                  key={p.id}
                  className="absolute font-black text-lg text-emerald-500 drop-shadow-md"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                >
                  +1
                </div>
              );
            })}
          </div>
        </div>

        {/* D-Pad Controls for mobile */}
        {playing && !gameOver && (
          <div className="grid grid-cols-3 gap-2 w-48 mx-auto mb-4">
            <div />
            <button
              onClick={() => handleDirection('up')}
              className="w-full aspect-square bg-gradient-to-b from-surface-container-high to-surface-container-highest rounded-xl text-on-surface font-bold text-2xl flex items-center justify-center min-h-[48px] shadow-md hover:shadow-lg transition-shadow border border-surface-variant/30"
            >
              ↑
            </button>
            <div />
            <button
              onClick={() => handleDirection('left')}
              className="w-full aspect-square bg-gradient-to-b from-surface-container-high to-surface-container-highest rounded-xl text-on-surface font-bold text-2xl flex items-center justify-center min-h-[48px] shadow-md hover:shadow-lg transition-shadow border border-surface-variant/30"
            >
              ←
            </button>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-surface-variant/40" />
            </div>
            <button
              onClick={() => handleDirection('right')}
              className="w-full aspect-square bg-gradient-to-b from-surface-container-high to-surface-container-highest rounded-xl text-on-surface font-bold text-2xl flex items-center justify-center min-h-[48px] shadow-md hover:shadow-lg transition-shadow border border-surface-variant/30"
            >
              →
            </button>
            <div />
            <button
              onClick={() => handleDirection('down')}
              className="w-full aspect-square bg-gradient-to-b from-surface-container-high to-surface-container-highest rounded-xl text-on-surface font-bold text-2xl flex items-center justify-center min-h-[48px] shadow-md hover:shadow-lg transition-shadow border border-surface-variant/30"
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
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
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

        {/* Game Over Panel - matched to WhackAMole style */}
        {gameOver && (
          <div className="mt-6 p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700/30 rounded-2xl text-center">
            <p className="text-3xl mb-2">🐍</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {t('游戏结束', 'Game Over')}
            </p>
            <p className="text-xl font-bold text-orange-500 mb-1">
              {t('得分', 'Score')}: {score}
            </p>
            <p className="text-xs text-orange-400 mb-1">
              {t('难度', 'Difficulty')}: {t(...SPEEDS[difficulty].label)}
            </p>
            {score > 0 && score === bestScore && (
              <p className="text-sm text-orange-500 mb-4">🏆 {t('新纪录！', 'New Record!')}</p>
            )}
            <button
              onClick={startGame}
              className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors min-h-[48px]"
            >
              {t('再来一局', 'Play Again')}
            </button>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t(
            '方向键/WASD 控制移动，手机可滑动或点击方向按钮',
            'Arrow keys/WASD to move, swipe or tap direction buttons on mobile',
          )}
        </div>
      </div>
    </div>
  );
}
