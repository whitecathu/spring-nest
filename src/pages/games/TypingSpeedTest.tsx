import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Zap, Clock } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy, springSmooth } from '../../lib/animations';

const WORD_POOLS = {
  easy: [
    'the',
    'is',
    'at',
    'on',
    'in',
    'to',
    'it',
    'he',
    'we',
    'do',
    'go',
    'no',
    'so',
    'up',
    'if',
    'an',
    'as',
    'or',
    'be',
    'by',
  ],
  medium: [
    'about',
    'after',
    'again',
    'before',
    'between',
    'could',
    'every',
    'first',
    'found',
    'great',
    'house',
    'large',
    'learn',
    'never',
    'other',
    'place',
    'plant',
    'point',
    'right',
    'small',
  ],
  hard: [
    'accomplish',
    'background',
    'calculate',
    'demonstrate',
    'elaborate',
    'fascinating',
    'generation',
    'hypothesis',
    'illustrate',
    'juxtapose',
    'knowledge',
    'laboratory',
    'magnificent',
    'negotiate',
    'opportunity',
    'perspective',
    'revolution',
    'significant',
    'technology',
    'understand',
  ],
};

type Mode = 'time30' | 'time60' | 'words25' | 'words50';

const MODES: Record<Mode, { label: [string, string]; desc: [string, string] }> = {
  time30: { label: ['30 秒', '30s'], desc: ['限时 30 秒', '30 second limit'] },
  time60: { label: ['60 秒', '60s'], desc: ['限时 60 秒', '60 second limit'] },
  words25: { label: ['25 词', '25 Words'], desc: ['打完 25 个词', 'Type 25 words'] },
  words50: { label: ['50 词', '50 Words'], desc: ['打完 50 个词', 'Type 50 words'] },
};

function loadBestWPM(mode: Mode): number {
  try {
    return JSON.parse(localStorage.getItem(`spring_nest_typing_wpm_${mode}`) || '0');
  } catch {
    return 0;
  }
}

function saveBestWPM(mode: Mode, wpm: number) {
  localStorage.setItem(`spring_nest_typing_wpm_${mode}`, JSON.stringify(wpm));
}

function shuffleWords(pool: string[], count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return words;
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const statItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function TypingSpeedTest({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [mode, setMode] = useState<Mode>('time30');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [elapsed, setElapsed] = useState(0);
  const [bestWPM, setBestWPM] = useState(0);
  const [streak, setStreak] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [wordResults, setWordResults] = useState<Map<number, 'correct' | 'wrong'>>(new Map());
  const [wordFlash, setWordFlash] = useState<'correct' | 'wrong' | null>(null);
  const [streakLost, setStreakLost] = useState(false);
  const [completedWordIndex, setCompletedWordIndex] = useState<number | null>(null);
  const prevStreakRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    },
    [clearTimer],
  );

  const startGame = useCallback(() => {
    clearTimer();
    const count = mode === 'words25' ? 25 : mode === 'words50' ? 50 : 100;
    const w = shuffleWords(WORD_POOLS.medium, count);
    setWords(w);
    setCurrentIndex(0);
    setCurrentInput('');
    setCorrectCount(0);
    setWrongCount(0);
    setElapsed(0);
    setStreak(0);
    setBestWPM(loadBestWPM(mode));
    setWordResults(new Map());
    setWordFlash(null);
    setStreakLost(false);
    setCompletedWordIndex(null);
    prevStreakRef.current = 0;

    if (mode === 'time30' || mode === 'time60') {
      const limit = mode === 'time30' ? 30 : 60;
      setTimeLeft(limit);
      startTimeRef.current = Date.now();
      setGameState('playing');
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = limit - elapsed;
        setElapsed(elapsed);
        if (remaining <= 0) {
          setTimeLeft(0);
          clearTimer();
          setGameState('over');
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else {
      setTimeLeft(0);
      startTimeRef.current = Date.now();
      setGameState('playing');
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }

    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 100);
    timeoutsRef.current.push(focusTimeout);
  }, [mode, clearTimer]);

  const finishGame = useCallback(() => {
    clearTimer();
    setGameState('over');
  }, [clearTimer]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (gameState !== 'playing') return;
      const value = e.target.value;
      setCurrentInput(value);

      // Check if space was typed (word completed)
      if (value.endsWith(' ')) {
        const typed = value.trim();
        const expected = words[currentIndex];
        const isCorrect = typed === expected;

        if (isCorrect) {
          setCorrectCount((c) => c + 1);
          setStreak((s) => s + 1);
          prevStreakRef.current = prevStreakRef.current + 1;
          setWordResults((prev) => new Map(prev).set(currentIndex, 'correct'));
          setWordFlash('correct');
        } else {
          setWrongCount((w) => w + 1);
          setStreak(0);
          // Streak break animation
          if (prevStreakRef.current >= 3) {
            setStreakLost(true);
            const streakTimeout = setTimeout(() => setStreakLost(false), 1500);
            timeoutsRef.current.push(streakTimeout);
          }
          prevStreakRef.current = 0;
          setWordResults((prev) => new Map(prev).set(currentIndex, 'wrong'));
          setWordFlash('wrong');
        }
        const flashTimeout = setTimeout(() => setWordFlash(null), 300);
        timeoutsRef.current.push(flashTimeout);

        // Word completion bounce
        setCompletedWordIndex(currentIndex);
        const bounceTimeout = setTimeout(() => setCompletedWordIndex(null), 400);
        timeoutsRef.current.push(bounceTimeout);

        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentInput('');

        if ((mode === 'words25' && nextIndex >= 25) || (mode === 'words50' && nextIndex >= 50)) {
          const finishTimeout = setTimeout(() => finishGame(), 50);
          timeoutsRef.current.push(finishTimeout);
        }
      }
    },
    [gameState, words, currentIndex, mode, finishGame],
  );

  const currentWord = words[currentIndex] || '';
  const isCorrect = currentInput.length > 0 && currentWord.startsWith(currentInput);
  const isWrong = currentInput.length > 0 && !currentWord.startsWith(currentInput);

  const liveWpm =
    gameState === 'playing' && elapsed > 0 ? Math.round(correctCount / (elapsed / 60)) : 0;

  const totalTyped = correctCount + wrongCount;
  const accuracy = totalTyped > 0 ? Math.round((correctCount / totalTyped) * 100) : 0;
  const wpm = elapsed > 0 ? Math.round(correctCount / (elapsed / 60)) : 0;

  useEffect(() => {
    if (gameState === 'over' && wpm > 0) {
      const best = loadBestWPM(mode);
      if (wpm > best) {
        saveBestWPM(mode, wpm);
        setBestWPM(wpm);
      }
    }
  }, [gameState, wpm, mode]);

  const displayWords = useMemo(() => words.slice(0, Math.min(words.length, 60)), [words]);

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('打字测速', 'Typing Speed')}</h1>
            <p className="text-sm text-secondary">
              {t('测试你的打字速度！', 'Test your typing speed!')}
            </p>
          </div>
          <div className="flex gap-2">
            {(mode === 'time30' || mode === 'time60') && (
              <div className="bg-surface-container-high rounded-xl px-3 py-2 text-center">
                <div className="text-xs text-secondary font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t('剩余', 'Left')}
                </div>
                <motion.div
                  key={timeLeft}
                  animate={timeLeft <= 5 ? { scale: [1, 1.15, 1] } : {}}
                  className={`text-xl font-bold tabular-nums ${timeLeft <= 5 ? 'text-red-500' : 'text-primary'}`}
                >
                  {timeLeft}s
                </motion.div>
              </div>
            )}
            {/* Live WPM during gameplay */}
            {gameState === 'playing' && (
              <div className="bg-surface-container-high rounded-xl px-3 py-2 text-center">
                <div className="text-xs text-secondary font-medium">{t('WPM', 'WPM')}</div>
                <motion.div
                  key={liveWpm}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={springSmooth}
                  className="text-xl font-bold text-primary tabular-nums"
                >
                  {liveWpm}
                </motion.div>
              </div>
            )}
            {bestWPM > 0 && (
              <div className="bg-surface-container-high rounded-xl px-3 py-2 text-center">
                <div className="text-xs text-secondary font-medium flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {t('最佳', 'Best')}
                </div>
                <div className="text-xl font-bold text-tertiary tabular-nums">{bestWPM}</div>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        {gameState === 'idle' && (
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <motion.button
                key={m}
                onClick={() => setMode(m)}
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.05 }}
                animate={mode === m ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={springBouncy}
                className={`px-4 py-2 rounded-full font-semibold text-sm min-h-[48px] transition-all ${
                  mode === m
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
                }`}
              >
                {t(...MODES[m].label)}
              </motion.button>
            ))}
          </div>
        )}

        {/* Word Display */}
        {gameState !== 'idle' && (
          <div className="mb-6">
            <div className="relative bg-surface-container rounded-2xl p-6 min-h-[120px] flex flex-wrap gap-x-2 gap-y-1 items-start content-start">
              {/* Word flash overlay */}
              <AnimatePresence>
                {wordFlash && (
                  <motion.div
                    className={`absolute inset-0 rounded-2xl pointer-events-none z-10 ${
                      wordFlash === 'correct' ? 'bg-green-400/15' : 'bg-red-400/15'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>
              {displayWords.map((word, i) => {
                const result = i < currentIndex ? wordResults.get(i) : undefined;
                let wordClass = 'text-on-surface-variant';
                if (i < currentIndex) {
                  wordClass =
                    result === 'wrong'
                      ? 'text-red-500 opacity-60 line-through'
                      : 'text-green-500 opacity-60';
                }

                // Current word: character-by-character highlighting
                if (i === currentIndex) {
                  return (
                    <span key={i} className="font-bold text-lg relative">
                      {word.split('').map((char, ci) => {
                        const isTyped = ci < currentInput.length;
                        const isCorrectChar = isTyped && currentInput[ci] === char;
                        const isWrongChar = isTyped && currentInput[ci] !== char;
                        const isLatest = ci === currentInput.length - 1;
                        let charClass = 'text-on-surface';
                        if (isCorrectChar) charClass = 'text-green-500';
                        if (isWrongChar) charClass = 'text-red-500';
                        return (
                          <motion.span
                            key={ci}
                            className={charClass}
                            initial={isLatest ? { scale: 1.3 } : false}
                            animate={
                              isLatest && isWrongChar
                                ? { scale: 1, x: [0, -2, 2, -2, 0] }
                                : { scale: 1 }
                            }
                            transition={
                              isLatest && isWrongChar
                                ? { duration: 0.3 }
                                : { duration: 0.15, type: 'spring', stiffness: 500, damping: 20 }
                            }
                          >
                            {char}
                          </motion.span>
                        );
                      })}
                      {/* Extra characters typed beyond word length */}
                      {currentInput.length > word.length && (
                        <span className="text-red-500 bg-red-100 dark:bg-red-900/30 rounded px-0.5">
                          {currentInput.slice(word.length)}
                        </span>
                      )}
                      <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
                    </span>
                  );
                }

                return (
                  <motion.span
                    key={i}
                    className={wordClass}
                    initial={completedWordIndex === i ? { scale: 1.15 } : false}
                    animate={{ scale: 1 }}
                    transition={completedWordIndex === i ? springBouncy : { duration: 0.15 }}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={handleInput}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className={`flex-1 px-4 py-3 rounded-xl text-lg font-mono outline-none transition-all min-h-[48px] ${
                  isWrong
                    ? 'bg-red-50 border-2 border-red-300 text-red-700'
                    : isCorrect
                      ? 'bg-green-50 border-2 border-green-300 text-green-700'
                      : 'bg-surface-container-high border-2 border-transparent text-on-surface focus:border-primary'
                }`}
                placeholder={t('输入当前单词...', 'Type the current word...')}
              />
            </div>

            {/* Streak indicator with exit animation */}
            <AnimatePresence>
              {streak >= 3 && !streakLost && (
                <motion.div
                  key="streak"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={springBouncy}
                  className="flex items-center gap-1 mt-2 justify-center"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-500">
                    {streak}x {t('连击', 'Streak')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Streak break animation */}
            <AnimatePresence>
              {streakLost && (
                <motion.div
                  key="streak-lost"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={springBouncy}
                  className="flex items-center justify-center gap-1 mt-2"
                >
                  <span className="text-sm font-bold text-red-500">
                    💥 {t('连击中断！', 'Streak Lost!')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Stats during play */}
        {gameState === 'playing' && (
          <div className="flex justify-center gap-4 text-sm text-secondary">
            <span>
              {t('正确', 'Correct')}: <strong className="text-green-500">{correctCount}</strong>
            </span>
            <span>
              {t('错误', 'Wrong')}: <strong className="text-red-500">{wrongCount}</strong>
            </span>
            <span>
              {t('进度', 'Progress')}:{' '}
              <strong>
                {currentIndex}/{words.length}
              </strong>
            </span>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'over' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSmooth}
            className="bg-surface-container rounded-2xl p-6 text-center"
          >
            <p className="text-4xl mb-2">⌨️</p>
            <p className="text-2xl font-bold text-on-surface mb-4">
              {t('测试完成！', 'Test Complete!')}
            </p>
            <motion.div
              className="grid grid-cols-3 gap-4 mb-4"
              initial="initial"
              animate="animate"
              transition={{ staggerChildren: 0.15 }}
            >
              <motion.div variants={statItemVariants} transition={springSmooth}>
                <p className="text-3xl font-black text-primary">{wpm}</p>
                <p className="text-xs text-secondary">{t('WPM', 'WPM')}</p>
              </motion.div>
              <motion.div variants={statItemVariants} transition={springSmooth}>
                <p className="text-3xl font-black text-green-500">{accuracy}%</p>
                <p className="text-xs text-secondary">{t('准确率', 'Accuracy')}</p>
              </motion.div>
              <motion.div variants={statItemVariants} transition={springSmooth}>
                <p className="text-3xl font-black text-blue-500">{formatElapsed(elapsed)}</p>
                <p className="text-xs text-secondary">{t('用时', 'Time')}</p>
              </motion.div>
            </motion.div>
            {wpm > 0 && wpm >= bestWPM && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, ...springBouncy }}
                className="text-sm text-green-500 font-bold mb-2"
              >
                🏆 {t('新纪录！', 'New Record!')}
              </motion.p>
            )}
            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              transition={springBouncy}
              className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold min-h-[48px]"
            >
              {t('再来一次', 'Try Again')}
            </motion.button>
          </motion.div>
        )}

        {/* Start */}
        {gameState === 'idle' && (
          <div className="flex justify-center">
            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              transition={springBouncy}
              className="px-8 py-3 bg-primary text-on-primary rounded-full font-semibold flex items-center gap-2 min-h-[48px]"
            >
              {t('开始测速', 'Start Test')}
            </motion.button>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('输入单词后按空格确认', 'Type the word and press space to confirm')}
        </div>
      </motion.div>
    </div>
  );
}
