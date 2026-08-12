import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from 'react';
import {
  BALL_SIZE,
  BALL_SPEED,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  COLOR_HEX,
  GAME_HEIGHT,
  GAME_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_WIDTH_MOBILE,
  TRAIL_LENGTH,
  type Brick,
  type BrickFlash,
  type CollisionFlash,
  type Particle,
  type ScorePopup,
} from './constants';
import {
  calculatePaddleBounce,
  clampPaddlePosition,
  enforceMinimumVerticalVelocity,
  hitBrick,
} from './gameLogic';
import { createBricks, generateStars } from './levels';
import { loadBrickBreakerBestScore, saveBrickBreakerBestScore } from './scorePersistence';
import { transitionGameState, type BrickBreakerGameState } from './stateMachine';

type Timeout = ReturnType<typeof setTimeout>;

export function useBrickBreakerGame() {
  const [gameState, setGameState] = useState<BrickBreakerGameState>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useState(loadBrickBreakerBestScore);
  const [level, setLevel] = useState(1);
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [ballPos, setBallPos] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
  const [bricks, setBricks] = useState<Brick[]>(() => createBricks());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gameScale, setGameScale] = useState(1);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [ballRotation, setBallRotation] = useState(0);
  const [ballSquash, setBallSquash] = useState(false);
  const [paddleHitFlash, setPaddleHitFlash] = useState(false);
  const [lifeLostFlash, setLifeLostFlash] = useState(false);
  const [levelBannerLevel, setLevelBannerLevel] = useState<number | null>(null);
  const [levelFlash, setLevelFlash] = useState(false);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [brickFlashes, setBrickFlashes] = useState<BrickFlash[]>([]);
  const [touchActive, setTouchActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [paddleMoving, setPaddleMoving] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [collisionFlashes, setCollisionFlashes] = useState<CollisionFlash[]>([]);
  const [comboBarKey, setComboBarKey] = useState(0);
  const [stars] = useState(generateStars);

  const paddleXRef = useRef((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const ballXRef = useRef(GAME_WIDTH / 2);
  const ballYRef = useRef(GAME_HEIGHT - 60);
  const ballVxRef = useRef(BALL_SPEED * 0.7);
  const ballVyRef = useRef(-BALL_SPEED);
  const bricksRef = useRef<Brick[]>(createBricks());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const playingRef = useRef(false);
  const animationFrameRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRectRef = useRef<DOMRect | null>(null);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const previousPaddleXRef = useRef(paddleXRef.current);
  const lastBrickHitTimeRef = useRef(0);
  const comboCountRef = useRef(0);
  const effectIdRef = useRef(0);
  const timeoutsRef = useRef<Set<Timeout>>(new Set());

  const later = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      timeoutsRef.current.delete(timeout);
      callback();
    }, delay);
    timeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  const setPaddlePosition = useCallback(
    (position: number, mobile = isMobile) => {
      const paddleWidth = mobile ? PADDLE_WIDTH_MOBILE : PADDLE_WIDTH;
      const next = clampPaddlePosition(position, paddleWidth);
      paddleXRef.current = next;
      setPaddleX(next);
    },
    [isMobile],
  );

  const launchBall = useCallback(
    (mobile = isMobile) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const paddleWidth = mobile ? PADDLE_WIDTH_MOBILE : PADDLE_WIDTH;
      ballVxRef.current = BALL_SPEED * Math.cos(angle);
      ballVyRef.current = BALL_SPEED * Math.sin(angle);
      ballXRef.current = paddleXRef.current + paddleWidth / 2;
      ballYRef.current = GAME_HEIGHT - 60;
      setBallPos({ x: ballXRef.current, y: ballYRef.current });
    },
    [isMobile],
  );

  const recordBestScore = useCallback(() => {
    const currentScore = scoreRef.current;
    const storedBest = loadBrickBreakerBestScore();
    if (currentScore > storedBest) {
      saveBrickBreakerBestScore(currentScore);
      setBestScore(currentScore);
    }
  }, []);

  const resetEffects = useCallback((preserveLevelTransition = false) => {
    setParticles([]);
    trailRef.current = [];
    setTrail([]);
    setBallSquash(false);
    setPaddleHitFlash(false);
    setLifeLostFlash(false);
    setComboDisplay(0);
    setBrickFlashes([]);
    if (!preserveLevelTransition) {
      setLevelBannerLevel(null);
      setLevelFlash(false);
    }
    setScorePopups([]);
    setCollisionFlashes([]);
    setPaddleMoving(false);
    setComboBarKey(0);
    comboCountRef.current = 0;
    lastBrickHitTimeRef.current = 0;
  }, []);

  const startGame = useCallback(() => {
    const paddleWidth = isMobile ? PADDLE_WIDTH_MOBILE : PADDLE_WIDTH;
    const initialPaddleX = (GAME_WIDTH - paddleWidth) / 2;
    bricksRef.current = createBricks(1);
    scoreRef.current = 0;
    livesRef.current = 3;
    playingRef.current = true;
    setPaddlePosition(initialPaddleX);
    previousPaddleXRef.current = initialPaddleX;
    setBricks([...bricksRef.current]);
    setScore(0);
    setLives(3);
    setLevel(1);
    resetEffects();
    setGameState((state) => transitionGameState(state, 'START'));
    launchBall();
  }, [isMobile, launchBall, resetEffects, setPaddlePosition]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevelFlash(true);
    later(() => setLevelFlash(false), 300);
    setLevelBannerLevel(newLevel);
    later(() => setLevelBannerLevel(null), 1500);

    const targetSpeed = BALL_SPEED * (1 + (newLevel - 1) * 0.12);
    const currentSpeed = Math.hypot(ballVxRef.current, ballVyRef.current);
    if (currentSpeed > 0) {
      ballVxRef.current *= targetSpeed / currentSpeed;
      ballVyRef.current *= targetSpeed / currentSpeed;
    }

    playingRef.current = false;
    later(() => {
      bricksRef.current = createBricks(newLevel);
      setBricks([...bricksRef.current]);
      setLevel(newLevel);
      setPaddlePosition((GAME_WIDTH - (isMobile ? PADDLE_WIDTH_MOBILE : PADDLE_WIDTH)) / 2);
      resetEffects(true);
      playingRef.current = true;
      setGameState((state) => transitionGameState(state, 'NEXT_LEVEL'));
      launchBall();
    }, 400);
  }, [isMobile, later, launchBall, level, resetEffects, setPaddlePosition]);

  const updatePaddleFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      containerRectRef.current ??= container.getBoundingClientRect();
      const scaledX = (clientX - containerRectRef.current.left) / gameScale;
      const width = isMobile ? PADDLE_WIDTH_MOBILE : PADDLE_WIDTH;
      setPaddlePosition(scaledX - width / 2);
    },
    [gameScale, isMobile, setPaddlePosition],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();
      updatePaddleFromClientX(event.touches[0].clientX);
    },
    [updatePaddleFromClientX],
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();
      setTouchActive(true);
      updatePaddleFromClientX(event.touches[0].clientX);
    },
    [updatePaddleFromClientX],
  );

  const handleTouchEnd = useCallback(() => setTouchActive(false), []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => updatePaddleFromClientX(event.clientX),
    [updatePaddleFromClientX],
  );

  const movePaddleBy = useCallback(
    (delta: number) => setPaddlePosition(paddleXRef.current + delta),
    [setPaddlePosition],
  );

  const handleGameKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && gameState !== 'playing') {
        event.preventDefault();
        startGame();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        movePaddleBy(event.key === 'ArrowLeft' ? -24 : 24);
      }
    },
    [gameState, movePaddleBy, startGame],
  );

  useEffect(() => {
    const updateLayout = () => {
      const container = containerRef.current;
      if (container) {
        setGameScale(Math.min(1, container.clientWidth / GAME_WIDTH));
        containerRectRef.current = container.getBoundingClientRect();
      }
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640);
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let particleId = 0;
    const loop = (now: number) => {
      if (!playingRef.current) return;

      const constrained = enforceMinimumVerticalVelocity(
        { x: ballVxRef.current, y: ballVyRef.current },
        0.25,
      );
      ballVxRef.current = constrained.x;
      ballVyRef.current = constrained.y;
      ballXRef.current += ballVxRef.current;
      ballYRef.current += ballVyRef.current;
      setBallRotation(
        (rotation) => (rotation + Math.hypot(constrained.x, constrained.y) * 4) % 360,
      );

      trailRef.current = [...trailRef.current, { x: ballXRef.current, y: ballYRef.current }].slice(
        -TRAIL_LENGTH,
      );
      setTrail(trailRef.current);

      if (ballXRef.current <= 0) {
        ballXRef.current = 0;
        ballVxRef.current = Math.abs(ballVxRef.current);
      } else if (ballXRef.current >= GAME_WIDTH - BALL_SIZE) {
        ballXRef.current = GAME_WIDTH - BALL_SIZE;
        ballVxRef.current = -Math.abs(ballVxRef.current);
      }
      if (ballYRef.current <= 0) {
        ballYRef.current = 0;
        ballVyRef.current = Math.abs(ballVyRef.current);
      }

      if (ballYRef.current >= GAME_HEIGHT - BALL_SIZE) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        setLifeLostFlash(true);
        later(() => setLifeLostFlash(false), 400);
        if (livesRef.current <= 0) {
          playingRef.current = false;
          setGameState((state) => transitionGameState(state, 'LOSE'));
          recordBestScore();
          return;
        }
        launchBall();
      }

      const paddleWidth = isMobile ? PADDLE_WIDTH_MOBILE : PADDLE_WIDTH;
      const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - 20;
      if (
        ballYRef.current + BALL_SIZE >= paddleTop &&
        ballYRef.current + BALL_SIZE <= paddleTop + PADDLE_HEIGHT + 4 &&
        ballXRef.current + BALL_SIZE >= paddleXRef.current &&
        ballXRef.current <= paddleXRef.current + paddleWidth &&
        ballVyRef.current > 0
      ) {
        const bounce = calculatePaddleBounce({
          ballCenterX: ballXRef.current + BALL_SIZE / 2,
          paddleX: paddleXRef.current,
          paddleWidth,
          velocity: { x: ballVxRef.current, y: ballVyRef.current },
        });
        ballVxRef.current = bounce.x;
        ballVyRef.current = bounce.y;
        ballYRef.current = paddleTop - BALL_SIZE;
        setBallSquash(true);
        setPaddleHitFlash(true);
        later(() => setBallSquash(false), 100);
        later(() => setPaddleHitFlash(false), 120);
        const id = effectIdRef.current++;
        setCollisionFlashes((items) => [
          ...items,
          { x: ballXRef.current + BALL_SIZE / 2, y: paddleTop, id },
        ]);
        later(() => setCollisionFlashes((items) => items.filter((item) => item.id !== id)), 250);
      }

      let collided = false;
      const spawnedParticles: Particle[] = [];
      const spawnedFlashes: BrickFlash[] = [];
      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        const brickX = brick.col * (BRICK_WIDTH + BRICK_GAP) + BRICK_GAP / 2;
        const brickY = brick.row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_GAP / 2 + 40;
        const overlaps =
          ballXRef.current + BALL_SIZE > brickX &&
          ballXRef.current < brickX + BRICK_WIDTH &&
          ballYRef.current + BALL_SIZE > brickY &&
          ballYRef.current < brickY + BRICK_HEIGHT;
        if (!overlaps) continue;

        collided = true;
        const hit = hitBrick(brick);
        if (hit.destroyed) {
          scoreRef.current += hit.points;
          setScore(scoreRef.current);
          const comboMultiplier = comboCountRef.current >= 2 ? comboCountRef.current : 1;
          const popupId = effectIdRef.current++;
          setScorePopups((items) => [
            ...items,
            {
              x: brickX + BRICK_WIDTH / 2,
              y: brickY + BRICK_HEIGHT / 2,
              text: `+${hit.points * comboMultiplier}`,
              id: popupId,
              color: COLOR_HEX[brick.color],
            },
          ]);
          later(() => setScorePopups((items) => items.filter((item) => item.id !== popupId)), 1000);
        } else {
          brick.shaking = true;
          later(() => {
            brick.shaking = false;
            setBricks([...bricksRef.current]);
          }, 200);
        }

        const particleCount = hit.destroyed ? 18 : 8;
        for (let index = 0; index < particleCount; index += 1) {
          const angle = (Math.PI * 2 * index) / particleCount + (Math.random() - 0.5);
          const speed = 1.5 + Math.random() * (hit.destroyed ? 5 : 3);
          spawnedParticles.push({
            x: brickX + BRICK_WIDTH / 2,
            y: brickY + BRICK_HEIGHT / 2,
            color: brick.color,
            id: particleId++,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 2 + Math.random() * (hit.destroyed ? 6 : 4),
          });
        }
        spawnedFlashes.push({
          x: brickX,
          y: brickY,
          color: brick.color,
          id: effectIdRef.current++,
        });

        ballVxRef.current *= 1.005;
        ballVyRef.current *= 1.005;
        const dx = ballXRef.current + BALL_SIZE / 2 - (brickX + BRICK_WIDTH / 2);
        const dy = ballYRef.current + BALL_SIZE / 2 - (brickY + BRICK_HEIGHT / 2);
        if (Math.abs(dx / BRICK_WIDTH) > Math.abs(dy / BRICK_HEIGHT)) {
          ballVxRef.current = Math.abs(ballVxRef.current) * Math.sign(dx);
        } else {
          ballVyRef.current = Math.abs(ballVyRef.current) * Math.sign(dy);
        }
        break;
      }

      if (collided) {
        setBricks([...bricksRef.current]);
        const sinceLastHit = now - lastBrickHitTimeRef.current;
        comboCountRef.current =
          sinceLastHit > 0 && sinceLastHit < 600 ? comboCountRef.current + 1 : 1;
        lastBrickHitTimeRef.current = now;
        if (comboCountRef.current >= 2) {
          setComboDisplay(comboCountRef.current);
          setComboBarKey((key) => key + 1);
          later(() => setComboDisplay(0), 1200);
        }
      }
      if (spawnedParticles.length) {
        const ids = new Set(spawnedParticles.map((particle) => particle.id));
        setParticles((items) => [...items, ...spawnedParticles]);
        later(() => setParticles((items) => items.filter((item) => !ids.has(item.id))), 1100);
      }
      if (spawnedFlashes.length) {
        const ids = new Set(spawnedFlashes.map((flash) => flash.id));
        setBrickFlashes((items) => [...items, ...spawnedFlashes]);
        later(() => setBrickFlashes((items) => items.filter((item) => !ids.has(item.id))), 300);
      }

      if (bricksRef.current.every((brick) => !brick.alive)) {
        playingRef.current = false;
        setGameState((state) => transitionGameState(state, 'WIN'));
        recordBestScore();
        return;
      }

      const moving = Math.abs(paddleXRef.current - previousPaddleXRef.current) > 0.5;
      setPaddleMoving(moving);
      previousPaddleXRef.current = paddleXRef.current;
      setBallPos({ x: ballXRef.current, y: ballYRef.current });
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState, isMobile, later, launchBall, recordBestScore]);

  useEffect(
    () => () => {
      playingRef.current = false;
      cancelAnimationFrame(animationFrameRef.current);
      for (const timeout of timeoutsRef.current) clearTimeout(timeout);
      timeoutsRef.current.clear();
    },
    [],
  );

  return {
    gameState,
    score,
    lives,
    bestScore,
    level,
    paddleX,
    ballPos,
    bricks,
    particles,
    gameScale,
    trail,
    ballRotation,
    ballSquash,
    paddleHitFlash,
    lifeLostFlash,
    levelBannerLevel,
    levelFlash,
    comboDisplay,
    brickFlashes,
    stars,
    touchActive,
    isMobile,
    paddleMoving,
    scorePopups,
    collisionFlashes,
    comboBarKey,
    containerRef,
    handleTouchMove,
    handleTouchStart,
    handleTouchEnd,
    handleMouseMove,
    handleGameKeyDown,
    startGame,
    nextLevel,
  };
}

export type BrickBreakerGame = ReturnType<typeof useBrickBreakerGame>;
