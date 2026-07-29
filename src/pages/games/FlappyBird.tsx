import { useState, useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy, springSmooth } from '../../lib/animations';
import { loadBestScore, saveBestScore } from '../../lib/gameScore';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BIRD_SIZE = 32;
const BIRD_X = 80;
const GRAVITY = 0.38;
const JUMP_FORCE = -7.5;
const PIPE_WIDTH = 56;
const PIPE_GAP = 170;
const PIPE_SPEED = 2.2;
const PIPE_SPAWN_INTERVAL = 1800; // ms
const GROUND_HEIGHT = 20;
const CLOUD_COUNT = 5;

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

interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
}

let particleIdCounter = 0;

const GRASS_TUFTS = Array.from({ length: 20 }, (_, i) => ({
  x: i * 20 + Math.sin(i * 1.7) * 6,
  height: 4 + Math.sin(i * 2.3) * 2,
  shade: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#16a34a' : '#15803d',
}));

function createClouds(): Cloud[] {
  return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    x: (GAME_WIDTH / CLOUD_COUNT) * i + Math.random() * 60,
    y: 20 + Math.random() * 120,
    width: 40 + Math.random() * 50,
    speed: 0.3 + Math.random() * 0.4,
    opacity: 0.15 + Math.random() * 0.2,
  }));
}

export default function FlappyBird({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [gameState, setGameState] = useState<'idle' | 'ready' | 'playing' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => loadBestScore('flappy'));

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
  const cloudsRef = useRef<Cloud[]>(createClouds());

  // Render state (updated from refs in rAF)
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdRotation, setBirdRotation] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [scorePulse, setScorePulse] = useState(false);
  const [groundScroll, setGroundScroll] = useState(0);
  const [clouds, setClouds] = useState<Cloud[]>(createClouds());
  const [jumpSquash, setJumpSquash] = useState(false);
  const [tapPulse, setTapPulse] = useState(false);
  const [deathFlash, setDeathFlash] = useState(false);
  const [milestoneCombo, setMilestoneCombo] = useState<number | null>(null);
  const [readyCountdown, setReadyCountdown] = useState(3);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const scorePopupIdRef = useRef(0);

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

    // Squash effect on jump
    setJumpSquash(true);
    setTimeout(() => {
      setJumpSquash(false);
    }, 100);

    // Haptic feedback hint: visual tap pulse
    setTapPulse(true);
    setTimeout(() => setTapPulse(false), 150);
  }, []);

  const beginPlaying = useCallback(() => {
    birdYRef.current = GAME_HEIGHT / 2;
    birdVelRef.current = -3; // slight upward velocity so bird doesn't immediately fall
    birdRotationRef.current = 0;
    groundScrollRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    lastPipeSpawnRef.current = 0;
    playingRef.current = true;
    cloudsRef.current = createClouds();
    setBirdY(GAME_HEIGHT / 2);
    setBirdRotation(0);
    setGroundScroll(0);
    setPipes([]);
    setScore(0);
    setScorePopups([]);
    setGameState('playing');
    setDeathShake(false);
    setDeathParticles([]);
    setDeathFlash(false);
    setMilestoneCombo(null);
  }, []);

  const startGame = useCallback(() => {
    setReadyCountdown(3);
    setGameState('ready');
    setBirdY(GAME_HEIGHT / 2);
    setBirdRotation(0);
    setDeathShake(false);
    setDeathParticles([]);
    setDeathFlash(false);
    setMilestoneCombo(null);
    setScorePopups([]);
    birdYRef.current = GAME_HEIGHT / 2;
    birdVelRef.current = 0;
    birdRotationRef.current = 0;
    playingRef.current = false;
  }, []);

  // Spawn death particles at a given bird position
  const spawnDeathParticles = useCallback((y: number) => {
    const colors = [
      '#fbbf24',
      '#f59e0b',
      '#ef4444',
      '#fb923c',
      '#f87171',
      '#ffffff',
      '#ff6b6b',
      '#ffd93d',
      '#ff8a5c',
      '#a855f7',
    ];
    const count = 10 + Math.floor(Math.random() * 3); // 10-12 particles
    const newParticles: DeathParticle[] = Array.from({ length: count }, () => ({
      id: particleIdCounter++,
      vx: (Math.random() - 0.5) * 200,
      vy: -Math.random() * 150 - 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 2,
      duration: Math.random() * 0.5 + 0.3,
    }));
    setDeathParticles((prev) => [...prev, ...newParticles]);
    // Clean up after animation completes
    setTimeout(() => {
      setDeathParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1200);
  }, []);

  const gameOver = useCallback(() => {
    // Death pop: bird goes up briefly
    birdVelRef.current = -6;

    // Brief flash/shake effect
    setDeathShake(true);
    setDeathFlash(true);
    setTimeout(() => setDeathShake(false), 300);
    setTimeout(() => setDeathFlash(false), 200);

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

      // Dramatic accelerating rotation during death
      const elapsed = (performance.now() - deathStartTime) / 1000;
      const rotSpeed = 5 + elapsed * 6; // more dramatic: starts at 5, accelerates faster
      birdRotationRef.current = Math.min(360, birdRotationRef.current + rotSpeed); // allow full spin

      // Spawn trailing particles during fall
      if (Math.random() < 0.4) {
        spawnDeathParticles(birdYRef.current);
      }

      setBirdY(birdYRef.current);
      setBirdRotation(birdRotationRef.current);

      if (birdYRef.current < GAME_HEIGHT + 50) {
        requestAnimationFrame(deathLoop);
      }
    };
    requestAnimationFrame(deathLoop);

    // Show game over after bird falls (shorter, snappier)
    setTimeout(() => {
      playingRef.current = false;
      setGameState('over');
      const s = scoreRef.current;
      const best = loadBestScore('flappy');
      if (s > best) {
        saveBestScore('flappy', s);
        setBestScore(s);
      }
    }, 500);
  }, [spawnDeathParticles]);

  // Ready countdown timer
  useEffect(() => {
    if (gameState !== 'ready') return;
    const interval = setInterval(() => {
      setReadyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          beginPlaying();
          return 0;
        }
        return prev - 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [gameState, beginPlaying]);

  // Clean up score popups
  useEffect(() => {
    if (scorePopups.length === 0) return;
    const timeout = setTimeout(() => {
      setScorePopups((prev) => prev.slice(1));
    }, 800);
    return () => clearTimeout(timeout);
  }, [scorePopups]);

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
      // Rising (negative vel) = tilt up more naturally
      // Falling (positive vel) = tilt down more gradually
      const targetRotation = Math.min(60, Math.max(-25, birdVelRef.current * 4.5));
      const lerpFactor = birdVelRef.current > 0 ? 0.15 : 0.08;
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

        // Score popup (+1 animation)
        const popupId = scorePopupIdRef.current++;
        setScorePopups((prev) => [
          ...prev,
          { id: popupId, x: BIRD_X + BIRD_SIZE, y: birdYRef.current - 10 },
        ]);

        // Milestone combo indicator every 5 points
        if (scoreRef.current > 0 && scoreRef.current % 5 === 0) {
          setMilestoneCombo(scoreRef.current);
          setTimeout(() => setMilestoneCombo(null), 1200);
        }
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

      // Update clouds (parallax: slower than pipes)
      const updatedClouds = cloudsRef.current.map((cloud) => {
        let newX = cloud.x - cloud.speed;
        if (newX + cloud.width < 0) {
          newX = GAME_WIDTH + Math.random() * 40;
        }
        return { ...cloud, x: newX };
      });
      cloudsRef.current = updatedClouds;

      setBirdY(birdYRef.current);
      setBirdRotation(birdRotationRef.current);
      setGroundScroll(groundScrollRef.current);
      setPipes([...newPipes]);
      setClouds([...updatedClouds]);

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
        } else if (gameState === 'playing') {
          jump();
        }
        // Ignore during 'ready' countdown
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, jump, startGame]);

  const handleTap = useCallback(() => {
    // Haptic feedback hint: visual tap pulse
    setTapPulse(true);
    setTimeout(() => setTapPulse(false), 150);

    if (gameState === 'idle' || gameState === 'over') {
      startGame();
    } else if (gameState === 'playing') {
      jump();
    }
    // Ignore during 'ready' countdown
  }, [gameState, jump, startGame]);

  // Touch handler with passive: false via ref attachment
  const gameAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => {
      e.preventDefault();
      handleTap();
    };
    el.addEventListener('touchstart', handler, { passive: false });
    return () => el.removeEventListener('touchstart', handler);
  }, [handleTap]);

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
        @keyframes bird-flap {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          25% { transform: translateY(-2px) scaleY(0.92); }
          50% { transform: translateY(0px) scaleY(1.04); }
          75% { transform: translateY(1px) scaleY(0.96); }
        }
        @keyframes bird-breathing {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.3)); }
          50% { filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.6)); }
        }
        @keyframes bird-shadow {
          0%, 100% { transform: scaleX(1); opacity: 0.2; }
          50% { transform: scaleX(0.8); opacity: 0.12; }
        }
        @keyframes jump-squash {
          0% { transform: scaleY(1) scaleX(1); }
          30% { transform: scaleY(0.78) scaleX(1.12); }
          60% { transform: scaleY(1.08) scaleX(0.95); }
          100% { transform: scaleY(1) scaleX(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 8px rgba(255,255,255,0.4), 0 0 16px rgba(255,255,255,0.1); }
          50% { text-shadow: 0 0 16px rgba(255,255,255,0.8), 0 0 32px rgba(255,255,255,0.3); }
        }
        @keyframes milestone-pop {
          0% { transform: scale(0.5) translateY(0); opacity: 0; }
          30% { transform: scale(1.3) translateY(-8px); opacity: 1; }
          70% { transform: scale(1) translateY(-16px); opacity: 1; }
          100% { transform: scale(0.9) translateY(-30px); opacity: 0; }
        }
        @keyframes score-breakdown {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes tap-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          100% { box-shadow: 0 0 0 20px rgba(255,255,255,0); }
        }
        @keyframes score-popup {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { transform: translateY(-8px) scale(1.2); opacity: 1; }
          60% { transform: translateY(-20px) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
        @keyframes countdown-pop {
          0% { transform: scale(0.3); opacity: 0; }
          40% { transform: scale(1.3); opacity: 1; }
          70% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes countdown-fade {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes ready-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

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
            <h1 className="text-3xl font-black text-on-surface">{t('像素小鸟', 'Flappy Bird')}</h1>
            <p className="text-sm text-secondary">{t('点击屏幕飞翔！', 'Tap to fly!')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div
                key={score}
                className="text-xl font-bold tabular-nums"
              >
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

        {/* Game Area */}
        <div ref={containerRef} className="flex justify-center mb-4">
          <div
            ref={gameAreaRef}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800 cursor-pointer select-none touch-none"
            style={{
              width: GAME_WIDTH * gameScale,
              height: GAME_HEIGHT * gameScale,
              animation: deathShake
                ? 'flappy-shake 0.3s ease-in-out'
                : tapPulse
                  ? 'tap-pulse 0.15s ease-out'
                  : 'none',
            }}
            onClick={handleTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                handleTap();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={
              gameState === 'idle'
                ? t('开始 Flappy Bird', 'Start Flappy Bird')
                : t('让小鸟飞翔', 'Make the bird fly')
            }
          >
            {/* Parallax clouds */}
            {gameState !== 'idle' &&
              clouds.map((cloud, i) => (
                <div
                  key={`cloud-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: cloud.x * gameScale,
                    top: cloud.y * gameScale,
                    width: cloud.width * gameScale,
                    height: cloud.width * 0.4 * gameScale,
                    opacity: cloud.opacity,
                  }}
                >
                  <div
                    className="w-full h-full rounded-full bg-white dark:bg-white/20"
                    style={{
                      filter: 'blur(2px)',
                    }}
                  />
                  <div
                    className="absolute rounded-full bg-white dark:bg-white/20"
                    style={{
                      width: '60%',
                      height: '70%',
                      top: '-30%',
                      left: '20%',
                      filter: 'blur(2px)',
                    }}
                  />
                </div>
              ))}

            {/* Top gradient overlay for depth */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: 60 * gameScale,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), transparent)',
              }}
            />
            {/* Bottom gradient overlay for depth */}
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                bottom: GROUND_HEIGHT * gameScale,
                height: 40 * gameScale,
                background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent)',
              }}
            />

            {/* Ground with texture */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                height: GROUND_HEIGHT * gameScale,
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
            >
              {/* Grass tufts */}
              {GRASS_TUFTS.map((tuft, i) => (
                <div
                  key={`tuft-${i}`}
                  className="absolute"
                  style={{
                    left: tuft.x * gameScale,
                    top: -tuft.height * gameScale,
                    width: 3 * gameScale,
                    height: tuft.height * gameScale,
                    backgroundColor: tuft.shade,
                    borderRadius: '50% 50% 0 0',
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>

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
                  {/* Shine highlight stripe */}
                  <div
                    className="absolute top-0 bg-white/20 dark:bg-white/10"
                    style={{
                      left: 6 * gameScale,
                      width: 8 * gameScale,
                      height: '100%',
                      borderRadius: 2 * gameScale,
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-green-600 dark:bg-green-700 border-2 border-green-700 dark:border-green-800 rounded"
                    style={{
                      width: (PIPE_WIDTH + 12) * gameScale,
                      height: 20 * gameScale,
                    }}
                  >
                    {/* Cap shine */}
                    <div
                      className="absolute top-1 left-1/4 bg-white/15 rounded"
                      style={{
                        width: '50%',
                        height: 4 * gameScale,
                      }}
                    />
                  </div>
                </div>
                {/* Bottom pipe */}
                <div
                  className="absolute bg-green-500 dark:bg-green-600 border-2 border-green-700 dark:border-green-800 rounded-t-lg"
                  style={{
                    left: pipe.x * gameScale,
                    top: (pipe.gapY + PIPE_GAP) * gameScale,
                    width: PIPE_WIDTH * gameScale,
                    bottom: GROUND_HEIGHT * gameScale,
                  }}
                >
                  {/* Shine highlight stripe */}
                  <div
                    className="absolute top-0 bg-white/20 dark:bg-white/10"
                    style={{
                      left: 6 * gameScale,
                      width: 8 * gameScale,
                      height: '100%',
                      borderRadius: 2 * gameScale,
                    }}
                  />
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-600 dark:bg-green-700 border-2 border-green-700 dark:border-green-800 rounded"
                    style={{
                      width: (PIPE_WIDTH + 12) * gameScale,
                      height: 20 * gameScale,
                    }}
                  >
                    {/* Cap shine */}
                    <div
                      className="absolute top-1 left-1/4 bg-white/15 rounded"
                      style={{
                        width: '50%',
                        height: 4 * gameScale,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Bird — idle bobbing with breathing glow */}
            {(gameState === 'idle' || gameState === 'ready') && (
              <div
                className="absolute select-none"
                style={{
                  left: BIRD_X * gameScale,
                  top: (GAME_HEIGHT / 2) * gameScale,
                  width: BIRD_SIZE * gameScale,
                  height: BIRD_SIZE * gameScale,
                  fontSize: BIRD_SIZE * gameScale,
                  lineHeight: 1,
                  transform: 'scaleX(-1)',
                  animation:
                    gameState === 'ready'
                      ? 'ready-bounce 0.6s ease-in-out infinite, bird-breathing 2s ease-in-out infinite'
                      : 'bird-breathing 2s ease-in-out infinite',
                }}
              >
                🐦
              </div>
            )}

            {/* Bird — playing */}
            {gameState === 'playing' && (
              <>
                {/* Bird shadow */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: (BIRD_X + BIRD_SIZE / 2 - 10) * gameScale,
                    top: (GAME_HEIGHT - GROUND_HEIGHT - 4) * gameScale,
                    width: 20 * gameScale,
                    height: 4 * gameScale,
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    borderRadius: '50%',
                    transform: `scaleX(${1 - Math.min(0.5, Math.abs(birdVelRef.current) * 0.02)})`,
                    opacity: Math.max(0.05, 0.2 - (GAME_HEIGHT - GROUND_HEIGHT - birdY) * 0.0005),
                    animation: 'bird-shadow 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  className="absolute select-none"
                  style={{
                    left: BIRD_X * gameScale,
                    top: birdY * gameScale,
                    width: BIRD_SIZE * gameScale,
                    height: BIRD_SIZE * gameScale,
                    fontSize: BIRD_SIZE * gameScale,
                    lineHeight: 1,
                    transform: `scaleX(-1) rotate(${birdRotation}deg)`,
                    animation: `bird-flap 0.3s ease-in-out infinite, bird-breathing 2s ease-in-out infinite${jumpSquash ? ', jump-squash 0.12s ease-out' : ''}`,
                  }}
                >
                  🐦
                </div>
              </>
            )}

            {/* Bird — over (death) */}
            {gameState === 'over' && (
              <div
                className="absolute select-none"
                style={{
                  left: BIRD_X * gameScale,
                  top: birdY * gameScale,
                  width: BIRD_SIZE * gameScale,
                  height: BIRD_SIZE * gameScale,
                  fontSize: BIRD_SIZE * gameScale,
                  lineHeight: 1,
                  transform: `scaleX(-1) rotate(${birdRotation}deg)`,
                }}
              >
                🐦
              </div>
            )}

            {/* Death particles */}
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

            {/* Death white flash overlay */}
            {deathFlash && (
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  backgroundColor: 'white',
                  opacity: 0.6,
                  animation: 'particle-fly 0.2s ease-out forwards',
                  ['--px' as string]: '0px',
                  ['--py' as string]: '0px',
                }}
              />
            )}

            {/* Score popups (+1) */}
            {scorePopups.map((popup) => (
              <div
                key={popup.id}
                className="absolute pointer-events-none font-black text-yellow-300"
                style={{
                  left: popup.x * gameScale,
                  top: popup.y * gameScale,
                  fontSize: 18 * gameScale,
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  animation: 'score-popup 0.8s ease-out forwards',
                  zIndex: 25,
                }}
              >
                +1
              </div>
            ))}

            {/* Milestone combo indicator */}
            {milestoneCombo !== null && (
                <div
                  className="absolute z-30 pointer-events-none flex items-center gap-2"
                  style={{
                    left: (GAME_WIDTH / 2) * gameScale,
                    top: (GAME_HEIGHT / 2 - 60) * gameScale,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-lg"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      color: '#78350f',
                      boxShadow: '0 0 20px rgba(251, 191, 36, 0.5), 0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    {milestoneCombo}
                  </div>
                </div>
              )}

            {/* Idle / Ready / Game Over Overlay */}
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
                {gameState === 'idle' && (
                  <div
                    className="text-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      startGame();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        startGame();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={t('开始 Flappy Bird', 'Start Flappy Bird')}
                  >
                    <p
                      className="text-5xl mb-3"
                      style={{
                        animation: 'bird-breathing 2s ease-in-out infinite',
                        transform: 'scaleX(-1)',
                      }}
                    >
                      🐦
                    </p>
                    <p
                      className="text-xl font-bold text-white drop-shadow-lg mb-2"
                      style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                    >
                      {t('点击开始', 'Tap to Start')}
                    </p>
                    <p className="text-sm text-white/80 drop-shadow mb-1">
                      {t('点击屏幕或按空格键让小鸟飞翔', 'Tap screen or press Space to fly')}
                    </p>
                    <p className="text-xs text-white/60 drop-shadow">
                      {t('躲避管道，飞得越远越好！', 'Dodge pipes, fly as far as you can!')}
                    </p>
                  </div>
                )}
                {gameState === 'ready' && (
                  <div
                    className="text-center"
                  >
                    <p
                      className="text-8xl font-black text-white drop-shadow-lg"
                      style={{
                        animation:
                          'countdown-pop 0.6s ease-out, countdown-fade 0.7s ease-in forwards',
                        textShadow: '0 0 30px rgba(251, 191, 36, 0.6), 0 4px 12px rgba(0,0,0,0.3)',
                        color: '#fbbf24',
                      }}
                      key={readyCountdown}
                    >
                      {readyCountdown}
                    </p>
                    <p className="text-lg font-bold text-white/90 drop-shadow mt-2">
                      {t('准备好了吗？', 'Get Ready!')}
                    </p>
                  </div>
                )}
                {gameState === 'over' && (
                  <div
                    className="text-center bg-white/90 dark:bg-gray-800/90 rounded-2xl p-6 mx-4"
                  >
                    <p className="text-2xl font-bold text-on-surface mb-2">
                      {t('游戏结束', 'Game Over')}
                    </p>
                    <p className="text-5xl mb-3">💀</p>

                    {/* Score breakdown animation */}
                    <div
                    >
                      <p className="text-3xl font-black text-primary mb-1">{score}</p>
                      <p className="text-sm text-secondary mb-1">{t('得分', 'Score')}</p>
                    </div>

                    {score > 0 && score === bestScore && (
                      <p
                        className="text-sm text-green-500 mb-3"
                      >
                        {t('新纪录！', 'New Record!')}
                      </p>
                    )}

                    {score > 0 && score % 5 === 0 && (
                      <p
                        className="text-xs text-amber-500 mb-2 flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        {t('完美里程碑！', 'Perfect Milestone!')}
                      </p>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startGame();
                      }}
                      className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold min-h-[48px]"
                    >
                      {t('再来一局', 'Play Again')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {(gameState === 'playing' || gameState === 'over') && (
          <div className="flex justify-center gap-4">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 min-h-[48px]"
            >
              <RotateCcw className="w-5 h-5" />
              {t('重新开始', 'Restart')}
            </button>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('点击屏幕或按空格键让小鸟飞翔', 'Tap screen or press Space to fly')}
        </div>
      </div>
    </div>
  );
}
