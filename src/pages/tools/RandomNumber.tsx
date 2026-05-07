import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Dice6, Copy, Check, History, Trash2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy, springSmooth, springSnappy, toolPageEnter } from '../../lib/animations';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
}

const CONFETTI_COLORS = ['#6750A4', '#625B71', '#7D5260', '#B58DAE', '#E8DEF8', '#FFD8E4'];

export default function RandomNumber({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [results, setResults] = useState<number[]>([]);
  const [history, setHistory] = useState<number[][]>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const spawnConfetti = useCallback(() => {
    const particles: ConfettiParticle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 720 - 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.3,
    }));
    setConfetti(particles);
    clearTimeout(confettiTimeoutRef.current);
    confettiTimeoutRef.current = setTimeout(() => setConfetti([]), 1500);
  }, []);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    clearTimeout(copiedTimeoutRef.current);
    clearTimeout(confettiTimeoutRef.current);
  }, []);

  const minMaxInvalid = parseInt(min) > parseInt(max);

  const isPresetActive = useCallback(
    (p: { min: string; max: string }) => min === p.min && max === p.max,
    [min, max],
  );

  const generate = useCallback(() => {
    const minVal = parseInt(min) || 0;
    const maxVal = parseInt(max) || 100;
    const countVal = Math.min(100, Math.max(1, parseInt(count) || 1));

    if (minVal > maxVal) return;

    setIsGenerating(true);
    setGeneration(g => g + 1);
    setResults([]);

    if (countVal >= 10) spawnConfetti();

    // Animate generation
    const newResults: number[] = [];
    for (let i = 0; i < countVal; i++) {
      newResults.push(Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal);
    }

    let revealed = 0;
    const interval = setInterval(() => {
      revealed++;
      setResults(newResults.slice(0, revealed));
      if (revealed >= countVal) {
        clearInterval(interval);
        intervalRef.current = null;
        setIsGenerating(false);
        setHistory(prev => [newResults, ...prev].slice(0, 10));
      }
    }, Math.max(30, 300 / countVal));
    intervalRef.current = interval;
  }, [min, max, count, spawnConfetti]);

  const handleCopy = useCallback(async () => {
    if (results.length === 0) return;
    try {
      await navigator.clipboard.writeText(results.join(', '));
      setCopied(true);
      clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [results]);

  const quickPresets = useMemo(() => [
    { label: '1-10', min: '1', max: '10' },
    { label: '1-100', min: '1', max: '100' },
    { label: '1-1000', min: '1', max: '1000' },
    { label: '🎲 ' + t('骰子', 'Dice'), min: '1', max: '6' },
  ], [t]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div {...toolPageEnter}>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <motion.span
              animate={isGenerating ? { rotate: [0, -25, 25, -15, 15, -5, 0], scale: [1, 1.2, 0.8, 1.15, 0.9, 1.05, 1] } : {}}
              transition={isGenerating ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.15 } : {}}
              className="inline-flex"
            >
              <Dice6 className="w-8 h-8 text-primary" />
            </motion.span>
            {t('随机数生成', 'Random Number')}
          </h1>
          <p className="text-sm text-secondary mt-1">{t('生成指定范围内的随机数', 'Generate random numbers in a range')}</p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickPresets.map(p => (
            <motion.button
              key={p.label}
              onClick={() => { setMin(p.min); setMax(p.max); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              transition={springSnappy}
              className={`px-4 py-2 rounded-full font-semibold text-sm min-h-[48px] transition-colors ${
                isPresetActive(p)
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
              }`}
            >
              {p.label}
            </motion.button>
          ))}
        </div>

        {/* Range Input */}
        <motion.div
          className={`bg-surface-container rounded-2xl p-5 mb-4 transition-shadow ${minMaxInvalid ? 'ring-2 ring-error/50' : ''}`}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.div
              animate={minMaxInvalid ? { x: [0, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <label className="text-xs font-semibold text-secondary mb-1 block">{t('最小值', 'Min')}</label>
              <input
                type="number"
                inputMode="numeric"
                value={min}
                onChange={e => setMin(e.target.value)}
                className={`w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none focus:ring-2 text-on-surface text-center font-bold text-lg ${minMaxInvalid ? 'focus:ring-error' : 'focus:ring-primary'}`}
              />
            </motion.div>
            <motion.div
              animate={minMaxInvalid ? { x: [0, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <label className="text-xs font-semibold text-secondary mb-1 block">{t('最大值', 'Max')}</label>
              <input
                type="number"
                inputMode="numeric"
                value={max}
                onChange={e => setMax(e.target.value)}
                className={`w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none focus:ring-2 text-on-surface text-center font-bold text-lg ${minMaxInvalid ? 'focus:ring-error' : 'focus:ring-primary'}`}
              />
            </motion.div>
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">{t('生成个数', 'Count')}</label>
            <input
              type="number"
              inputMode="numeric"
              value={count}
              onChange={e => setCount(e.target.value)}
              min="1"
              max="100"
              className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface text-center font-bold"
            />
          </div>
          <AnimatePresence>
            {minMaxInvalid && (
              <motion.p
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={springSnappy}
                className="text-xs text-error mt-2 overflow-hidden"
              >
                {t('最小值不能大于最大值', 'Min cannot be greater than max')}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Generate Button */}
        <motion.button
          onClick={generate}
          disabled={isGenerating || minMaxInvalid}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={springBouncy}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-50"
        >
          <Dice6 className="w-6 h-6" />
          {t('生成随机数', 'Generate')}
        </motion.button>

        {/* Results */}
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              transition={springSmooth}
              className="mt-4 bg-gradient-to-br from-primary-container/30 to-primary/5 rounded-2xl p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-secondary">{t('结果', 'Results')}</span>
                <motion.button
                  onClick={handleCopy}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold min-h-[48px]"
                >
                  {copied ? <><Check className="w-3 h-3" /> {t('已复制', 'Copied')}</> : <><Copy className="w-3 h-3" /> {t('复制', 'Copy')}</>}
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {results.map((num, i) => (
                    <motion.span
                      key={`${generation}-${i}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
                      transition={springBouncy}
                      className="inline-block px-4 py-2 bg-white dark:bg-surface-container-high rounded-xl font-bold text-lg text-primary shadow-sm"
                    >
                      {num}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 bg-surface-container rounded-2xl p-8 text-center"
            >
              <Dice6 className="w-10 h-10 text-secondary/30 mx-auto mb-2" />
              <p className="text-sm text-secondary/50">
                {t('点击生成随机数', 'Click to generate random numbers')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti overlay */}
        <AnimatePresence>
          {confetti.length > 0 && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {confetti.map(p => (
                <motion.div
                  key={p.id}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.color }}
                  initial={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                  animate={{ opacity: 0, y: 200, scale: 0.5, rotate: p.rotation }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* History */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={springSmooth}
              className="mt-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold text-secondary flex items-center gap-1">
                  <History className="w-3 h-3" />
                  {t('历史记录', 'History')}
                </h3>
                <motion.button
                  onClick={() => setHistory([])}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springSnappy}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-secondary hover:text-error hover:bg-error/10 transition-colors min-h-[48px]"
                >
                  <Trash2 className="w-3 h-3" />
                  {t('清除', 'Clear')}
                </motion.button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-auto">
                <AnimatePresence>
                  {history.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                      transition={{ ...springSmooth, delay: i * 0.03 }}
                      className="text-xs text-secondary bg-surface-container rounded-lg px-3 py-1.5"
                    >
                      {h.join(', ')}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('设置范围和数量，点击生成随机数', 'Set range and count, click to generate')}
        </div>
      </motion.div>
    </div>
  );
}
