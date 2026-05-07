import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Heart, Zap } from 'lucide-react';
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
const TRAIL_LENGTH = 15;

type BrickColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

interface Brick {
  row: number;
  col: number;
  alive: boolean;
  color: BrickColor;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  animDelay: number;
}

interface Particle {
  x: number;
  y: number;
  color: string;
  id: number;
  vx: number;
  vy: number;
  size: number;
}

interface BrickFlash {
  x: number;
  y: number;
  color: BrickColor;
  id: number;
}

const ROW_COLORS: BrickColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const COLOR_CLASSES: Record<BrickColor, string> = {
  red: 'bg-red-400 border-red-500',
  orange: 'bg-orange-400 border-orange-500',
  yellow: 'bg-yellow-400 border-yellow-500',
  green: 'bg-green-400 border-green-500',
  blue: 'bg-blue-400 border-blue-500',
  purple: 'bg-purple-400 border-purple-500',
};
const COLOR_HEX: Record<BrickColor, string> = {
  red: '#f87171',
  orange: '#fb923c',
  yellow: '#facc15',
  green: '#4ade80',
  blue: '#60a5fa',
  purple: '#c084fc',
};
const COLOR_POINTS: Record<BrickColor, number> = {
  red: 60, orange: 50, yellow: 40, green: 30, blue: 20, purple: 10,
};

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      opacity: 0.15 + Math.random() * 0.4,
      animDelay: Math.random() * 4,
    });
  }
  return stars;
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gameScale, setGameScale] = useState(1);

  // Ball trail
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  // Ball visual
  const ballRotationRef = useRef(0);
  const [ballSquash, setBallSquash] = useState(false);

  // Paddle visual
  const [paddleHitFlash, setPaddleHitFlash] = useState(false);

  // Screen shake
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeIntensityRef = useRef(0);

  // Life lost flash
  const [lifeLostFlash, setLifeLostFlash] = useState(false);

  // Level banner & transition
  const [levelBannerLevel, setLevelBannerLevel] = useState<number | null>(null);
  const levelBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levelFlash, setLevelFlash] = useState(false);

  // Combo tracking
  const lastBrickHitTimeRef = useRef(0);
  const comboCountRef = useRef(0);
  const [comboDisplay, setComboDisplay] = useState(0);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Brick flash effects
  const [brickFlashes, setBrickFlashes] = useState<BrickFlash[]>([]);
  const flashIdRef = useRef(0);

  // Stars background
  const [stars] = useState<Star[]>(generateStars);

  // Touch state
  const [touchActive, setTouchActive] = useState(false);

  const triggerShake = useCallback((intensity: number, duration: number) => {
    if (intensity > shakeIntensityRef.current) {
      shakeIntensityRef.current = intensity;
      setShakeIntensity(intensity);
    }
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => {
      shakeIntensityRef.current = 0;
      setShakeIntensity(0);
    }, duration);
  }, []);

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
    setShakeIntensity(0);
    shakeIntensityRef.current = 0;
    if (shakeTimeoutRef.current) { clearTimeout(shakeTimeoutRef.current); shakeTimeoutRef.current = null; }
    setLifeLostFlash(false);
    setComboDisplay(0);
    comboCountRef.current = 0;
    lastBrickHitTimeRef.current = 0;
    setBrickFlashes([]);
    setLevelBannerLevel(null);
    setLevelFlash(false);
    setBallSquash(false);
    setPaddleHitFlash(false);
    setGameState('playing');
    launchBall();
  }, [launchBall]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;

    // Level transition sequence: flash then delayed brick setup
    setLevelFlash(true);
    setTimeout(() => setLevelFlash(false), 300);

    // Show level banner
    setLevelBannerLevel(newLevel);
    if (levelBannerTimeoutRef.current) clearTimeout(levelBannerTimeoutRef.current);
    levelBannerTimeoutRef.current = setTimeout(() => setLevelBannerLevel(null), 1500);

    // Increase ball speed by 12% per level (more noticeable)
    const speedMult = 1 + (newLevel - 1) * 0.12;
    const currentSpeed = Math.sqrt(ballVxRef.current ** 2 + ballVyRef.current ** 2);
    const targetSpeed = BALL_SPEED * speedMult;
    if (currentSpeed > 0) {
      const ratio = targetSpeed / currentSpeed;
      ballVxRef.current *= ratio;
      ballVyRef.current *= ratio;
    }

    setTimeout(() => {
      bricksRef.current = createBricks();
      setBricks([...bricksRef.current]);
      setLevel(newLevel);
      paddleXRef.current = (GAME_WIDTH - PADDLE_WIDTH) / 2;
      setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
      trailRef.current = [];
      setTrail([]);
      setParticles([]);
      setComboDisplay(0);
      setBrickFlashes([]);
      playingRef.current = true;
      setGameState('playing');
      launchBall();
    }, 400);
  }, [launchBall, level]);

  // Paddle positioning helper
  const updatePaddleFromX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    if (!containerRectRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = containerRectRef.current;
    const x = clientX - rect.left;
    const scaledX = x / gameScale;
    const newX = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, scaledX - PADDLE_WIDTH / 2));
    paddleXRef.current = newX;
    setPaddleX(newX);
  }, [gameScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    updatePaddleFromX(e.touches[0].clientX);
  }, [updatePaddleFromX]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchActive(true);
    e.preventDefault();
    updatePaddleFromX(e.touches[0].clientX);
  }, [updatePaddleFromX]);

  const handleTouchEnd = useCallback(() => {
    setTouchActive(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updatePaddleFromX(e.clientX);
  }, [updatePaddleFromX]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();
    let particleId = 0;

    const loop = (now: number) => {
      if (!playingRef.current) return;

      const dt = Math.min(now - lastTime, 33);
      lastTime = now;

      // Enforce minimum vertical speed to prevent horizontal loops
      const currentSpeed = Math.sqrt(ballVxRef.current ** 2 + ballVyRef.current ** 2);
      const MIN_VY_RATIO = 0.25;
      if (Math.abs(ballVyRef.current) < currentSpeed * MIN_VY_RATIO && currentSpeed > 0) {
        const minVy = currentSpeed * MIN_VY_RATIO;
        ballVyRef.current = ballVyRef.current < 0 ? -minVy : minVy;
        const remainingVx = Math.sqrt(currentSpeed ** 2 - minVy ** 2);
        ballVxRef.current = ballVxRef.current < 0 ? -remainingVx : remainingVx;
      }

      // Update ball
      ballXRef.current += ballVxRef.current;
      ballYRef.current += ballVyRef.current;

      // Update ball rotation based on speed
      ballRotationRef.current = (ballRotationRef.current + currentSpeed * 4) % 360;

      // Update trail
      trailRef.current.push({ x: ballXRef.current, y: ballYRef.current });
      if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.shift();
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
        triggerShake(3, 350);
        setLifeLostFlash(true);
        setTimeout(() => setLifeLostFlash(false), 400);

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
        const launchAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        ballVxRef.current = BALL_SPEED * Math.cos(launchAngle);
        ballVyRef.current = BALL_SPEED * Math.sin(launchAngle);
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
        // Improved bounce angle: more natural and predictable
        const hitPos = (ballXRef.current + BALL_SIZE / 2 - paddleXRef.current) / PADDLE_WIDTH;
        const normalizedHit = hitPos - 0.5; // -0.5 to 0.5
        // Slight quadratic curve for predictable feel near edges
        const curvedHit = normalizedHit * 0.7 + Math.sign(normalizedHit) * normalizedHit * normalizedHit * 0.6;
        let bounceAngle = -Math.PI / 2 + curvedHit * 1.5;

        // Clamp angle to prevent near-horizontal or near-vertical bounces
        const MIN_BOUND = 0.3;
        if (bounceAngle > -MIN_BOUND) bounceAngle = -MIN_BOUND;
        if (bounceAngle < -Math.PI + MIN_BOUND) bounceAngle = -Math.PI + MIN_BOUND;
        if (bounceAngle > -Math.PI / 2 - 0.15 && bounceAngle < -Math.PI / 2 + 0.15) {
          bounceAngle = bounceAngle < -Math.PI / 2 ? -Math.PI / 2 - 0.3 : -Math.PI / 2 + 0.3;
        }

        const speed = Math.sqrt(ballVxRef.current ** 2 + ballVyRef.current ** 2);
        ballVxRef.current = speed * Math.cos(bounceAngle);
        ballVyRef.current = speed * Math.sin(bounceAngle);
        // Enforce minimum vertical speed
        const MIN_VERTICAL_RATIO = 0.3;
        const minVy = speed * MIN_VERTICAL_RATIO;
        if (Math.abs(ballVyRef.current) < minVy) {
          ballVyRef.current = ballVyRef.current < 0 ? -minVy : minVy;
          const remainingVx = Math.sqrt(speed ** 2 - minVy ** 2);
          ballVxRef.current = ballVxRef.current < 0 ? -remainingVx : remainingVx;
        }
        ballYRef.current = paddleTop - BALL_SIZE;

        // Squash effect on ball
        setBallSquash(true);
        setTimeout(() => setBallSquash(false), 100);

        // Paddle hit flash
        setPaddleHitFlash(true);
        setTimeout(() => setPaddleHitFlash(false), 120);

        triggerShake(2, 200);
      }

      // Brick collisions
      let hitBrick = false;
      const newParticles: Particle[] = [];
      const newFlashes: BrickFlash[] = [];
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

          // Subtle speed increase per brick hit (0.5%)
          ballVxRef.current *= 1.005;
          ballVyRef.current *= 1.005;

          // Spawn 12-16 particles with varied sizes (2-8px), vibrant colors, gravity
          const particleCount = 12 + Math.floor(Math.random() * 5);
          for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 1.2;
            const spd = 2 + Math.random() * 5;
            const size = 2 + Math.random() * 6;
            newParticles.push({
              x: brickX + BRICK_WIDTH / 2 + (Math.random() - 0.5) * BRICK_WIDTH * 0.5,
              y: brickY + BRICK_HEIGHT / 2 + (Math.random() - 0.5) * BRICK_HEIGHT * 0.5,
              color: brick.color,
              id: particleId++,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 3,
              size,
            });
          }

          // Brick destruction flash/glow
          newFlashes.push({
            x: brickX,
            y: brickY,
            color: brick.color,
            id: flashIdRef.current++,
          });

          // Bounce direction
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

        // Combo tracking
        const timeSinceLastHit = now - lastBrickHitTimeRef.current;
        if (timeSinceLastHit < 600 && timeSinceLastHit > 0) {
          comboCountRef.current++;
        } else {
          comboCountRef.current = 1;
        }
        lastBrickHitTimeRef.current = now;

        if (comboCountRef.current >= 2) {
          setComboDisplay(comboCountRef.current);
          if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
          comboTimeoutRef.current = setTimeout(() => setComboDisplay(0), 1200);
          // Stronger shake for combos
          triggerShake(comboCountRef.current >= 4 ? 3 : 2, 200);
        } else {
          triggerShake(1, 120);
        }
      }

      if (newParticles.length > 0) {
        const newIds = new Set(newParticles.map(p => p.id));
        setParticles(prev => [...prev, ...newParticles]);
        setTimeout(() => {
          setParticles(prev => prev.filter(p => !newIds.has(p.id)));
        }, 1100);
      }

      if (newFlashes.length > 0) {
        const newFlashIds = new Set(newFlashes.map(f => f.id));
        setBrickFlashes(prev => [...prev, ...newFlashes]);
        setTimeout(() => {
          setBrickFlashes(prev => prev.filter(f => !newFlashIds.has(f.id)));
        }, 300);
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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (levelBannerTimeoutRef.current) clearTimeout(levelBannerTimeoutRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
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
            animate={shakeIntensity > 0 ? {
              x: shakeIntensity >= 3 ? [0, -8, 8, -6, 6, -3, 3, 0] :
                 shakeIntensity >= 2 ? [0, -4, 4, -2, 2, 0] :
                 [0, -2, 2, -1, 1, 0],
              y: shakeIntensity >= 3 ? [0, 3, -3, 2, -2, 0] : [0, 0, 0, 0, 0, 0],
            } : {}}
            transition={{ duration: shakeIntensity >= 3 ? 0.35 : 0.2 }}
            className="relative overflow-hidden rounded-2xl select-none touch-none"
            style={{
              width: GAME_WIDTH * gameScale,
              height: GAME_HEIGHT * gameScale,
              background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
              boxShadow: '0 0 20px rgba(99,102,241,0.2), 0 0 40px rgba(99,102,241,0.1), inset 0 0 20px rgba(99,102,241,0.05)',
              cursor: touchActive ? 'none' : 'default',
            }}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleMouseMove}
          >
            {/* Starfield background */}
            {stars.map((star, i) => (
              <div
                key={`star-${i}`}
                className="absolute rounded-full bg-white pointer-events-none"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size * gameScale,
                  height: star.size * gameScale,
                  opacity: star.opacity,
                  animation: `bb-twinkle ${2.5 + star.animDelay}s ease-in-out infinite`,
                  animationDelay: `${star.animDelay}s`,
                }}
              />
            ))}

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

            {/* Brick destruction flash/glow effects */}
            {brickFlashes.map(flash => (
              <motion.div
                key={`flash-${flash.id}`}
                initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute rounded-md pointer-events-none"
                style={{
                  left: flash.x * gameScale,
                  top: flash.y * gameScale,
                  width: BRICK_WIDTH * gameScale,
                  height: BRICK_HEIGHT * gameScale,
                  backgroundColor: COLOR_HEX[flash.color],
                  boxShadow: `0 0 20px ${COLOR_HEX[flash.color]}, 0 0 40px ${COLOR_HEX[flash.color]}60`,
                }}
              />
            ))}

            {/* Particles with gravity and vibrant colors */}
            {particles.map(p => {
              const particleColor = COLOR_HEX[p.color as BrickColor] || '#ffffff';
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: [1, 0.8, 0],
                    scale: [1, 0.7, 0.1],
                    x: [0, p.vx * 10, p.vx * 18],
                    y: [0, p.vy * 6, p.vy * 18 + 90],
                  }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: p.x * gameScale,
                    top: p.y * gameScale,
                    width: p.size * gameScale,
                    height: p.size * gameScale,
                    backgroundColor: particleColor,
                    boxShadow: `0 0 ${Math.max(4, p.size * 0.8)}px ${particleColor}`,
                  }}
                />
              );
            })}

            {/* Paddle with glow and hit response */}
            <motion.div
              animate={paddleHitFlash ? { scaleX: 1.15, scaleY: 0.85 } : { scaleX: 1, scaleY: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute rounded-full"
              style={{
                left: paddleX * gameScale,
                top: paddleTop * gameScale,
                width: PADDLE_WIDTH * gameScale,
                height: PADDLE_HEIGHT * gameScale,
                background: paddleHitFlash
                  ? 'linear-gradient(90deg, #93c5fd, #bfdbfe, #93c5fd)'
                  : 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)',
                boxShadow: paddleHitFlash
                  ? '0 0 24px rgba(96,165,250,0.8), 0 0 48px rgba(96,165,250,0.4)'
                  : '0 0 12px rgba(59,130,246,0.4), 0 0 24px rgba(59,130,246,0.2)',
                transition: 'background 0.12s, box-shadow 0.12s',
                transformOrigin: 'center center',
              }}
            />

            {/* Ball trail with color gradient (white to blue) */}
            {trail.map((pos, i) => {
              const ratio = trail.length > 1 ? i / (trail.length - 1) : 0;
              const size = BALL_SIZE * (0.15 + ratio * 0.85);
              const opacity = ratio * 0.55 + 0.02;
              const r = Math.round(255 - ratio * 95);
              const g = Math.round(255 - ratio * 58);
              const b = 255;
              return (
                <div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: (pos.x + BALL_SIZE / 2 - size / 2) * gameScale,
                    top: (pos.y + BALL_SIZE / 2 - size / 2) * gameScale,
                    width: size * gameScale,
                    height: size * gameScale,
                    background: `radial-gradient(circle, rgba(${r},${g},${b},${opacity}) 0%, rgba(96,165,250,${opacity * 0.3}) 100%)`,
                  }}
                />
              );
            })}

            {/* Ball with spin and squash effects */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ballPos.x * gameScale,
                top: ballPos.y * gameScale,
                width: BALL_SIZE * gameScale,
                height: BALL_SIZE * gameScale,
                background: 'radial-gradient(circle at 35% 35%, #ffffff, #e0e7ff)',
                boxShadow: '0 0 8px rgba(255,255,255,0.5), 0 0 16px rgba(147,197,253,0.3)',
                transform: `rotate(${ballRotationRef.current}deg) scale(${ballSquash ? 1.3 : 1}, ${ballSquash ? 0.7 : 1})`,
                transition: ballSquash ? 'transform 0.04s ease-out' : 'transform 0.12s ease-out',
                willChange: 'transform',
              }}
            />

            {/* Life Lost Flash - dramatic red vignette */}
            {lifeLostFlash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0 pointer-events-none z-50"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 15%, rgba(239,68,68,0.65) 100%)',
                }}
              />
            )}

            {/* Level transition flash */}
            {levelFlash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.85, 0] }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white pointer-events-none z-50"
              />
            )}

            {/* Combo counter display */}
            <AnimatePresence>
              {comboDisplay >= 2 && (
                <motion.div
                  key="combo"
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="absolute top-2 right-2 z-30 flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{
                    background: comboDisplay >= 4
                      ? 'linear-gradient(135deg, #f97316, #ef4444)'
                      : 'linear-gradient(135deg, #facc15, #f97316)',
                    boxShadow: comboDisplay >= 4
                      ? '0 0 16px rgba(239,68,68,0.5)'
                      : '0 0 12px rgba(249,115,22,0.5)',
                  }}
                >
                  <Zap className="w-3 h-3 text-white" />
                  <span className="text-xs font-black text-white">{comboDisplay}x</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Level banner */}
            <AnimatePresence>
              {levelBannerLevel !== null && (
                <motion.div
                  key={`level-${levelBannerLevel}`}
                  initial={{ opacity: 0, scale: 0.3, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.2, y: -30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                >
                  <div
                    className="px-8 py-4 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))',
                      boxShadow: '0 0 30px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2)',
                    }}
                  >
                    <p className="text-3xl font-black text-white text-center">
                      {t('关卡', 'Level')} {levelBannerLevel}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile touch indicator */}
            {touchActive && gameState === 'playing' && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: (paddleX - 10) * gameScale,
                  top: (paddleTop - 4) * gameScale,
                  width: (PADDLE_WIDTH + 20) * gameScale,
                  height: (PADDLE_HEIGHT + 8) * gameScale,
                  borderRadius: 999,
                  border: '2px solid rgba(96,165,250,0.3)',
                }}
              />
            )}

            {/* Idle / Game Over Overlay */}
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                {gameState === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); startGame(); }}
                    onTouchStart={(e) => { e.stopPropagation(); startGame(); }}
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
