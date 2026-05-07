import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Dice6, Copy, Check, History } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy } from '../../lib/animations';

export default function RandomNumber({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [results, setResults] = useState<number[]>([]);
  const [history, setHistory] = useState<number[][]>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(() => {
    const minVal = parseInt(min) || 0;
    const maxVal = parseInt(max) || 100;
    const countVal = Math.min(100, Math.max(1, parseInt(count) || 1));

    if (minVal > maxVal) return;

    setIsGenerating(true);
    setResults([]);

    // Animate generation
    const newResults: number[] = [];
    for (let i = 0; i < countVal; i++) {
      newResults.push(Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal);
    }

    // Stagger reveal
    let revealed = 0;
    const interval = setInterval(() => {
      revealed++;
      setResults(newResults.slice(0, revealed));
      if (revealed >= countVal) {
        clearInterval(interval);
        setIsGenerating(false);
        setHistory(prev => [newResults, ...prev].slice(0, 10));
      }
    }, Math.max(30, 300 / countVal));
  }, [min, max, count]);

  const handleCopy = useCallback(async () => {
    if (results.length === 0) return;
    try {
      await navigator.clipboard.writeText(results.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [results]);

  const quickPresets = [
    { label: '1-10', min: '1', max: '10' },
    { label: '1-100', min: '1', max: '100' },
    { label: '1-1000', min: '1', max: '1000' },
    { label: '🎲 ' + t('骰子', 'Dice'), min: '1', max: '6' },
  ];

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <Dice6 className="w-8 h-8 text-primary" />
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
              whileTap={{ scale: 0.93 }}
              className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface font-semibold text-sm min-h-[44px]"
            >
              {p.label}
            </motion.button>
          ))}
        </div>

        {/* Range Input */}
        <div className="bg-surface-container rounded-2xl p-5 mb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-secondary mb-1 block">{t('最小值', 'Min')}</label>
              <input
                type="number"
                value={min}
                onChange={e => setMin(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface text-center font-bold text-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary mb-1 block">{t('最大值', 'Max')}</label>
              <input
                type="number"
                value={max}
                onChange={e => setMax(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface text-center font-bold text-lg"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">{t('生成个数', 'Count')}</label>
            <input
              type="number"
              value={count}
              onChange={e => setCount(e.target.value)}
              min="1"
              max="100"
              className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface text-center font-bold"
            />
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          onClick={generate}
          disabled={isGenerating || parseInt(min) > parseInt(max)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={springBouncy}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-50"
        >
          <Dice6 className="w-6 h-6" />
          {t('生成随机数', 'Generate')}
        </motion.button>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-gradient-to-br from-primary-container/30 to-primary/5 rounded-2xl p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-secondary">{t('结果', 'Results')}</span>
                <motion.button
                  onClick={handleCopy}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold min-h-[36px]"
                >
                  {copied ? <><Check className="w-3 h-3" /> {t('已复制', 'Copied')}</> : <><Copy className="w-3 h-3" /> {t('复制', 'Copy')}</>}
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.map((num, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={springBouncy}
                    className="inline-block px-4 py-2 bg-white dark:bg-surface-container-high rounded-xl font-bold text-lg text-primary shadow-sm"
                  >
                    {num}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-secondary mb-2 flex items-center gap-1">
              <History className="w-3 h-3" />
              {t('历史记录', 'History')}
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-auto">
              {history.map((h, i) => (
                <div key={i} className="text-xs text-secondary bg-surface-container rounded-lg px-3 py-1.5">
                  {h.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('设置范围和数量，点击生成随机数', 'Set range and count, click to generate')}
        </div>
      </motion.div>
    </div>
  );
}
