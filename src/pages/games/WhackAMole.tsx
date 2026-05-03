import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Clock, Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const GAME_DURATION = 30; // seconds
const HOLES = 9;

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_whackamole_best') || '0'); } catch { return 0; }
}
function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_whackamole_best', JSON.stringify(score));
}
function loadBestCombo(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_whackamole_best_combo') || '0'); } catch { return 0; }
}
function saveBestCombo(combo: number) {
  localStorage.setItem('spring_nest_whackamole_best_combo', JSON.stringify(combo));
}

export default function WhackAMole({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(loadBestCombo);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [lastHit, setLastHit] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasHitRef = useRef(false);
  const [countdown, setCountdown] = useState(3);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (moleTimerRef.current) { clearInterval(moleTimerRef.current); moleTimerRef.current = null; }
  }, []);

  const startMoleMovement = useCallback(() => {
    const showMole = () => {
      wasHitRef.current = false;
      setActiveHole(Math.floor(Math.random() * HOLES));
    };
    showMole();
    moleTimerRef.current = setInterval(() => {
      const keepActive = Math.random() < 0.3;
      if (!keepActive) {
        if (!wasHitRef.current) {
          setCombo(0); // Mole escaped, reset combo
        }
        setActiveHole(null);
      }
      setTimeout(() => {
        if (playing) showMole();
      }, 200);
    }, 800 + Math.random() * 600);
  }, [playing]);

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setActiveHole(null);
    setCountdown(3);

    // Countdown
    let count = 3;
    const countInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countInterval);
        setPlaying(true);
        startMoleMovement();

        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearAllTimers();
              setPlaying(false);
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

  useEffect(() => { return clearAllTimers; }, [clearAllTimers]);

  const whack = useCallback((holeIndex: number) => {
    if (!playing || gameOver) return;
    if (activeHole === holeIndex) {
      wasHitRef.current = true;
      setCombo(prev => {
        const newCombo = prev + 1;
        if (newCombo > bestCombo) {
          setBestCombo(newCombo);
          saveBestCombo(newCombo);
        }
        return newCombo;
      });
      setScore(s => {
        const comboBonus = Math.max(0, combo); // combo is still old value here
        const points = 1 + comboBonus;
        const newScore = s + points;
        if (newScore > bestScore) {
          setBestScore(newScore);
          saveBestScore(newScore);
        }
        return newScore;
      });
      setLastHit(holeIndex);
      setActiveHole(null);
    } else {
      setCombo(0); // Missed, reset combo
    }
  }, [playing, gameOver, activeHole, bestScore, bestCombo, combo]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('打地鼠', 'Whack A Mole')}</h1>
            <p className="text-sm text-secondary">{t('快速点击冒出的地鼠！', 'Whack the moles quickly!')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{t('时间', 'Time')}</div>
              <div className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-primary'} tabular-nums`}>{timeLeft}s</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div className="text-xl font-bold text-primary">{score}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />{t('最佳', 'Best')}</div>
              <div className="text-xl font-bold text-tertiary">{bestScore}</div>
            </div>
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium">🔥 {t('最佳连击', 'Best Combo')}</div>
              <div className="text-xl font-bold text-tertiary">{bestCombo}</div>
            </div>
          </div>
        </div>

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown > 0 && !playing && !gameOver && (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <span className="text-8xl font-black text-primary">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Board */}
        <div className="relative bg-[#8B6914]/20 rounded-3xl p-6 mb-6 border-4 border-[#8B6914]/30">
          {/* Grass background */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-green-200/30 to-green-300/40 pointer-events-none" />

          <div className="grid grid-cols-3 gap-3 relative">
            {Array.from({ length: HOLES }).map((_, i) => {
              const hasMole = activeHole === i && playing;
              const wasHit = lastHit === i;
              return (
                <div key={i} className="relative">
                  {/* Hole */}
                  <div className="w-full aspect-square rounded-full bg-[#5D4037] shadow-inner flex items-end justify-center overflow-hidden">
                    {/* Mole */}
                    <AnimatePresence>
                      {hasMole && (
                        <motion.button
                          initial={{ y: 60, scale: 0.8 }}
                          animate={{ y: 0, scale: 1 }}
                          exit={{ y: 60, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          onClick={(e) => { e.stopPropagation(); whack(i); }}
                          className={`absolute bottom-0 w-[90%] aspect-square rounded-t-full text-4xl flex items-end justify-center pb-1 cursor-pointer active:scale-90 transition-transform ${
                            wasHit ? 'opacity-50' : ''
                          }`}
                        >
                          🐹
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Combo indicator */}
        <AnimatePresence>
          {combo >= 2 && playing && (
            <motion.div
              key={combo}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="text-center mb-4"
            >
              <span className={`font-black ${
                combo >= 10 ? 'text-4xl text-red-500' :
                combo >= 7 ? 'text-3xl text-orange-500' :
                combo >= 5 ? 'text-2xl text-yellow-500' :
                'text-xl text-primary'
              }`}>
                🔥 {combo} {t('连击！', 'Combo!')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-2xl text-center"
            >
              <p className="text-2xl mb-2">{t('时间到！', "Time's up!")}</p>
              <p className="text-xl font-bold text-orange-600 mb-1">{t('得分', 'Score')}: {score}</p>
              {bestCombo > 0 && <p className="text-sm text-orange-500 mb-1">🔥 {t('最佳连击', 'Best Combo')}: {bestCombo}</p>}
              {score > 0 && score === bestScore && <p className="text-sm text-orange-500 mb-4">🏆 {t('新纪录！', 'New Record!')}</p>}
              <button onClick={startGame} className="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors">
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
