import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Clock, Trophy, Leaf } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const GAME_DURATION = 60;
const LEAF_TYPES = ['🍂', '🍁', '🌿', '🍃'];
const BRANCH_EMOJI = '🪵';
const ANIMAL_EMOJIS = ['🦊', '🐿️', '🦉'];
const TREE_EMOJIS = ['🌳', '🌲', '🌴'];

interface FallingItem {
  id: number;
  x: number;
  y: number;
  type: 'leaf' | 'branch';
  emoji: string;
  speed: number;
  size: number;
}

interface Animal {
  id: number;
  emoji: string;
  x: number;
  y: number;
  visible: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  angle: number;
  distance: number;
}

function loadBestScore(): number {
  try {
    return JSON.parse(localStorage.getItem('spring_nest_forest_best') || '0');
  } catch {
    return 0;
  }
}
function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_forest_best', JSON.stringify(score));
}

const SPARKLE_POOL = ['✨', '🌸', '💫'];
const CELEBRATION_POOL = ['🌟', '🎉', '✨', '🌸', '💫'];

const FLOATING_DECOR = [
  { emoji: '☁️', top: '8%', delay: 0, duration: 18, opacity: 0.3 },
  { emoji: '☁️', top: '18%', delay: 4, duration: 22, opacity: 0.2 },
  { emoji: '🦋', top: '25%', delay: 2, duration: 14, opacity: 0.4 },
  { emoji: '☁️', top: '12%', delay: 9, duration: 20, opacity: 0.25 },
  { emoji: '🦋', top: '35%', delay: 7, duration: 12, opacity: 0.35 },
  { emoji: '🐦', top: '15%', delay: 11, duration: 16, opacity: 0.3 },
];

const TREE_LAYOUT = [
  { emoji: '🌳', size: 'text-6xl', mb: -12 },
  { emoji: '🌲', size: 'text-5xl', mb: -8 },
  { emoji: '🌳', size: 'text-7xl', mb: -14 },
  { emoji: '🌴', size: 'text-4xl', mb: -6 },
  { emoji: '🌲', size: 'text-6xl', mb: -10 },
  { emoji: '🌳', size: 'text-5xl', mb: -8 },
  { emoji: '🌲', size: 'text-7xl', mb: -14 },
  { emoji: '🌴', size: 'text-5xl', mb: -8 },
];

export default function ForestWalk({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [hitEffect, setHitEffect] = useState<{
    id: number;
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [branchShake, setBranchShake] = useState(false);
  const [combo, setCombo] = useState(0);
  const nextIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (spawnRef.current) {
      clearInterval(spawnRef.current);
      spawnRef.current = null;
    }
    if (moveRef.current) {
      clearInterval(moveRef.current);
      moveRef.current = null;
    }
    if (animalRef.current) {
      clearInterval(animalRef.current);
      animalRef.current = null;
    }
  }, []);

  const spawnItem = useCallback(() => {
    const isBranch = Math.random() < 0.2;
    const newItem: FallingItem = {
      id: nextIdRef.current++,
      x: 5 + Math.random() * 85,
      y: -10,
      type: isBranch ? 'branch' : 'leaf',
      emoji: isBranch ? BRANCH_EMOJI : LEAF_TYPES[Math.floor(Math.random() * LEAF_TYPES.length)],
      speed: 1.5 + Math.random() * 2,
      size: 0.8 + Math.random() * 0.6,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const spawnAnimal = useCallback(() => {
    const emoji = ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)];
    const newAnimal: Animal = {
      id: nextIdRef.current++,
      emoji,
      x: 10 + Math.random() * 75,
      y: 60 + Math.random() * 25,
      visible: true,
    };
    setAnimals((prev) => [...prev, newAnimal]);
    setTimeout(() => {
      setAnimals((prev) => prev.map((a) => (a.id === newAnimal.id ? { ...a, visible: false } : a)));
    }, 3000);
  }, []);

  const emitParticles = useCallback((x: number, y: number, pool: string[], count: number) => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x,
      y,
      emoji: pool[Math.floor(Math.random() * pool.length)],
      angle: (360 / count) * i + Math.random() * 30,
      distance: 30 + Math.random() * 40,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 700);
  }, []);

  const startGame = useCallback(() => {
    clearAllTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setItems([]);
    setAnimals([]);
    setCombo(0);
    setHitEffect(null);
    setParticles([]);
    setBranchShake(false);
    setPlaying(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          setPlaying(false);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(
      () => {
        spawnItem();
      },
      600 + Math.random() * 400,
    );

    moveRef.current = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({ ...item, y: item.y + item.speed })).filter((item) => item.y < 110),
      );
    }, 50);

    animalRef.current = setInterval(() => {
      if (Math.random() < 0.4) spawnAnimal();
    }, 4000);
  }, [clearAllTimers, spawnItem, spawnAnimal]);

  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  const catchItem = useCallback(
    (item: FallingItem) => {
      if (!playing || gameOver) return;

      if (item.type === 'branch') {
        setScore((s) => Math.max(0, s - 2));
        setCombo(0);
        setHitEffect({ id: item.id, x: item.x, y: item.y, text: '-2' });
        setBranchShake(true);
        setTimeout(() => setBranchShake(false), 400);
      } else {
        const comboBonus = combo >= 3 ? 2 : combo >= 2 ? 1 : 0;
        const points = 1 + comboBonus;
        setCombo((c) => c + 1);
        setScore((s) => {
          const newScore = s + points;
          if (newScore > bestScore) {
            setBestScore(newScore);
            saveBestScore(newScore);
          }
          return newScore;
        });
        setHitEffect({
          id: item.id,
          x: item.x,
          y: item.y,
          text: comboBonus > 0 ? `+${points} 🔥` : `+${points}`,
        });
        emitParticles(item.x, item.y, SPARKLE_POOL, 4);
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTimeout(() => setHitEffect(null), 600);
    },
    [playing, gameOver, combo, bestScore, emitParticles],
  );

  const catchAnimal = useCallback(
    (animal: Animal) => {
      if (!playing || gameOver) return;
      const bonus = 5;
      setScore((s) => {
        const newScore = s + bonus;
        if (newScore > bestScore) {
          setBestScore(newScore);
          saveBestScore(newScore);
        }
        return newScore;
      });
      setHitEffect({ id: animal.id, x: animal.x, y: animal.y, text: `+${bonus} ✨` });
      emitParticles(animal.x, animal.y, CELEBRATION_POOL, 6);
      setAnimals((prev) => prev.map((a) => (a.id === animal.id ? { ...a, visible: false } : a)));
      setTimeout(() => setHitEffect(null), 600);
    },
    [playing, gameOver, bestScore, emitParticles],
  );

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('森林漫步', 'Forest Walk')}</h1>
            <p className="text-sm text-secondary">
              {t('收集落叶，避开树枝！', 'Collect leaves, avoid branches!')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('时间', 'Time')}
              </div>
              <div
                className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-primary'} tabular-nums`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                {t('分数', 'Score')}
              </div>
              <div className="text-xl font-bold text-primary">{score}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {t('最佳', 'Best')}
              </div>
              <div className="text-xl font-bold text-tertiary">{bestScore}</div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {combo >= 2 && playing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
              animate={{
                opacity: 1,
                scale: [0.3, 1.2, 1],
                rotate: [15, -5, 0],
              }}
              exit={{ opacity: 0, scale: 0.3, rotate: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              className="text-center mb-2"
            >
              <motion.span
                animate={
                  combo >= 5
                    ? {
                        scale: [1, 1.15, 1],
                        rotate: [0, -3, 3, 0],
                      }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 0.8 }}
                className={`inline-block text-sm font-black drop-shadow-lg ${
                  combo >= 5
                    ? 'text-2xl bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent'
                    : combo >= 3
                      ? 'text-lg text-orange-500'
                      : 'text-amber-500'
                }`}
              >
                {combo >= 5
                  ? `🔥 ${t('超级连击', 'Super Combo')} x${combo} 🔥`
                  : combo >= 3
                    ? `🔥 ${t('连击', 'Combo')} x${combo}`
                    : `✨ x${combo}`}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          ref={gameAreaRef}
          animate={
            branchShake
              ? {
                  x: [0, -8, 8, -6, 6, -3, 3, 0],
                  transition: { duration: 0.4 },
                }
              : { x: 0 }
          }
          className={`relative bg-gradient-to-b from-green-100/60 via-green-200/40 to-green-300/50 dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/30 rounded-3xl overflow-hidden mb-4 border-2 border-green-300/30 dark:border-green-700/30 ${
            branchShake ? 'ring-2 ring-red-400/60' : ''
          }`}
          style={{ height: '400px' }}
        >
          {/* Branch hit red flash overlay */}
          <AnimatePresence>
            {branchShake && (
              <motion.div
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-red-500/20 pointer-events-none z-30 rounded-3xl"
              />
            )}
          </AnimatePresence>

          {/* Floating background decorations (parallax) */}
          {FLOATING_DECOR.map((decor, i) => (
            <motion.div
              key={`decor-${i}`}
              className="absolute pointer-events-none select-none"
              style={{ top: decor.top, opacity: decor.opacity, fontSize: '1.5rem' }}
              initial={{ left: '-10%' }}
              animate={{ left: ['110%', '-10%'] }}
              transition={{
                duration: decor.duration,
                repeat: Infinity,
                delay: decor.delay,
                ease: 'linear',
              }}
            >
              {decor.emoji}
            </motion.div>
          ))}

          {/* Tree silhouettes at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end pointer-events-none opacity-40">
            {TREE_LAYOUT.map((tree, i) => (
              <span
                key={i}
                className={tree.size}
                style={{
                  marginBottom: `${tree.mb}px`,
                  filter: 'drop-shadow(0 -2px 4px rgba(0,80,0,0.15))',
                }}
              >
                {tree.emoji}
              </span>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-600/30 to-transparent pointer-events-none" />

          {items.map((item) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: item.size }}
              className={`absolute cursor-pointer active:scale-125 transition-transform touch-none select-none ${
                item.type === 'branch' ? 'hover:scale-110' : 'hover:scale-125'
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: `${1.5 + item.size}rem`,
                transform: `translate(-50%, -50%)`,
              }}
              onClick={() => catchItem(item)}
            >
              {item.emoji}
            </motion.button>
          ))}

          <AnimatePresence>
            {animals
              .filter((a) => a.visible)
              .map((animal) => (
                <motion.button
                  key={animal.id}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="absolute cursor-pointer text-3xl active:scale-125 transition-transform touch-none select-none"
                  style={{
                    left: `${animal.x}%`,
                    top: `${animal.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => catchAnimal(animal)}
                >
                  {animal.emoji}
                </motion.button>
              ))}
          </AnimatePresence>

          {/* Score popups with better styling */}
          <AnimatePresence>
            {hitEffect && (
              <motion.div
                key={hitEffect.id}
                initial={{ opacity: 1, y: 0, scale: 0.6 }}
                animate={{ opacity: 0, y: -50, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute pointer-events-none z-20"
                style={{
                  left: `${hitEffect.x}%`,
                  top: `${hitEffect.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span
                  className="font-black text-xl drop-shadow-lg"
                  style={{
                    color: hitEffect.text.startsWith('-') ? '#ef4444' : '#16a34a',
                    textShadow: hitEffect.text.startsWith('-')
                      ? '0 0 8px rgba(239,68,68,0.6)'
                      : '0 0 8px rgba(34,197,94,0.6)',
                  }}
                >
                  {hitEffect.text}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sparkle / celebration particles */}
          <AnimatePresence>
            {particles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.distance;
              const ty = Math.sin(rad) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{ opacity: 0, x: tx, y: ty, scale: 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute pointer-events-none text-sm z-20"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {p.emoji}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!playing && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/20 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <p className="text-5xl mb-4">🌳</p>
                <p className="text-lg font-bold text-on-surface mb-2">
                  {t('森林漫步', 'Forest Walk')}
                </p>
                <p className="text-sm text-secondary mb-6 px-4">
                  {t(
                    '点击收集落叶 🍂，避开树枝 🪵，抓住小动物加分！',
                    'Tap falling leaves 🍂, avoid branches 🪵, catch animals for bonus!',
                  )}
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {t('开始漫步', 'Start Walking')}
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>

        {(playing || gameOver) && (
          <div className="flex justify-center">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {t('重新开始', 'Restart')}
            </button>
          </div>
        )}

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mt-6 p-6 rounded-2xl text-center border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.15), rgba(52,211,153,0.08))',
                borderColor: 'rgba(34,197,94,0.25)',
              }}
            >
              <motion.p
                className="text-5xl mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 10 }}
              >
                🌿
              </motion.p>
              <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-300 mb-2">
                {t('漫步结束！', 'Walk Complete!')}
              </p>
              <p className="text-base text-green-600 dark:text-green-400 mb-1 font-semibold">
                {t('得分', 'Score')}: <span className="text-xl">{score}</span>
              </p>
              {score > 0 && score >= bestScore && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 10, delay: 0.3 }}
                  className="text-base text-amber-500 font-bold mb-2"
                >
                  🏆 {t('新纪录！', 'New Record!')} 🏆
                </motion.p>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="mt-3 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                {t('再来一局', 'Play Again')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t(
            '点击落叶收集，点击树枝会扣分哦',
            'Tap leaves to collect, tapping branches loses points',
          )}
        </div>
      </motion.div>
    </div>
  );
}
