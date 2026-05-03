import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Clock, Footprints, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const EMOJIS = ['🌸', '🌿', '🍀', '🌻', '🦋', '🐝', '🍃', '🌷'];
const PAIRS = EMOJIS.length; // 8 pairs = 16 cards

interface Card {
  id: number;
  emoji: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

function shuffleCards(): Card[] {
  const pairs = EMOJIS.map((emoji, i) => [
    { id: i * 2, emoji, pairId: i, flipped: false, matched: false },
    { id: i * 2 + 1, emoji, pairId: i, flipped: false, matched: false },
  ]).flat();
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

function loadBestMoves(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_memory_best') || '0'); } catch { return 0; }
}
function saveBestMoves(moves: number) {
  localStorage.setItem('spring_nest_memory_best', JSON.stringify(moves));
}

export default function MemoryGame({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [cards, setCards] = useState<Card[]>(shuffleCards);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [bestMoves, setBestMoves] = useState(loadBestMoves);
  const [gameComplete, setGameComplete] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameComplete) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [startTime, gameComplete]);

  const handleFlip = useCallback((id: number) => {
    if (processingRef.current || gameComplete) return;

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
        // Match
        setCards(prev => prev.map(c =>
          c.id === first.id || c.id === second.id ? { ...c, matched: true, flipped: true } : c
        ));
        setFlippedIds([]);
        setMatchedCount(m => {
          const newCount = m + 1;
          if (newCount === PAIRS) {
            const finalMoves = moves + 1;
            setGameComplete(true);
            if (!bestMoves || finalMoves < bestMoves) {
              setBestMoves(finalMoves);
              saveBestMoves(finalMoves);
            }
          }
          return newCount;
        });
        processingRef.current = false;
      } else {
        // No match — flip back after delay
        setTimeout(() => {
          setFlippedIds([]);
          processingRef.current = false;
        }, 800);
      }
    }
  }, [cards, flippedIds, moves, bestMoves, gameComplete]);

  const reset = () => {
    setCards(shuffleCards());
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setGameComplete(false);
    processingRef.current = false;
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

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
            <p className="text-sm text-secondary">{t('找出所有配对', 'Find all matching pairs')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary flex items-center gap-1"><Clock className="w-3 h-3" />{t('用时', 'Time')}</div>
            <div className="text-xl font-bold text-primary tabular-nums">{formatTime(elapsed)}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary flex items-center gap-1"><Footprints className="w-3 h-3" />{t('步数', 'Moves')}</div>
            <div className="text-xl font-bold text-primary">{moves}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
            <div className="text-xl font-bold text-tertiary">{bestMoves || '—'}</div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {cards.map(card => {
            const isFlipped = card.flipped || card.matched || flippedIds.includes(card.id);
            return (
              <motion.button
                key={card.id}
                onClick={() => handleFlip(card.id)}
                whileHover={!isFlipped ? { scale: 1.05 } : {}}
                whileTap={!isFlipped ? { scale: 0.95 } : {}}
                className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-colors ${
                  isFlipped
                    ? card.matched
                      ? 'bg-green-100 border-green-300 border-2'
                      : 'bg-white border-primary/20 border-2'
                    : 'bg-primary-container/50 border border-surface-variant/30 hover:bg-primary-container cursor-pointer'
                } ${card.matched ? 'opacity-80' : ''}`}
                disabled={isFlipped}
              >
                <AnimatePresence>
                  {isFlipped && (
                    <motion.span initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} exit={{ scale: 0, rotateY: -180 }}>
                      {card.emoji}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('重新开始', 'Restart')}
          </button>
        </div>

        <AnimatePresence>
          {gameComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
            >
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-xl font-bold text-green-600 mb-2">{t('恭喜完成！', 'Congratulations!')}</p>
              <p className="text-sm text-green-500 mb-1">{t('用时', 'Time')}: {formatTime(elapsed)}</p>
              <p className="text-sm text-green-500 mb-4">{t('步数', 'Moves')}: {moves}</p>
              <button onClick={reset} className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors">
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
