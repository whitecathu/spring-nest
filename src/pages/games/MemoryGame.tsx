import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Clock, Footprints, Trophy, Settings, Sparkles, Zap, Mountain, Star } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const EMOJIS = ['🌸', '🌿', '🍀', '🌻', '🦋', '🐝', '🍃', '🌷', '🌹', '🌺', '🌼', '💐'];

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: number; label: [string, string]; icon: typeof Sparkles; color: string }> = {
  easy:   { pairs: 4,  cols: 4, label: ['简单', 'Easy'], icon: Sparkles, color: 'from-green-400 to-emerald-500' },
  normal: { pairs: 8,  cols: 4, label: ['普通', 'Normal'], icon: Zap, color: 'from-amber-400 to-orange-500' },
  hard:   { pairs: 12, cols: 6, label: ['困难', 'Hard'], icon: Mountain, color: 'from-rose-400 to-red-500' },
};

interface Card {
  id: number;
  emoji: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

// Sparkle particle for match celebration
interface Sparkle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  delay: number;
}

// Confetti particle for completion celebration
interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  scale: number;
  delay: number;
}

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
const SPARKLE_EMOJIS = ['✨', '🌸', '⭐', '💫', '🌟'];

function shuffleCards(pairs: number): Card[] {
  const selected = EMOJIS.slice(0, pairs);
  const cards = selected.map((emoji, i) => [
    { id: i * 2, emoji, pairId: i, flipped: false, matched: false },
    { id: i * 2 + 1, emoji, pairId: i, flipped: false, matched: false },
  ]).flat();
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function generateSparkles(): Sparkle[] {
  const sparkles: Sparkle[] = [];
  for (let i = 0; i < 8; i++) {
    sparkles.push({
      id: i,
      x: (Math.random() - 0.5) * 120,
      y: (Math.random() - 0.5) * 120,
      emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)],
      delay: Math.random() * 0.15,
    });
  }
  return sparkles;
}

function generateConfetti(): Confetti[] {
  const particles: Confetti[] = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      id: i,
      x: (Math.random() - 0.5) * 500,
      y: -Math.random() * 600 - 100,
      rotation: Math.random() * 720 - 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      scale: 0.5 + Math.random() * 1,
      delay: Math.random() * 0.6,
    });
  }
  return particles;
}

function loadBestMoves(difficulty: Difficulty): number {
  try { return JSON.parse(localStorage.getItem(`spring_nest_memory_best_${difficulty}`) || '0'); } catch { return 0; }
}
function saveBestMoves(difficulty: Difficulty, moves: number) {
  localStorage.setItem(`spring_nest_memory_best_${difficulty}`, JSON.stringify(moves));
}

export default function MemoryGame({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [bestMoves, setBestMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const processingRef = useRef(false);

  // New state for enhanced animations
  const [shakingIds, setShakingIds] = useState<number[]>([]);
  const [matchSparkles, setMatchSparkles] = useState<{ cardId: number; sparkles: Sparkle[] } | null>(null);
  const [matchedPairFlash, setMatchedPairFlash] = useState<number[]>([]);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [prevMoves, setPrevMoves] = useState(0);
  const [prevElapsed, setPrevElapsed] = useState(0);
  const [movesBounce, setMovesBounce] = useState(false);
  const [elapsedBounce, setElapsedBounce] = useState(false);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setCards(shuffleCards(DIFFICULTY_CONFIG[d].pairs));
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setStartTime(Date.now());
    setElapsed(0);
    setBestMoves(loadBestMoves(d));
    setGameComplete(false);
    processingRef.current = false;
    setShakingIds([]);
    setMatchSparkles(null);
    setMatchedPairFlash([]);
    setConfetti([]);
    setPrevMoves(0);
    setPrevElapsed(0);
    setMovesBounce(false);
    setElapsedBounce(false);
  }, []);

  // Bounce animation for moves
  useEffect(() => {
    if (moves !== prevMoves && moves > 0) {
      setMovesBounce(true);
      setPrevMoves(moves);
      const timer = setTimeout(() => setMovesBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [moves, prevMoves]);

  // Bounce animation for elapsed time
  useEffect(() => {
    if (elapsed !== prevElapsed && elapsed > 0) {
      setElapsedBounce(true);
      setPrevElapsed(elapsed);
      const timer = setTimeout(() => setElapsedBounce(false), 200);
      return () => clearTimeout(timer);
    }
  }, [elapsed, prevElapsed]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameComplete && difficulty) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [startTime, gameComplete, difficulty]);

  const handleFlip = useCallback((id: number) => {
    if (processingRef.current || gameComplete || !difficulty) return;

    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    if (flippedIds.length === 2) return;

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      processingRef.current = true;
      setMoves(m => m + 1);

      const first = cards.find(c => c.id === newFlipped[0])!;
      const second = cards.find(c => c.id === newFlipped[1])!;

      if (first.pairId === second.pairId) {
        // Match - show sparkles and flash
        const sparkleData = generateSparkles();
        setMatchSparkles({ cardId: second.id, sparkles: sparkleData });
        setMatchedPairFlash([first.id, second.id]);

        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, matched: true, flipped: true } : c
          ));
          setFlippedIds([]);
          setMatchedCount(m => {
            const newCount = m + 1;
            if (newCount === DIFFICULTY_CONFIG[difficulty].pairs) {
              const finalMoves = moves + 1;
              setGameComplete(true);
              setConfetti(generateConfetti());
              if (!bestMoves || finalMoves < bestMoves) {
                setBestMoves(finalMoves);
                saveBestMoves(difficulty, finalMoves);
              }
            }
            return newCount;
          });
          // Clear sparkles after animation
          setTimeout(() => {
            setMatchSparkles(null);
            setMatchedPairFlash([]);
          }, 600);
          processingRef.current = false;
        }, 400);
      } else {
        // No match - shake then flip back
        setShakingIds([first.id, second.id]);
        setTimeout(() => {
          setShakingIds([]);
          setFlippedIds([]);
          processingRef.current = false;
        }, 800);
      }
    }
  }, [cards, flippedIds, moves, bestMoves, gameComplete, difficulty]);

  const reset = () => {
    if (!difficulty) return;
    setCards(shuffleCards(DIFFICULTY_CONFIG[difficulty].pairs));
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setStartTime(Date.now());
    setElapsed(0);
    setGameComplete(false);
    processingRef.current = false;
    setShakingIds([]);
    setMatchSparkles(null);
    setMatchedPairFlash([]);
    setConfetti([]);
    setPrevMoves(0);
    setPrevElapsed(0);
    setMovesBounce(false);
    setElapsedBounce(false);
  };

  const changeDifficulty = () => {
    setDifficulty(null);
    setGameComplete(false);
    setConfetti([]);
    setMatchSparkles(null);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Difficulty selector screen
  if (!difficulty) {
    return (
      <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm">
          <ArrowLeft className="w-5 h-5" />
          {t('返回游戏列表', 'Back to Games')}
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <motion.div
              className="text-5xl mb-4 inline-block"
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            >
              🃏
            </motion.div>
            <h1 className="text-3xl font-black text-on-surface mb-2">{t('记忆翻牌', 'Memory Match')}</h1>
            <p className="text-sm text-secondary">{t('选择难度开始游戏', 'Select difficulty to start')}</p>
          </div>

          <div className="flex flex-col gap-4">
            {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG.easy][]).map(([key, config], index) => {
              const best = loadBestMoves(key);
              const Icon = config.icon;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startGame(key)}
                  className="w-full p-5 bg-surface-container-high rounded-2xl border border-surface-variant/30 hover:bg-primary-container/50 transition-all text-left group relative overflow-hidden"
                >
                  {/* Subtle gradient accent on the left */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${config.color} rounded-l-2xl`} />

                  <div className="flex justify-between items-center pl-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-on-surface">{t(...config.label)}</p>
                        <p className="text-sm text-secondary">
                          {t(`${config.pairs} 对 ${config.pairs * 2} 张牌`, `${config.pairs} pairs · ${config.pairs * 2} cards`)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {best > 0 ? (
                        <div className="flex items-center gap-1 text-tertiary">
                          <Trophy className="w-4 h-4" />
                          <span className="text-sm font-semibold">{best} {t('步', 'moves')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-secondary">{t('暂无记录', 'No record')}</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('记忆翻牌', 'Memory Match')}</h1>
            <p className="text-sm text-secondary">
              {t('找出所有配对', 'Find all matching pairs')} · <span className="font-semibold text-primary">{t(...config.label)}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <motion.div
            className="bg-surface-container-high rounded-xl px-4 py-2 text-center"
            animate={elapsedBounce ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs text-secondary flex items-center gap-1"><Clock className="w-3 h-3" />{t('用时', 'Time')}</div>
            <div className="text-xl font-bold text-primary tabular-nums">{formatTime(elapsed)}</div>
          </motion.div>
          <motion.div
            className="bg-surface-container-high rounded-xl px-4 py-2 text-center"
            animate={movesBounce ? { scale: [1, 1.15, 1], color: ['var(--color-primary)', '#f59e0b', 'var(--color-primary)'] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="text-xs text-secondary flex items-center gap-1"><Footprints className="w-3 h-3" />{t('步数', 'Moves')}</div>
            <div className="text-xl font-bold text-primary">{moves}</div>
          </motion.div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
            <div className="text-xl font-bold text-tertiary">{bestMoves || '—'}</div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className={`grid gap-3 mb-6`} style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}>
          {cards.map(card => {
            const isFlipped = card.flipped || card.matched || flippedIds.includes(card.id);
            const isShaking = shakingIds.includes(card.id);
            const isMatchFlashing = matchedPairFlash.includes(card.id);
            const showSparklesOnThis = matchSparkles?.cardId === card.id;

            return (
              <div key={card.id} className="relative" style={{ perspective: '600px' }}>
                <motion.button
                  onClick={() => handleFlip(card.id)}
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                    x: isShaking ? [0, -6, 6, -4, 4, -2, 2, 0] : 0,
                    scale: isMatchFlashing ? [1, 1.15, 1] : 1,
                  }}
                  transition={{
                    rotateY: { duration: 0.5, ease: 'easeInOut' },
                    x: isShaking ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0.2 },
                    scale: isMatchFlashing ? { duration: 0.4 } : { duration: 0.2 },
                  }}
                  whileHover={!isFlipped ? { y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' } : {}}
                  whileTap={!isFlipped ? { scale: 0.95 } : {}}
                  className={`aspect-square rounded-2xl text-3xl w-full flex items-center justify-center ${
                    isFlipped
                      ? card.matched
                        ? 'bg-gradient-to-br from-green-100 to-emerald-200 border-green-300 border-2 shadow-md'
                        : 'bg-white border-primary/20 border-2'
                      : 'bg-gradient-to-br from-primary-container/60 to-primary-container/30 border border-surface-variant/30 cursor-pointer shadow-sm hover:shadow-md transition-shadow'
                  } ${card.matched ? 'opacity-90' : ''}`}
                  disabled={isFlipped}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Back face (visible when not flipped) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(0deg)',
                    }}
                  >
                    <span className="text-2xl opacity-40">?</span>
                  </div>

                  {/* Front face (visible when flipped) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <AnimatePresence>
                      {isFlipped && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          {card.emoji}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Sparkle burst on match */}
                <AnimatePresence>
                  {showSparklesOnThis && matchSparkles && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                      {matchSparkles.sparkles.map(sparkle => (
                        <motion.span
                          key={sparkle.id}
                          className="absolute text-lg"
                          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: [1, 1, 0],
                            scale: [0, 1.2, 0.6],
                            x: sparkle.x,
                            y: sparkle.y,
                          }}
                          transition={{
                            duration: 0.6,
                            delay: sparkle.delay,
                            ease: 'easeOut',
                          }}
                        >
                          {sparkle.emoji}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('重新开始', 'Restart')}
          </button>
          <button
            onClick={changeDifficulty}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            {t('切换难度', 'Change Difficulty')}
          </button>
        </div>

        <AnimatePresence>
          {gameComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl text-center relative overflow-hidden"
            >
              {/* Confetti particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {confetti.map(particle => (
                  <motion.div
                    key={particle.id}
                    className="absolute w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: particle.color,
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: particle.scale }}
                    animate={{
                      opacity: [1, 1, 0],
                      x: particle.x,
                      y: particle.y,
                      rotate: particle.rotation,
                      scale: [particle.scale, particle.scale, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: particle.delay,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                className="text-4xl mb-2 relative z-10"
              >
                🎉
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-green-600 mb-2 relative z-10"
              >
                {t('恭喜完成！', 'Congratulations!')}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative z-10"
              >
                <p className="text-sm text-green-500 mb-1">{t('难度', 'Difficulty')}: {t(...config.label)}</p>
                <p className="text-sm text-green-500 mb-1">{t('用时', 'Time')}: {formatTime(elapsed)}</p>
                <p className="text-sm text-green-500 mb-4">{t('步数', 'Moves')}: {moves}</p>
                {bestMoves === moves && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, type: 'spring' }}
                    className="flex items-center justify-center gap-1 text-amber-500 mb-4"
                  >
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-sm font-bold">{t('新纪录！', 'New Record!')}</span>
                    <Star className="w-4 h-4 fill-amber-400" />
                  </motion.div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-3 relative z-10"
              >
                <button onClick={reset} className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors">
                  {t('再来一局', 'Play Again')}
                </button>
                <button onClick={changeDifficulty} className="px-6 py-2 bg-white text-green-600 border border-green-300 rounded-full font-semibold hover:bg-green-50 transition-colors">
                  {t('切换难度', 'Change Difficulty')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
