import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Clock, Zap, Target } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const CHINESE_PHRASES = [
  '春暖花开',
  '风和日丽',
  '万象更新',
  '心想事成',
  '前程似锦',
  '鹏程万里',
  '一帆风顺',
  '蒸蒸日上',
  '花好月圆',
  '龙马精神',
];

const ENGLISH_PHRASES = [
  'The quick brown fox',
  'Spring is in the air',
  'Every moment matters',
  'Keep calm and carry on',
  'Time flies when you are having fun',
  'Actions speak louder than words',
  'The early bird catches the worm',
  'Knowledge is power',
  'Practice makes perfect',
  'Where there is a will there is a way',
];

interface Attempt {
  phrase: string;
  time: number;
  accuracy: number;
  wpm: number;
  mode: 'zh' | 'en';
  timestamp: number;
}

function getRandomPhrase(phrases: string[], exclude?: string): string {
  const filtered = exclude ? phrases.filter((p) => p !== exclude) : phrases;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function TypingChallenge({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [mode, setMode] = useState<'zh' | 'en'>('zh');
  const [targetPhrase, setTargetPhrase] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [history, setHistory] = useState<Attempt[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(0);
  const startedRef = useRef(false);
  const isComposingRef = useRef(false);

  const phrases = mode === 'zh' ? CHINESE_PHRASES : ENGLISH_PHRASES;

  const resetState = useCallback(() => {
    setInputValue('');
    setStarted(false);
    setFinished(false);
    setElapsedTime(0);
    setFinalElapsed(0);
    startTimeRef.current = 0;
    startedRef.current = false;
  }, []);

  const startNewPhrase = useCallback(() => {
    setTargetPhrase(getRandomPhrase(phrases));
    resetState();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [resetState, phrases]);

  useEffect(() => {
    startNewPhrase();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestart = useCallback(() => {
    setTargetPhrase(getRandomPhrase(phrases, targetPhrase));
    resetState();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [resetState, phrases, targetPhrase]);

  const handleModeChange = useCallback((newMode: 'zh' | 'en') => {
    setMode(newMode);
  }, []);

  const validateAndComplete = useCallback(
    (value: string) => {
      if (finished) return;

      // Start timer on first character
      if (!startedRef.current && value.length > 0) {
        const now = Date.now();
        startTimeRef.current = now;
        startedRef.current = true;
        setStarted(true);
        setStartTime(now);
      }

      // Check if finished (all characters typed)
      const targetChars = Array.from(targetPhrase.normalize('NFC'));
      const inputChars = Array.from(value.normalize('NFC'));
      if (inputChars.length >= targetChars.length) {
        const endTime = Date.now();
        const elapsed = startedRef.current ? endTime - startTimeRef.current : 0;

        let correct = 0;
        for (let i = 0; i < targetChars.length; i++) {
          if (inputChars[i] === targetChars[i]) correct++;
        }
        const accuracy = Math.round((correct / targetChars.length) * 100);
        const minutes = elapsed / 60000;
        const wpm =
          mode === 'zh'
            ? Math.round((targetChars.length / (elapsed / 1000)) * 60)
            : Math.round(targetChars.length / 5 / minutes);

        setFinished(true);
        setFinalElapsed(elapsed);

        setHistory((prev) => {
          const newHistory: Attempt = {
            phrase: targetPhrase,
            time: elapsed,
            accuracy,
            wpm,
            mode,
            timestamp: endTime,
          };
          return [newHistory, ...prev].slice(0, 5);
        });
      }
    },
    [finished, targetPhrase, mode],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (finished) return;

      // Always update the displayed input value so IME composition renders correctly
      setInputValue(value);

      // Skip validation during IME composition
      if (isComposingRef.current || (e.nativeEvent as InputEvent)?.isComposing) {
        return;
      }

      validateAndComplete(value);
    },
    [finished, validateAndComplete],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      const value = e.currentTarget.value;
      setInputValue(value);
      validateAndComplete(value);
    },
    [validateAndComplete],
  );

  // Timer update effect
  useEffect(() => {
    if (started && !finished) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [started, finished, startTime]);

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const characterComparison = useMemo(() => {
    const targetChars = Array.from(targetPhrase.normalize('NFC'));
    const inputChars = Array.from(inputValue.normalize('NFC'));
    return targetChars.map((char, i) => {
      const typed = inputChars[i];
      let status: 'correct' | 'wrong' | 'pending' = 'pending';
      if (typed !== undefined) {
        status = typed === char ? 'correct' : 'wrong';
      }
      return { char, typed, status };
    });
  }, [targetPhrase, inputValue]);

  const accuracy = useMemo(() => {
    const targetChars = Array.from(targetPhrase.normalize('NFC'));
    const inputChars = Array.from(inputValue.normalize('NFC'));
    if (inputChars.length === 0) return 0;
    let correct = 0;
    const len = Math.min(inputChars.length, targetChars.length);
    for (let i = 0; i < len; i++) {
      if (inputChars[i] === targetChars[i]) correct++;
    }
    return Math.round((correct / inputChars.length) * 100);
  }, [inputValue, targetPhrase]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[44px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-black text-on-surface">
            {t('打字挑战', 'Typing Challenge')}
          </h1>
          <p className="text-sm text-secondary">
            {t('快速准确地输入目标文字', 'Type the target text quickly and accurately')}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => handleModeChange('zh')}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-[44px] ${
              mode === 'zh'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface'
            }`}
          >
            {t('中文', 'Chinese')}
          </button>
          <button
            onClick={() => handleModeChange('en')}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all min-h-[44px] ${
              mode === 'en'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface'
            }`}
          >
            English
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-3 mb-4">
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('用时', 'Time')}
            </div>
            <div className="text-xl font-bold text-primary tabular-nums">
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-secondary font-medium flex items-center gap-1">
              <Target className="w-3 h-3" />
              {t('准确率', 'Accuracy')}
            </div>
            <div
              className={`text-xl font-bold tabular-nums ${accuracy >= 90 ? 'text-green-500' : accuracy >= 70 ? 'text-yellow-500' : 'text-red-500'}`}
            >
              {inputValue.length > 0 ? `${accuracy}%` : '--'}
            </div>
          </div>
        </div>

        {/* Target Phrase Display */}
        <div className="bg-surface-container-high rounded-2xl p-6 mb-4">
          <div
            className={`text-2xl sm:text-3xl font-bold leading-relaxed tracking-wider ${mode === 'zh' ? 'font-serif' : ''}`}
          >
            {characterComparison.map(({ char, status }, i) => (
              <span
                key={i}
                className={
                  status === 'correct'
                    ? 'text-green-500'
                    : status === 'wrong'
                      ? 'text-red-500 underline decoration-red-400 decoration-wavy underline-offset-4'
                      : 'text-secondary'
                }
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            disabled={finished}
            placeholder={t('在此输入，支持中文输入法...', 'Type here, IME supported...')}
            className={`w-full px-4 py-4 rounded-xl text-lg font-medium border-2 outline-none transition-colors bg-surface-container-high text-on-surface placeholder:text-secondary ${
              finished
                ? 'border-green-400'
                : inputValue.length > 0
                  ? 'border-primary'
                  : 'border-transparent focus:border-primary'
            }`}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {mode === 'zh' && !finished && (
            <p className="text-xs text-secondary mt-1.5 text-center">
              {t(
                '支持中文输入法，候选词上屏后会自动更新进度',
                'IME supported — progress updates after committing',
              )}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={startNewPhrase}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold shadow-lg hover:shadow-xl transition-all min-h-[44px]"
          >
            {t('下一句', 'Next Phrase')}
          </button>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 min-h-[44px]"
          >
            <RotateCcw className="w-5 h-5" />
            {t('重新开始', 'Restart')}
          </button>
        </div>

        {/* Completion Stats */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 bg-blue-50 border border-blue-200 rounded-2xl mb-6"
            >
              <p className="text-xl font-bold text-blue-700 mb-3 text-center">
                {t('完成！', 'Complete!')}
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-blue-500">{t('用时', 'Time')}</p>
                  <p className="text-lg font-bold text-blue-700">{formatTime(finalElapsed)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">{t('准确率', 'Accuracy')}</p>
                  <p className="text-lg font-bold text-blue-700">{accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">
                    {mode === 'zh' ? t('字/分', 'CPM') : 'WPM'}
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    {mode === 'zh'
                      ? Math.round((targetPhrase.length / (finalElapsed / 1000)) * 60)
                      : Math.round(targetPhrase.length / 5 / (finalElapsed / 60000))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-secondary mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {t('最近记录', 'Recent Attempts')}
            </h3>
            <div className="space-y-2">
              {history.map((attempt, i) => (
                <motion.div
                  key={attempt.timestamp}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-surface-container-high rounded-xl px-4 py-2 text-sm"
                >
                  <span className="text-on-surface font-medium truncate flex-1 mr-3">
                    {attempt.phrase}
                  </span>
                  <div className="flex items-center gap-3 text-secondary shrink-0">
                    <span className="tabular-nums">{formatTime(attempt.time)}</span>
                    <span
                      className={
                        attempt.accuracy >= 90
                          ? 'text-green-500'
                          : attempt.accuracy >= 70
                            ? 'text-yellow-500'
                            : 'text-red-500'
                      }
                    >
                      {attempt.accuracy}%
                    </span>
                    <span className="tabular-nums">
                      {attempt.wpm}
                      {attempt.mode === 'zh' ? t('/分', ' CPM') : ' WPM'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
