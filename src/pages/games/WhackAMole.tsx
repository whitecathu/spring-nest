import { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw, Clock, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { loadBestScore, saveBestScore, loadGameValue, saveGameValue } from '../../lib/gameScore';

const GAME_DURATION = 30;
const HOLES = 9;

// ── Particle system ──────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  size: number;
  life: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const HIT_EMOJIS = ['💥', '⭐', '✨', '💫', '🌟'];
const DEATH_EMOJIS = ['😵', '💀', '🥴', '😵‍💫'];

const COMBO_KEY = 'spring_nest_whackamole_best_combo';

// ── Screen shake hook ────────────────────────────────────────
function useScreenShake() {
  const [shake, setShake] = useState({ x: 0, y: 0 });
  const frameRef = useRef(0);

  const trigger = useCallback((intensity: number = 6) => {
    let frame = 0;
    const maxFrames = 6;
    const decay = () => {
      if (frame >= maxFrames) {
        setShake({ x: 0, y: 0 });
        return;
      }
      const progress = frame / maxFrames;
      const dampening = 1 - progress;
      setShake({
        x: (Math.random() - 0.5) * intensity * dampening,
        y: (Math.random() - 0.5) * intensity * dampening,
      });
      frame++;
      frameRef.current = requestAnimationFrame(decay);
    };
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(decay);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return { shake, trigger };
}

export default function WhackAMole({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => loadBestScore('whackamole'));
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(() => loadGameValue(COMBO_KEY));
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [hitHole, setHitHole] = useState<number | null>(null);
  const [deathEmoji, setDeathEmoji] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [freezeFrame, setFreezeFrame] = useState(false);
  const [moleExiting, setMoleExiting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasHitRef = useRef(false);
  const playingRef = useRef(false);
  const comboRef = useRef(0);
  const particleIdRef = useRef(0);
  const popupIdRef = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const { shake, trigger: triggerShake } = useScreenShake();

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (moleTimerRef.current) {
      clearInterval(moleTimerRef.current);
      moleTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // ── Spawn particles at position ──
  const spawnParticles = useCallback((x: number, y: number, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        emoji: HIT_EMOJIS[Math.floor(Math.random() * HIT_EMOJIS.length)],
        size: 12 + Math.random() * 10,
        life: 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);

    // Auto-remove after animation
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  }, []);

  // ── Spawn score popup ──
  const spawnScorePopup = useCallback(
    (x: number, y: number, points: number, currentCombo: number) => {
      const id = popupIdRef.current++;
      const text = currentCombo >= 5 ? `+${points} 🔥` : `+${points}`;
      const color =
        currentCombo >= 10
          ? '#ef4444'
          : currentCombo >= 7
            ? '#f97316'
            : currentCombo >= 5
              ? '#eab308'
              : '#22c55e';
      setScorePopups((prev) => [...prev, { id, x, y, text, color }]);
      setTimeout(() => {
        setScorePopups((prev) => prev.filter((p) => p.id !== id));
      }, 1000);
    },
    [],
  );

  const startMoleMovement = useCallback(() => {
    const showMole = () => {
      if (!playingRef.current) return;
      wasHitRef.current = false;
      setMoleExiting(false);
      setActiveHole(Math.floor(Math.random() * HOLES));
    };
    showMole();
    moleTimerRef.current = setInterval(
      () => {
        if (!playingRef.current) return;
        const keepActive = Math.random() < 0.3;
        if (!keepActive) {
          if (!wasHitRef.current) {
            comboRef.current = 0;
            setCombo(0);
          }
          // Gravity drop exit animation
          setMoleExiting(true);
          setTimeout(() => {
            setActiveHole(null);
            setMoleExiting(false);
          }, 200);
        }
        setTimeout(() => {
          showMole();
        }, 300);
      },
      800 + Math.random() * 600,
    );
  }, []);

  const startGame = useCallback(() => {
    clearAllTimers();
    setScore(0);
    setCombo(0);
    comboRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setActiveHole(null);
    setHitHole(null);
    setDeathEmoji('');
    setParticles([]);
    setScorePopups([]);
    setFreezeFrame(false);
    setMoleExiting(false);
    setCountdown(3);
    setPlaying(false);
    playingRef.current = false;

    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setPlaying(true);
        playingRef.current = true;
        startMoleMovement();

        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearAllTimers();
              setPlaying(false);
              playingRef.current = false;
              setGameOver(true);
              setActiveHole(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearAllTimers, startMoleMovement]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const whack = useCallback(
    (holeIndex: number) => {
      if (!playingRef.current || gameOver) return;
      if (activeHole === holeIndex && !freezeFrame) {
        wasHitRef.current = true;
        comboRef.current += 1;
        const currentCombo = comboRef.current;
        setCombo(currentCombo);
        if (currentCombo > bestCombo) {
          setBestCombo(currentCombo);
          saveGameValue(COMBO_KEY, currentCombo);
        }

        const points = 1 + Math.max(0, currentCombo - 1);
        setScore((s) => {
          const newScore = s + points;
          if (newScore > bestScore) {
            setBestScore(newScore);
            saveBestScore('whackamole', newScore);
          }
          return newScore;
        });

        // ── Death expression ──
        const death = DEATH_EMOJIS[Math.floor(Math.random() * DEATH_EMOJIS.length)];
        setDeathEmoji(death);
        setHitHole(holeIndex);

        // ── Freeze frame (2 frames / ~33ms) ──
        setFreezeFrame(true);
        setTimeout(() => setFreezeFrame(false), 40);

        // ── Screen shake (intensity scales with combo) ──
        const shakeIntensity = Math.min(12, 4 + currentCombo * 0.8);
        triggerShake(shakeIntensity);

        // ── Particles ──
        if (boardRef.current) {
          const holes = boardRef.current.querySelectorAll('[data-hole]');
          const hole = holes[holeIndex] as HTMLElement;
          if (hole) {
            const rect = hole.getBoundingClientRect();
            const boardRect = boardRef.current.getBoundingClientRect();
            const cx = ((rect.left + rect.width / 2 - boardRect.left) / boardRect.width) * 100;
            const cy = ((rect.top + rect.height / 2 - boardRect.top) / boardRect.height) * 100;
            const particleCount = Math.min(15, 8 + currentCombo);
            spawnParticles(cx, cy, particleCount);
            spawnScorePopup(cx, cy - 8, points, currentCombo);
          }
        }

        // ── Clear hit state after death expression shows ──
        setTimeout(() => {
          setHitHole(null);
          setDeathEmoji('');
          setActiveHole(null);
        }, 400);
      } else {
        comboRef.current = 0;
        setCombo(0);
      }
    },
    [
      gameOver,
      activeHole,
      bestScore,
      bestCombo,
      freezeFrame,
      triggerShake,
      spawnParticles,
      spawnScorePopup,
    ],
  );

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <div style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('打地鼠', 'Whack A Mole')}</h1>
            <p className="text-sm text-secondary">
              {t('快速点击冒出的地鼠！', 'Whack the moles quickly!')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="bg-surface-container-high rounded-xl px-3 py-2 sm:px-4 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('时间', 'Time')}
              </div>
              <div
                className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-primary'} tabular-nums`}
              >
                {timeLeft}s
              </div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-3 py-2 sm:px-4 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div key={score} className="text-xl font-bold text-primary">
                {score}
              </div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-3 py-2 sm:px-4 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {t('最佳', 'Best')}
              </div>
              <div className="text-xl font-bold text-tertiary">{bestScore}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-3 py-2 sm:px-4 text-center">
              <div className="text-xs text-secondary font-medium">
                🔥 {t('最佳连击', 'Best Combo')}
              </div>
              <div className="text-xl font-bold text-tertiary">{bestCombo}</div>
            </div>
          </div>
        </div>

        {/* Countdown overlay */}
        {countdown > 0 && !playing && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="text-8xl font-black text-primary drop-shadow-lg">{countdown}</span>
          </div>
        )}

        {/* Game Board */}
        <div
          ref={boardRef}
          className="relative bg-gradient-to-b from-green-800/30 via-green-700/20 to-green-900/40 rounded-3xl p-6 mb-6 border-4 border-green-800/30 overflow-hidden"
        >
          {/* Grass texture background */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-green-200/20 to-green-400/30 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-green-600/20 to-transparent pointer-events-none" />

          {/* Decorative grass blades */}
          <div className="absolute bottom-2 left-4 text-2xl opacity-30 pointer-events-none">🌾</div>
          <div className="absolute bottom-3 right-6 text-xl opacity-25 pointer-events-none">🌿</div>
          <div className="absolute top-3 left-1/4 text-lg opacity-20 pointer-events-none">🍀</div>

          <div className="grid grid-cols-3 gap-3 relative">
            {Array.from({ length: HOLES }).map((_, i) => {
              const hasMole = activeHole === i && playing;
              const wasHit = hitHole === i;
              return (
                <div key={i} data-hole className="relative">
                  {/* Hole */}
                  <div className="w-full aspect-square rounded-full bg-gradient-to-b from-[#4A3728] to-[#3E2723] shadow-inner flex items-end justify-center overflow-hidden border-2 border-[#5D4037]/50">
                    {/* Dirt rim */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-[#8B6914]/40 to-transparent rounded-t-full" />

                    {/* Mole */}
                    {hasMole && !wasHit && (
                      <button
                        key={`mole-${i}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          whack(i);
                        }}
                        className="absolute bottom-0 w-[90%] aspect-square rounded-t-full text-4xl flex items-end justify-center pb-1 cursor-pointer select-none"
                      >
                        <span>🐹</span>
                      </button>
                    )}

                    {/* Death expression */}
                    {wasHit && (
                      <div
                        key={`dead-${i}`}
                        className="absolute bottom-0 w-[90%] aspect-square rounded-t-full text-4xl flex items-end justify-center pb-1 pointer-events-none select-none"
                      >
                        <span className="drop-shadow-lg">{deathEmoji}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Particle layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <div key={p.id} className="absolute text-center" style={{ fontSize: `${p.size}px` }}>
                {p.emoji}
              </div>
            ))}
          </div>

          {/* Score popup layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {scorePopups.map((p) => (
              <div
                key={p.id}
                className="absolute font-black text-lg drop-shadow-md"
                style={{ color: p.color, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                {p.text}
              </div>
            ))}
          </div>
        </div>

        {/* Combo indicator */}
        {combo >= 2 && playing && (
          <div key={combo} className="text-center mb-4">
            <span
              className={`font-black inline-block ${
                combo >= 10
                  ? 'text-4xl text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : combo >= 7
                    ? 'text-3xl text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                    : combo >= 5
                      ? 'text-2xl text-yellow-500'
                      : 'text-xl text-primary'
              }`}
            >
              🔥 {combo} {t('连击！', 'Combo!')}
            </span>
          </div>
        )}

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

        {gameOver && (
          <div className="mt-6 p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700/30 rounded-2xl text-center">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {t('时间到！', "Time's up!")}
            </p>
            <p className="text-xl font-bold text-orange-500 mb-1">
              {t('得分', 'Score')}: {score}
            </p>
            {bestCombo > 0 && (
              <p className="text-sm text-orange-400 mb-1">
                🔥 {t('最佳连击', 'Best Combo')}: {bestCombo}
              </p>
            )}
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
      </div>
    </div>
  );
}
