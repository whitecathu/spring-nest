import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Heart } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PADDLE_HEIGHT = 14;
const PADDLE_WIDTH = 80;
const BALL_SIZE = 12;
const BRICK_ROWS = 6;
const BRICK_COLS = 8;
const BRICK_WIDTH = GAME_WIDTH / BRICK_COLS - 4;
const BRICK_HEIGHT = 22;
const BRICK_GAP = 4;
const BALL_SPEED = 4.5;

type BrickColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

const ROW_COLORS: BrickColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const COLOR_CLASSES: Record<BrickColor, string> = {
  red: 'bg-red-400 border-red-500',
  orange: 'bg-orange-400 border-orange-500',
  yellow: 'bg-yellow-400 border-yellow-500',
  green: 'bg-green-400 border-green-500',
  blue: 'bg-blue-400 border-blue-500',
  purple: 'bg-purple-400 border-purple-500',
};
const COLOR_POINTS: Record<BrickColor, number> = {
  red: 60, orange: 50, yellow: 40, green: 30, blue: 20, purple: 10,
};

interface Brick {
  row: number;
  col: number;
  alive: boolean;
  color: BrickColor;
}

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_brickbreaker_best') || '0'); } catch { return 0; }
}

function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_brickbreaker_best', JSON.stringify(score));
}

function createBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        row: r,
        col: c,
        alive: true,
        color: ROW_COLORS[r % ROW_COLORS.length],
      });
    }
  }
  return bricks;
}

export default function BrickBreaker({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [level, setLevel] = useState(1);

  // Game state refs
  const paddleXRef = useRef((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const ballXRef = useRef(GAME_WIDTH / 2);
  const ballYRef = useRef(GAME_HEIGHT - 60);
  const ballVxRef = useRef(BALL_SPEED * 0.7);
  const ballVyRef = useRef(-BALL_SPEED);
  const bricksRef = useRef<Brick[]>(createBricks());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const playingRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRectRef = useRef<DOMRect | null>(null);

  // Render state
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [ballPos, setBallPos] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
  const [bricks, setBricks] = useState<Brick[]>(createBricks());
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; id: number; vx: number; vy: number }[]>([]);

  const [gameScale, setGameScale] = useState(1);

  // Ball trail
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  // Screen shake
  const [shakeBoard, setShakeBoard] = useState(false);

  // Life lost flash
  const [lifeLostFlash, setLifeLostFlash] = useState(false);

  // Responsive scaling
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setGameScale(Math.min(1, w / GAME_WIDTH));
        containerRectRef.current = containerRef.current.getBoundingClientRect();
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const launchBall = useCallback(() => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    ballVxRef.current = BALL_SPEED * Math.cos(angle);
    ballVyRef.current = BALL_SPEED * Math.sin(angle);
    ballXRef.current = paddleXRef.current + PADDLE_WIDTH / 2;
    ballYRef.current = GAME_HEIGHT - 60;
  }, []);

  const startGame = useCallback(() => {
    paddleXRef.current = (GAME_WIDTH - PADDLE_WIDTH) / 2;
    bricksRef.current = createBricks();
    scoreRef.current = 0;
    livesRef.current = 3;
    playingRef.current = true;
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    setBricks([...bricksRef.current]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setParticles([]);
    trailRef.current = [];
    setTrail([]);
    setShakeBoard(false);
    setLifeLostFlash(false);
    setGameState('playing');
    launchBall();
  }, [launchBall]);

  const nextLevel = useCallback(() => {
    bricksRef.current = createBricks();
    setBricks([...bricksRef.current]);
    setLevel(l => {
      const newLevel = l + 1;
      // Increase ball speed by 8% per level
      const speedMult = 1 + (newLevel - 1) * 0.08;
      const currentSpeed = Math.sqrt(ballVxRef.current ** 2 + ballVyRef.current ** 2);
      const targetSpeed = BALL_SPEED * speedMult;
      if (currentSpeed > 0) {
        const ratio = targetSpeed / currentSpeed;
        ballVxRef.current *= ratio;
        ballVyRef.current *= ratio;
      }
      return newLevel;
    });
    paddleXRef.current = (GAME_WIDTH - PADDLE_WIDTH) / 2;
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    trailRef.current = [];
    setTrail([]);
    launchBall();
  }, [launchBall]);

  // Touch drag for paddle
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    if (!containerRectRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = containerRectRef.current;
    const touchX = e.touches[0].clientX - rect.left;
    const scaledX = touchX / gameScale;
    const newX = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, scaledX - PADDLE_WIDTH / 2));
    paddleXRef.current = newX;
    setPaddleX(newX);
  }, [gameScale]);

  // Mouse move for paddle
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    if (!containerRectRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = containerRectRef.current;
    const mouseX = e.clientX - rect.left;
    const scaledX = mouseX / gameScale;
    const newX = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, scaledX - PADDLE_WIDTH / 2));
    paddleXRef.current = newX;
    setPaddleX(newX);
  }, [gameScale]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();
    let particleId = 0;

    const loop = (now: number) => {
      if (!playingRef.current) return;

      const dt = Math.min(now - lastTime, 33);
      lastTime = now;

      // Update ball
      ballXRef.current += ballVxRef.current;
      ballYRef.current += ballVyRef.current;

      // Update trail
      trailRef.current.push({ x: ballXRef.current, y: ballYRef.current });
      if (trailRef.current.length > 8) trailRef.current.shift();
      setTrail([...trailRef.current]);

      // Wall collisions
      if (ballXRef.current <= 0) {
        ballXRef.current = 0;
        ballVxRef.current = Math.abs(ballVxRef.current);
      }
      if (ballXRef.current >= GAME_WIDTH - BALL_SIZE) {
        ballXRef.current = GAME_WIDTH - BALL_SIZE;
        ballVxRef.current = -Math.abs(ballVxRef.current);
      }
      if (ballYRef.current <= 0) {
        ballYRef.current = 0;
        ballVyRef.current = Math.abs(ballVyRef.current);
      }

      // Bottom - lose life
      if (ballYRef.current >= GAME_HEIGHT - BALL_SIZE) {
        livesRef.current--;
        setLives(livesRef.current);
        setShakeBoard(true);
        setLifeLostFlash(true);
        setTimeout(() => setShakeBoard(false), 300);
        setTimeout(() => setLifeLostFlash(false), 300);

        if (livesRef.current <= 0) {
          playingRef.current = false;
          setGameState('lost');
          const s = scoreRef.current;
          const best = loadBestScore();
          if (s > best) {
            saveBestScore(s);
            setBestScore(s);
          }
          return;
        }

        // Reset ball position
        ballXRef.current = paddleXRef.current + PADDLE_WIDTH / 2;
        ballYRef.current = GAME_HEIGHT - 60;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        ballVxRef.current = BALL_SPEED * Math.cos(angle);
        ballVyRef.current = BALL_SPEED * Math.sin(angle);
      }

      // Paddle collision
      const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - 20;
      if (
        ballYRef.current + BALL_SIZE >= paddleTop &&
        ballYRef.current + BALL_SIZE <= paddleTop + PADDLE_HEIGHT + 4 &&
        ballXRef.current + BALL_SIZE >= paddleXRef.current &&
        ballXRef.current <= paddleXRef.current + PADDLE_WIDTH &&
        ballVyRef.current > 0
      ) {
        // Calculate bounce angle based on where ball hit paddle
        const hitPos = (ballXRef.current + BALL_SIZE / 2 - paddleXRef.current) / PADDLE_WIDTH;
        let angle = -Math.PI / 2 + (hitPos - 0.5) * 1.2;
        // Clamp angle: prevent too horizontal or too vertical bounces
        if (angle > -0.15 && angle < 0.15) angle = angle < 0 ? -0.35 : 0.35;
        if (Math.abs(angle) < 0.3) angle = angle < 0 ? -0.5 : 0.5;
        if (angle > -Math.PI / 2 - 0.25 && angle < -Math.PI / 2 + 0.25) {
          angle = angle < -Math.PI / 2 ? -Math.PI / 2 - 0.4 : -Math.PI / 2 + 0.4;
        }
        const speed = Math.sqrt(ballVxRef.current ** 2 + ballVyRef.current ** 2);
        ballVxRef.current = speed * Math.cos(angle);
        ballVyRef.current = speed * Math.sin(angle);
        ballYRef.current = paddleTop - BALL_SIZE;
      }

      // Brick collisions
      let hitBrick = false;
      const newParticles: { x: number; y: number; color: string; id: number; vx: number; vy: number }[] = [];
      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;

        const brickX = brick.col * (BRICK_WIDTH + BRICK_GAP) + BRICK_GAP / 2;
        const brickY = brick.row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_GAP / 2 + 40;

        if (
          ballXRef.current + BALL_SIZE > brickX &&
          ballXRef.current < brickX + BRICK_WIDTH &&
          ballYRef.current + BALL_SIZE > brickY &&
          ballYRef.current < brickY + BRICK_HEIGHT
        ) {
          brick.alive = false;
          hitBrick = true;
          scoreRef.current += COLOR_POINTS[brick.color];
          setScore(scoreRef.current);

          // Spawn particles
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.8;
            const spd = 2 + Math.random() * 3;
            newParticles.push({
              x: brickX + BRICK_WIDTH / 2,
              y: brickY + BRICK_HEIGHT / 2,
              color: brick.color,
              id: particleId++,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 2,
            });
          }

          // Determine bounce direction
          const ballCenterX = ballXRef.current + BALL_SIZE / 2;
          const ballCenterY = ballYRef.current + BALL_SIZE / 2;
          const brickCenterX = brickX + BRICK_WIDTH / 2;
          const brickCenterY = brickY + BRICK_HEIGHT / 2;

          const dx = ballCenterX - brickCenterX;
          const dy = ballCenterY - brickCenterY;

          if (Math.abs(dx / BRICK_WIDTH) > Math.abs(dy / BRICK_HEIGHT)) {
            ballVxRef.current = Math.abs(ballVxRef.current) * Math.sign(dx);
          } else {
            ballVyRef.current = Math.abs(ballVyRef.current) * Math.sign(dy);
          }

          break; // Only one brick per frame
        }
      }

      if (hitBrick) {
        setBricks([...bricksRef.current]);
      }

      if (newParticles.length > 0) {
        setParticles(prev => [...prev, ...newParticles]);
        // Remove particles after animation
        setTimeout(() => {
          setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
        }, 600);
      }

      // Check win
      if (bricksRef.current.every(b => !b.alive)) {
        playingRef.current = false;
        setGameState('won');
        const s = scoreRef.current;
        const best = loadBestScore();
        if (s > best) {
          saveBestScore(s);
          setBestScore(s);
        }
        return;
      }

      // Update render
      setBallPos({ x: ballXRef.current, y: ballYRef.current });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    };
  }, [gameState]);

  // Cleanup
  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - 20;

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('打砖块', 'Brick Breaker')}</h1>
            <p className="text-sm text-secondary">{t('用挡板弹球消灭砖块！', 'Bounce the ball to break bricks!')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-3 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div className="text-lg font-bold text-primary tabular-nums">{score}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-3 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
              <div className="text-lg font-bold text-tertiary tabular-nums">{bestScore}</div>
            </div>
          </div>
        </div>

        {/* Lives & Level */}
        <div className="flex justify-between items-center mb-2 max-w-md mx-auto">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${i < lives ? 'text-red-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <div className="text-sm font-semibold text-secondary">
            {t('关卡', 'Level')} {level}
          </div>
        </div>

        {/* Game Area */}
        <div ref={containerRef} className="flex justify-center mb-4">
          <motion.div
            animate={shakeBoard ? { x: [0, -5, 5, -3, 3, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gray-900 dark:bg-gray-950 cursor-none select-none touch-none"
            style={{
              width: GAME_WIDTH * gameScale,
              height: GAME_HEIGHT * gameScale,
            }}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchMove}
            onMouseMove={handleMouseMove}
          >
            {/* Bricks */}
            {bricks.map((brick, i) => {
              if (!brick.alive) return null;
              const x = brick.col * (BRICK_WIDTH + BRICK_GAP) + BRICK_GAP / 2;
              const y = brick.row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_GAP / 2 + 40;
              return (
                <div
                  key={i}
                  className={`absolute rounded-md border ${COLOR_CLASSES[brick.color]}`}
                  style={{
                    left: x * gameScale,
                    top: y * gameScale,
                    width: BRICK_WIDTH * gameScale,
                    height: BRICK_HEIGHT * gameScale,
                  }}
                />
              );
            })}

            {/* Particles */}
            {particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0, x: p.vx * 15, y: p.vy * 15 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`absolute w-2 h-2 rounded-full ${COLOR_CLASSES[p.color]?.split(' ')[0] || 'bg-white'}`}
                style={{
                  left: p.x * gameScale,
                  top: p.y * gameScale,
                }}
              />
            ))}

            {/* Paddle */}
            <div
              className="absolute bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
              style={{
                left: paddleX * gameScale,
                top: paddleTop * gameScale,
                width: PADDLE_WIDTH * gameScale,
                height: PADDLE_HEIGHT * gameScale,
              }}
            />

            {/* Ball Trail */}
            {trail.map((pos, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/20"
                style={{
                  left: (pos.x + BALL_SIZE / 2 - (BALL_SIZE * (0.3 + i * 0.06)) / 2) * gameScale,
                  top: (pos.y + BALL_SIZE / 2 - (BALL_SIZE * (0.3 + i * 0.06)) / 2) * gameScale,
                  width: BALL_SIZE * (0.3 + i * 0.06) * gameScale,
                  height: BALL_SIZE * (0.3 + i * 0.06) * gameScale,
                  opacity: (i + 1) / trail.length * 0.4,
                }}
              />
            ))}

            {/* Ball */}
            <div
              className="absolute bg-white rounded-full shadow-lg shadow-white/30"
              style={{
                left: ballPos.x * gameScale,
                top: ballPos.y * gameScale,
                width: BALL_SIZE * gameScale,
                height: BALL_SIZE * gameScale,
              }}
            />

            {/* Life Lost Flash */}
            {lifeLostFlash && (
              <div className="absolute inset-0 bg-red-500/30 pointer-events-none z-5 animate-pulse" />
            )}

            {/* Idle / Game Over Overlay */}
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                {gameState === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-5xl mb-3">🧱</p>
                    <p className="text-xl font-bold text-white mb-2">
                      {t('点击开始', 'Tap to Start')}
                    </p>
                    <p className="text-sm text-white/80">
                      {t('滑动或移动鼠标控制挡板', 'Swipe or move mouse to control paddle')}
                    </p>
                  </motion.div>
                )}
                {gameState === 'won' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-center bg-white/90 dark:bg-gray-800/90 rounded-2xl p-6 mx-4"
                  >
                    <p className="text-2xl font-bold text-on-surface mb-2">{t('通关！', 'Level Clear!')}</p>
                    <p className="text-5xl mb-3">🎉</p>
                    <p className="text-3xl font-black text-primary mb-1">{score}</p>
                    <p className="text-sm text-secondary mb-1">{t('得分', 'Score')}</p>
                    {score > 0 && score === bestScore && (
                      <p className="text-sm text-green-500 mb-3">🏆 {t('新纪录！', 'New Record!')}</p>
                    )}
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); nextLevel(); }}
                        className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold min-h-[48px]"
                      >
                        {t('下一关', 'Next Level')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); startGame(); }}
                        className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold min-h-[48px]"
                      >
                        {t('重新开始', 'Restart')}
                      </button>
                    </div>
                  </motion.div>
                )}
                {gameState === 'lost' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-center bg-white/90 dark:bg-gray-800/90 rounded-2xl p-6 mx-4"
                  >
                    <p className="text-2xl font-bold text-on-surface mb-2">{t('游戏结束', 'Game Over')}</p>
                    <p className="text-5xl mb-3">😵</p>
                    <p className="text-3xl font-black text-primary mb-1">{score}</p>
                    <p className="text-sm text-secondary mb-1">{t('得分', 'Score')}</p>
                    {score > 0 && score === bestScore && (
                      <p className="text-sm text-green-500 mb-3">🏆 {t('新纪录！', 'New Record!')}</p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); startGame(); }}
                      className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold min-h-[48px]"
                    >
                      {t('再来一局', 'Play Again')}
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Controls */}
        {gameState === 'playing' && (
          <div className="flex justify-center gap-4">
            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 min-h-[48px]"
            >
              <RotateCcw className="w-5 h-5" />
              {t('重新开始', 'Restart')}
            </motion.button>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('在游戏区域内滑动或移动鼠标来控制挡板', 'Swipe or move mouse within the game area to control the paddle')}
        </div>
      </motion.div>
    </div>
  );
}
