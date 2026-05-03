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

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_forest_best') || '0'); } catch { return 0; }
}
function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_forest_best', JSON.stringify(score));
}

export default function ForestWalk({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [hitEffect, setHitEffect] = useState<{ id: number; x: number; y: number; text: string } | null>(null);
  const [combo, setCombo] = useState(0);
  const nextIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (spawnRef.current) { clearInterval(spawnRef.current); spawnRef.current = null; }
    if (moveRef.current) { clearInterval(moveRef.current); moveRef.current = null; }
    if (animalRef.current) { clearInterval(animalRef.current); animalRef.current = null; }
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
    setItems(prev => [...prev, newItem]);
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
    setAnimals(prev => [...prev, newAnimal]);
    setTimeout(() => {
      setAnimals(prev => prev.map(a => a.id === newAnimal.id ? { ...a, visible: false } : a));
    }, 3000);
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
    setPlaying(true);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearAllTimers();
          setPlaying(false);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(() => {
      spawnItem();
    }, 600 + Math.random() * 400);

    moveRef.current = setInterval(() => {
      setItems(prev =>
        prev
          .map(item => ({ ...item, y: item.y + item.speed }))
          .filter(item => item.y < 110)
      );
    }, 50);

    animalRef.current = setInterval(() => {
      if (Math.random() < 0.4) spawnAnimal();
    }, 4000);
  }, [clearAllTimers, spawnItem, spawnAnimal]);

  useEffect(() => { return clearAllTimers; }, [clearAllTimers]);

  const catchItem = useCallback((item: FallingItem) => {
    if (!playing || gameOver) return;

    if (item.type === 'branch') {
      setScore(s => Math.max(0, s - 2));
      setCombo(0);
      setHitEffect({ id: item.id, x: item.x, y: item.y, text: '-2' });
    } else {
      const comboBonus = combo >= 3 ? 2 : combo >= 2 ? 1 : 0;
      const points = 1 + comboBonus;
      setCombo(c => c + 1);
      setScore(s => {
        const newScore = s + points;
        if (newScore > bestScore) {
          setBestScore(newScore);
          saveBestScore(newScore);
        }
        return newScore;
      });
      setHitEffect({ id: item.id, x: item.x, y: item.y, text: comboBonus > 0 ? `+${points} 🔥` : `+${points}` });
    }

    setItems(prev => prev.filter(i => i.id !== item.id));
    setTimeout(() => setHitEffect(null), 600);
  }, [playing, gameOver, combo, bestScore]);

  const catchAnimal = useCallback((animal: Animal) => {
    if (!playing || gameOver) return;
    const bonus = 5;
    setScore(s => {
      const newScore = s + bonus;
      if (newScore > bestScore) {
        setBestScore(newScore);
        saveBestScore(newScore);
      }
      return newScore;
    });
    setHitEffect({ id: animal.id, x: animal.x, y: animal.y, text: `+${bonus} ✨` });
    setAnimals(prev => prev.map(a => a.id === animal.id ? { ...a, visible: false } : a));
    setTimeout(() => setHitEffect(null), 600);
  }, [playing, gameOver, bestScore]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('森林漫步', 'Forest Walk')}</h1>
            <p className="text-sm text-secondary">{t('收集落叶，避开树枝！', 'Collect leaves, avoid branches!')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{t('时间', 'Time')}</div>
              <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-primary'} tabular-nums`}>{formatTime(timeLeft)}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Leaf className="w-3 h-3" />{t('分数', 'Score')}</div>
              <div className="text-xl font-bold text-primary">{score}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
              <div className="text-xl font-bold text-tertiary">{bestScore}</div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {combo >= 2 && playing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="text-center mb-2"
            >
              <span className="text-sm font-bold text-orange-500">
                {combo >= 5 ? `🔥 ${t('超级连击', 'Super Combo')} x${combo}` : combo >= 3 ? `🔥 ${t('连击', 'Combo')} x${combo}` : `✨ x${combo}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={gameAreaRef}
          className="relative bg-gradient-to-b from-green-100/60 via-green-200/40 to-green-300/50 dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/30 rounded-3xl overflow-hidden mb-4 border-2 border-green-300/30 dark:border-green-700/30"
          style={{ height: '400px' }}
        >
          <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end pointer-events-none opacity-40">
            {TREE_EMOJIS.map((tree, i) => (
              <span key={i} className="text-5xl" style={{ marginBottom: '-10px' }}>{tree}</span>
            ))}
            {TREE_EMOJIS.map((tree, i) => (
              <span key={`b-${i}`} className="text-4xl" style={{ marginBottom: '-5px' }}>{tree}</span>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-600/30 to-transparent pointer-events-none" />

          {items.map(item => (
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
            {animals.filter(a => a.visible).map(animal => (
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

          <AnimatePresence>
            {hitEffect && (
              <motion.div
                key={hitEffect.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -40, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute pointer-events-none font-bold text-lg"
                style={{
                  left: `${hitEffect.x}%`,
                  top: `${hitEffect.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: hitEffect.text.startsWith('-') ? '#ef4444' : '#22c55e',
                }}
              >
                {hitEffect.text}
              </motion.div>
            )}
          </AnimatePresence>

          {!playing && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/20 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <p className="text-5xl mb-4">🌳</p>
                <p className="text-lg font-bold text-on-surface mb-2">{t('森林漫步', 'Forest Walk')}</p>
                <p className="text-sm text-secondary mb-6 px-4">
                  {t('点击收集落叶 🍂，避开树枝 🪵，抓住小动物加分！', 'Tap falling leaves 🍂, avoid branches 🪵, catch animals for bonus!')}
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
        </div>

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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-2xl text-center"
            >
              <p className="text-2xl mb-2">🌿</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">{t('漫步结束！', 'Walk Complete!')}</p>
              <p className="text-sm text-green-500 dark:text-green-400 mb-1">{t('得分', 'Score')}: {score}</p>
              {score > 0 && score >= bestScore && <p className="text-sm text-green-500 mb-4">🏆 {t('新纪录！', 'New Record!')}</p>}
              <button onClick={startGame} className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors">
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('点击落叶收集，点击树枝会扣分哦', 'Tap leaves to collect, tapping branches loses points')}
        </div>
      </motion.div>
    </div>
  );
}
