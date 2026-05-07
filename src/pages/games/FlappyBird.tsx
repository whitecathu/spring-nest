import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BIRD_SIZE = 32;
const BIRD_X = 80;
const GRAVITY = 0.52;
const JUMP_FORCE = -8.5;
const PIPE_WIDTH = 56;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 1600; // ms

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

interface DeathParticle {
  id: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  duration: number;
}

let particleIdCounter = 0;

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_flappy_best') || '0'); } catch { return 0; }
}

function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_flappy_best', JSON.stringify(score));
}

export default function FlappyBird({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);

  // Game state refs for animation loop
  const birdYRef = useRef(GAME_HEIGHT / 2);
  const birdVelRef = useRef(0);
  const birdRotationRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const playingRef = useRef(false);
  const lastPipeSpawnRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const groundScrollRef = useRef(0);

  // Render state (updated from refs in rAF)
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdRotation, setBirdRotation] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [scorePulse, setScorePulse] = useState(false);
  const [groundScroll, setGroundScroll] = useState(0);

  const [gameScale, setGameScale] = useState(1);
  const [deathShake, setDeathShake] = useState(false);
  const [deathParticles, setDeathParticles] = useState<DeathParticle[]>([]);

  // Responsive scaling
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setGameScale(Math.min(1, w / GAME_WIDTH));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const jump = useCallback(() => {
    if (!playingRef.current) return;
    birdVelRef.current = JUMP_FORCE;
  }, []);

  const startGame = useCallback(() => {
    birdYRef.current = GAME_HEIGHT / 2;
    birdVelRef.current = 0;
    birdRotationRef.current = 0;
    groundScrollRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    lastPipeSpawnRef.current = 0;
    playingRef.current = true;
    setBirdY(GAME_HEIGHT / 2);
    setBirdRotation(0);
    setGroundScroll(0);
    setPipes([]);
    setScore(0);
    setGameState('playing');
    setDeathShake(false);
    setDeathParticles([]);
  }, []);

  // Spawn death particles at a given bird position
  const spawnDeathParticles = useCallback((y: number) => {
    const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#fb923c', '#f87171', '#ffffff'];
    const newParticles: DeathParticle[] = Array.from({ length: 6 }, () => ({
      id: particleIdCounter++,
      vx: (Math.random() - 0.5) * 160,
      vy: -Math.random() * 120 - 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 3,
      duration: Math.random() * 0.4 + 0.4,
    }));
    setDeathParticles(prev => [...prev, ...newParticles]);
    // Clean up after animation completes
    setTimeout(() => {
      setDeathParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 1000);
  }, []);

  const gameOver = useCallback(() => {
    // Death pop: bird goes up briefly
    birdVelRef.current = -6;

    // Brief flash/shake effect
    setDeathShake(true);
    setTimeout(() => setDeathShake(false), 300);

    // Initial burst of particles
    spawnDeathParticles(birdYRef.current);

    // Stop main game loop but keep rendering for death animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }

    // Track death time for accelerating rotation
    const deathStartTime = performance.now();

    // Continue rendering for death animation
    const deathLoop = () => {
      birdVelRef.current += GRAVITY * 1.3; // faster gravity during death
      birdYRef.current += birdVelRef.current;

      // Accelerating rotation: speed increases the longer the bird has been falling
      const elapsed = (performance.now() - deathStartTime) / 1000;
      const rotSpeed = 3 + elapsed * 4; // starts at 3 deg/frame, accelerates
      birdRotationRef.current = Math.min(90, birdRotationRef.current + rotSpeed);

      // Spawn trailing particles during fall
      if (Math.random() < 0.3) {
        spawnDeathParticles(birdYRef.current);
      }

      setBirdY(birdYRef.current);
      setBirdRotation(birdRotationRef.current);

      if (birdYRef.current < GAME_HEIGHT + 50) {
        requestAnimationFrame(deathLoop);
      }
    };
    requestAnimationFrame(deathLoop);

    // Show game over after bird falls
    setTimeout(() => {
      playingRef.current = false;
      setGameState('over');
      const s = scoreRef.current;
      const best = loadBestScore();
      if (s > best) {
        saveBestScore(s);
        setBestScore(s);
      }
    }, 800);
  }, [spawnDeathParticles]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!playingRef.current) return;

      const dt = Math.min(now - lastTime, 33); // cap at ~30fps delta
      lastTime = now;

      // Update bird
      birdVelRef.current += GRAVITY;
      birdYRef.current += birdVelRef.current;

      // Smooth rotation with velocity-dependent lerp:
      // Rising (negative vel) = slower rotation for snappy feel
      // Falling (positive vel) = faster rotation for dramatic nosedive
      const targetRotation = Math.min(70, Math.max(-30, birdVelRef.current * 5));
      const lerpFactor = birdVelRef.current > 0 ? 0.25 : 0.1;
      birdRotationRef.current += (targetRotation - birdRotationRef.current) * lerpFactor;

      // Bird bounds
      if (birdYRef.current < 0 || birdYRef.current > GAME_HEIGHT - BIRD_SIZE) {
        gameOver();
        return;
      }

      // Spawn pipes
      if (now - lastPipeSpawnRef.current > PIPE_SPAWN_INTERVAL) {
        const minGapY = 80;
        const maxGapY = GAME_HEIGHT - PIPE_GAP - 80;
        const gapY = minGapY + Math.random() * (maxGapY - minGapY);
        pipesRef.current.push({ x: GAME_WIDTH, gapY, passed: false });
        lastPipeSpawnRef.current = now;
      }

      // Update pipes
      const newPipes: Pipe[] = [];
      let scored = false;
      for (const pipe of pipesRef.current) {
        const newX = pipe.x - PIPE_SPEED;
        if (newX + PIPE_WIDTH < 0) continue; // off screen

        const passed = pipe.passed || (newX + PIPE_WIDTH < BIRD_X && !pipe.passed);
        if (passed && !pipe.passed) {
          scored = true;
          scoreRef.current++;
        }

        newPipes.push({ ...pipe, x: newX, passed: passed });
      }
      pipesRef.current = newPipes;

      if (scored) {
        setScore(scoreRef.current);
        setScorePulse(true);
        setTimeout(() => setScorePulse(false), 200);
      }

      // Collision detection
      const birdTop = birdYRef.current;
      const birdBottom = birdYRef.current + BIRD_SIZE;
      const birdLeft = BIRD_X;
      const birdRight = BIRD_X + BIRD_SIZE;

      for (const pipe of newPipes) {
        // Top pipe
        const topPipeBottom = pipe.gapY;
        // Bottom pipe
        const bottomPipeTop = pipe.gapY + PIPE_GAP;

        if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
          if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
            gameOver();
            return;
          }
        }
      }

      // Update render state
      groundScrollRef.current = (groundScrollRef.current + PIPE_SPEED) % 40;
      setBirdY(birdYRef.current);
      setBirdRotation(birdRotationRef.current);
      setGroundScroll(groundScrollRef.current);
      setPipes([...newPipes]);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    };
  }, [gameState, gameOver]);

  // Keyboard/touch controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'over') {
          startGame();
        } else {
          jump();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, jump, startGame]);

  const handleTap = useCallback(() => {
    if (gameState === 'idle' || gameState === 'over') {
      startGame();
    } else {
      jump();
    }
  }, [gameState, jump, startGame]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <style>{`
        @keyframes flappy-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes particle-fly {
          from { transform: translate(0, 0); opacity: 1; }
          to { transform: translate(var(--px), var(--py)); opacity: 0; }
        }
      `}</style>

      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('像素小鸟', 'Flappy Bird')}</h1>
            <p className="text-sm text-secondary">{t('点击屏幕飞翔！', 'Tap to fly!')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <motion.div
                key={score}
                initial={{ scale: 1.6, color: '#fbbf24' }}
                animate={{ scale: 1, color: 'var(--color-primary)' }}
                transition={{ type: 'spring', stiffness: 800, damping: 10 }}
                className="text-xl font-bold tabular-nums"
              >
                {score}
              </motion.div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
              <div className="text-xl font-bold text-tertiary tabular-nums">{bestScore}</div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div ref={containerRef} className="flex justify-center mb-4">
          <div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800 cursor-pointer select-none touch-none"
            style={{
              width: GAME_WIDTH * gameScale,
              height: GAME_HEIGHT * gameScale,
              animation: deathShake ? 'flappy-shake 0.3s ease-in-out' : 'none',
            }}
            onClick={handleTap}
            onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
          >
            {/* Ground with texture */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                height: 20 * gameScale,
                width: (GAME_WIDTH + 80) * gameScale,
                transform: `translateX(-${groundScroll * gameScale}px)`,
                background: `
                  linear-gradient(to bottom, #4ade80, #16a34a),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent ${12 * gameScale}px,
                    rgba(0,0,0,0.08) ${12 * gameScale}px,
                    rgba(0,0,0,0.08) ${14 * gameScale}px
                  )
                `,
                backgroundBlendMode: 'multiply',
              }}
            />

            {/* Pipes */}
            {pipes.map((pipe, i) => (
              <div key={i}>
                {/* Top pipe */}
                <div
                  className="absolute bg-green-500 dark:bg-green-600 border-2 border-green-700 dark:border-green-800 rounded-b-lg"
                  style={{
                    left: pipe.x * gameScale,
                    top: 0,
                    width: PIPE_WIDTH * gameScale,
                    height: pipe.gapY * gameScale,
                  }}
                >
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-green-600 dark:bg-green-700 border-2 border-green-700 dark:border-green-800 rounded"
                    style={{
                      width: (PIPE_WIDTH + 12) * gameScale,
                      height: 20 * gameScale,
                    }}
                  />
                </div>
                {/* Bottom pipe */}
                <div
                  className="absolute bg-green-500 dark:bg-green-600 border-2 border-green-700 dark:border-green-800 rounded-t-lg"
                  style={{
                    left: pipe.x * gameScale,
                    top: (pipe.gapY + PIPE_GAP) * gameScale,
                    width: PIPE_WIDTH * gameScale,
                    bottom: 20 * gameScale,
                  }}
                >
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-600 dark:bg-green-700 border-2 border-green-700 dark:border-green-800 rounded"
                    style={{
                      width: (PIPE_WIDTH + 12) * gameScale,
                      height: 20 * gameScale,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Bird — idle bobbing */}
            {gameState === 'idle' && (
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute select-none"
                style={{
                  left: BIRD_X * gameScale,
                  top: (GAME_HEIGHT / 2) * gameScale,
                  width: BIRD_SIZE * gameScale,
                  height: BIRD_SIZE * gameScale,
                  fontSize: BIRD_SIZE * gameScale,
                  lineHeight: 1,
                }}
              >
                🐦
              </motion.div>
            )}

            {/* Bird — playing / over */}
            {gameState !== 'idle' && (
              <div
                className="absolute select-none"
                style={{
                  left: BIRD_X * gameScale,
                  top: birdY * gameScale,
                  width: BIRD_SIZE * gameScale,
                  height: BIRD_SIZE * gameScale,
                  fontSize: BIRD_SIZE * gameScale,
                  lineHeight: 1,
                  transform: `rotate(${birdRotation}deg)`,
                }}
              >
                🐦
              </div>
            )}

            {/* Death particles */}
            <AnimatePresence>
              {deathParticles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: (BIRD_X + BIRD_SIZE / 2) * gameScale,
                    top: birdY * gameScale,
                    width: particle.size * gameScale,
                    height: particle.size * gameScale,
                    backgroundColor: particle.color,
                    animation: `particle-fly ${particle.duration}s ease-out forwards`,
                    willChange: 'transform, opacity',
                    ['--px' as string]: `${particle.vx * gameScale}px`,
                    ['--py' as string]: `${particle.vy * gameScale}px`,
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Idle / Game Over Overlay */}
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
                {gameState === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); startGame(); }}
                    onTouchStart={(e) => { e.stopPropagation(); startGame(); }}
                  >
                    <p className="text-5xl mb-3">🐦</p>
                    <p className="text-xl font-bold text-white drop-shadow-lg mb-2">
                      {t('点击开始', 'Tap to Start')}
                    </p>
                    <p className="text-sm text-white/80 drop-shadow">
                      {t('点击屏幕让小鸟飞翔', 'Tap to make the bird fly')}
                    </p>
                  </motion.div>
                )}
                {gameState === 'over' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-center bg-white/90 dark:bg-gray-800/90 rounded-2xl p-6 mx-4"
                  >
                    <p className="text-2xl font-bold text-on-surface mb-2">{t('游戏结束', 'Game Over')}</p>
                    <p className="text-5xl mb-3">💀</p>
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
          </div>
        </div>

        {/* Controls */}
        {gameState !== 'idle' && (
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
          {t('点击屏幕或按空格键让小鸟飞翔', 'Tap screen or press Space to fly')}
        </div>
      </motion.div>
    </div>
  );
}
