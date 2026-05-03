import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Clock, Trophy, Flame } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const GAME_DURATION = 30;

interface ColorDef {
  name: string;
  nameEn: string;
  hex: string;
  symbol: string;
}

const COLORS: ColorDef[] = [
  { name: '红色', nameEn: 'Red', hex: '#EF4444', symbol: '●' },
  { name: '蓝色', nameEn: 'Blue', hex: '#3B82F6', symbol: '■' },
  { name: '绿色', nameEn: 'Green', hex: '#22C55E', symbol: '▲' },
  { name: '黄色', nameEn: 'Yellow', hex: '#EAB308', symbol: '★' },
];

function loadBestScore(): number {
  try { return JSON.parse(localStorage.getItem('spring_nest_stroop_best') || '0'); } catch { return 0; }
}

function saveBestScore(score: number) {
  localStorage.setItem('spring_nest_stroop_best', JSON.stringify(score));
}

function getRandomChallenge(avoidSame = true) {
  const wordIndex = Math.floor(Math.random() * COLORS.length);
  let colorIndex;
  if (avoidSame) {
    const others = COLORS.map((_, i) => i).filter(i => i !== wordIndex);
    colorIndex = others[Math.floor(Math.random() * others.length)];
  } else {
    colorIndex = Math.floor(Math.random() * COLORS.length);
  }
  return { wordIndex, colorIndex };
}

export default function ColorStroop({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [combo, setCombo] = useState(0);
  const [challenge, setChallenge] = useState<{ wordIndex: number; colorIndex: number } | null>(null);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [countdown, setCountdown] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (resultTimeoutRef.current) { clearTimeout(resultTimeoutRef.current); resultTimeoutRef.current = null; }
  }, []);

  const nextChallenge = useCallback(() => {
    setChallenge(getRandomChallenge());
    setLastResult(null);
  }, []);

  const startGame = useCallback(() => {
    clearAllTimers();
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setLastResult(null);
    setPlaying(false);
    playingRef.current = false;
    setChallenge(null);
    setCountdown(3);

    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        setPlaying(true);
        playingRef.current = true;
        setChallenge(getRandomChallenge());

        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearAllTimers();
              setPlaying(false);
              playingRef.current = false;
              setGameOver(true);
              // Save best score
              if (scoreRef.current > loadBestScore()) {
                saveBestScore(scoreRef.current);
                setBestScore(scoreRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearAllTimers]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const handleAnswer = useCallback((colorIndex: number) => {
    if (!playingRef.current || !challenge) return;

    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
    }

    const correct = challenge.colorIndex === colorIndex;

    if (correct) {
      comboRef.current += 1;
      setCombo(comboRef.current);
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setLastResult('correct');
    } else {
      comboRef.current = 0;
      setCombo(0);
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
      setLastResult('wrong');
    }

    // Briefly show result then move to next
    resultTimeoutRef.current = setTimeout(() => {
      if (playingRef.current) {
        nextChallenge();
      }
    }, 300);
  }, [challenge, nextChallenge]);

  const word = challenge ? COLORS[challenge.wordIndex] : null;
  const textColor = challenge ? COLORS[challenge.colorIndex] : null;

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[44px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-black text-on-surface">{t('色彩挑战', 'Color Stroop')}</h1>
          <p className="text-sm text-secondary">{t('选择文字的颜色，而不是文字本身', 'Select the text color, not the word itself')}</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-3 mb-4">
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('时间', 'Time')}
            </div>
            <div className={`text-xl font-bold tabular-nums ${timeLeft <= 5 && playing ? 'text-red-500' : 'text-primary'}`}>
              {timeLeft}s
            </div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
            <div className="text-xl font-bold text-primary">{score}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {t('最佳', 'Best')}
            </div>
            <div className="text-xl font-bold text-tertiary">{bestScore}</div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {t('连击', 'Combo')}
            </div>
            <div className="text-xl font-bold text-orange-500">{combo}</div>
          </div>
        </div>

        {/* Countdown */}
        <AnimatePresence>
          {countdown > 0 && !playing && !gameOver && (
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <span className="text-8xl font-black text-primary">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        {playing && word && textColor && (
          <div className="mb-6">
            {/* Instruction */}
            <p className="text-center text-sm text-secondary mb-4">
              {t('点击文字显示的【颜色】', 'Click the COLOR the text is displayed in')}
            </p>

            {/* Color Word Display */}
            <motion.div
              key={`${challenge.wordIndex}-${challenge.colorIndex}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center py-10 mb-6"
            >
              <span
                className="text-6xl sm:text-7xl font-black select-none"
                style={{ color: textColor.hex }}
              >
                {t(word.name, word.nameEn)}
              </span>
            </motion.div>

            {/* Answer feedback */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-center mb-4 text-lg font-bold ${
                    lastResult === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {lastResult === 'correct' ? t('正确！', 'Correct!') : t('错误！', 'Wrong!')}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Color Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((color, i) => (
                <motion.button
                  key={color.hex}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(i)}
                  className="flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg border-2 transition-all min-h-[56px]"
                  style={{
                    backgroundColor: `${color.hex}15`,
                    borderColor: `${color.hex}40`,
                    color: color.hex,
                  }}
                >
                  <span className="text-2xl" style={{ color: color.hex }}>{color.symbol}</span>
                  {t(color.name, color.nameEn)}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Pre-game / Game Over */}
        {!playing && !gameOver && countdown === 0 && (
          <div className="flex justify-center py-12">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all min-h-[44px]"
            >
              {t('开始游戏', 'Start Game')}
            </button>
          </div>
        )}

        {/* Restart button while playing */}
        {playing && (
          <div className="flex justify-center mt-2">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 min-h-[44px]"
            >
              <RotateCcw className="w-5 h-5" />
              {t('重新开始', 'Restart')}
            </button>
          </div>
        )}

        {/* Game Over */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-2xl text-center"
            >
              <p className="text-2xl mb-2">{t('时间到！', "Time's up!")}</p>
              <p className="text-4xl font-black text-purple-600 mb-2">{score}</p>
              <p className="text-sm text-purple-500 mb-1">{t('得分', 'Score')}</p>
              {score === bestScore && score > 0 && (
                <p className="text-sm text-yellow-500 mb-2">🏆 {t('新纪录！', 'New Record!')}</p>
              )}
              <p className="text-xs text-secondary mb-4">
                {t('最佳', 'Best')}: {bestScore}
              </p>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors min-h-[44px]"
              >
                {t('再来一局', 'Play Again')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
