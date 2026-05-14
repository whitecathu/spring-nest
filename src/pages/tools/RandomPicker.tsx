import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Check, Trash2, Sparkles } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const SAMPLE_DATA = ['吃火锅', '吃烧烤', '吃面条', '喝奶茶', '吃沙拉'];

export default function RandomPicker({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spinDisplay, setSpinDisplay] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSpinInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const getRandomItem = useCallback((items: string[]): string => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return items[array[0] % items.length];
  }, []);

  const handlePick = useCallback(() => {
    const lines = input
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setResult(null);
    setSpinning(true);
    clearSpinInterval();

    let count = 0;
    const totalSpins = 15;
    const interval = setInterval(() => {
      setSpinDisplay(getRandomItem(lines));
      count++;
      if (count >= totalSpins) {
        clearInterval(interval);
        intervalRef.current = null;
        setSpinning(false);
        const picked = getRandomItem(lines);
        setResult(picked);
        setSpinDisplay('');
      }
    }, 80);
    intervalRef.current = interval;
  }, [input, getRandomItem, clearSpinInterval]);

  const handleClear = useCallback(() => {
    clearSpinInterval();
    setInput('');
    setResult(null);
    setSpinning(false);
    setSpinDisplay('');
  }, [clearSpinInterval]);

  const handleSample = useCallback(() => {
    clearSpinInterval();
    setInput(SAMPLE_DATA.join('\n'));
    setResult(null);
    setSpinning(false);
    setSpinDisplay('');
  }, [clearSpinInterval]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const lines = input
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">
          {t('抽签工具', 'Random Picker')}
        </h2>

        {/* Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-on-surface">
              {t('输入选项（每行一个）', 'Enter options (one per line)')}
            </label>
            <span className="text-xs text-secondary">
              {lines.length} {t('项', 'items')}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('例如：\n吃火锅\n吃烧烤\n吃面条', 'e.g.\nHot pot\nBBQ\nNoodles')}
            rows={6}
            className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface placeholder-secondary/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm leading-relaxed"
          />
        </div>

        {/* Quick Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleSample}
            className="flex-1 py-2.5 rounded-xl bg-primary-container/50 text-primary font-semibold text-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {t('示例', 'Example')}
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-secondary font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {t('清空', 'Clear')}
          </button>
        </div>

        {/* Pick Button */}
        <button
          onClick={handlePick}
          disabled={lines.length === 0 || spinning}
          className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg mb-6"
        >
          {spinning ? t('抽取中...', 'Picking...') : t('随机选择', 'Pick Random')}
        </button>

        {/* Result */}
        <AnimatePresence mode="wait">
          {(result || spinDisplay) && (
            <motion.div
              key={spinDisplay || result || ''}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-container-low rounded-2xl p-6 text-center"
            >
              <div className="text-xs text-secondary font-medium mb-2">
                {spinning ? t('抽取中...', 'Picking...') : t('结果', 'Result')}
              </div>
              <div
                className={`text-3xl font-bold mb-4 ${spinning ? 'text-secondary animate-pulse' : 'text-primary'}`}
              >
                {spinDisplay || result}
              </div>
              {result && !spinning && (
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 mx-auto ${
                    copied
                      ? 'bg-green-100 text-green-600'
                      : 'bg-white text-secondary hover:text-primary hover:bg-primary-container/20'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('已复制!', 'Copied!') : t('复制结果', 'Copy Result')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
