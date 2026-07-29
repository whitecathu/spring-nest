import { useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Delete, Divide, Equal, Minus, Plus, X } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

export default function Calculator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [currentOp, setCurrentOp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNumber = (num: string) => {
    if (shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (shouldResetDisplay) {
      setDisplay('0.');
      setShouldResetDisplay(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display);
    if (expression && !shouldResetDisplay) {
      // Chain operations
      const parts = expression.split(' ');
      const prevNum = parseFloat(parts[0]);
      const prevOp = parts[1];
      let result = prevNum;
      switch (prevOp) {
        case '+':
          result = prevNum + current;
          break;
        case '-':
          result = prevNum - current;
          break;
        case '*':
          result = prevNum * current;
          break;
        case '/':
          result = current !== 0 ? prevNum / current : NaN;
          break;
      }
      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
        setExpression('');
        setCurrentOp(null);
        setShouldResetDisplay(true);
        return;
      }
      setDisplay(formatResult(result));
      setExpression(`${formatResult(result)} ${op}`);
    } else {
      setExpression(`${display} ${op}`);
    }
    setCurrentOp(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (!expression || shouldResetDisplay) return;
    const parts = expression.split(' ');
    const prevNum = parseFloat(parts[0]);
    const op = parts[1];
    const current = parseFloat(display);
    let result = prevNum;

    switch (op) {
      case '+':
        result = prevNum + current;
        break;
      case '-':
        result = prevNum - current;
        break;
      case '*':
        result = prevNum * current;
        break;
      case '/':
        result = current !== 0 ? prevNum / current : NaN;
        break;
    }

    if (isNaN(result) || !isFinite(result)) {
      setDisplay('Error');
    } else {
      const resultStr = formatResult(result);
      const eqStr = `${parts[0]} ${op} ${current} = ${resultStr}`;
      setHistory((prev) => [eqStr, ...prev].slice(0, 10));
      setDisplay(resultStr);
    }
    setExpression('');
    setCurrentOp(null);
    setShouldResetDisplay(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setShouldResetDisplay(false);
    setCurrentOp(null);
  };

  const handleDelete = () => {
    if (shouldResetDisplay) return;
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const formatResult = (n: number): string => {
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(10)).toString();
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = display;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [display]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;

      if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleNumber(key);
      } else if (key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        e.preventDefault();
        handleOperator(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (key === 'Escape' || key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleDecimal, handleOperator, handleEquals, handleDelete, handleClear]);

  const opActive = (op: string) => currentOp === op;

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        {/* Display */}
        <div className="bg-surface-container-low rounded-2xl p-4 mb-6 min-h-[80px] flex flex-col justify-end items-end relative">
          <button
            onClick={handleCopy}
            aria-label={t('复制', 'Copy')}
            className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-lg bg-primary-container/50 text-primary hover:bg-primary-container transition-colors"
          >
            {copied ? t('已复制!', 'Copied!') : t('复制', 'Copy')}
          </button>
          <div className="text-secondary/50 text-sm font-mono truncate w-full text-right">
            {expression}
          </div>
          <div
            key={display}
            className="text-on-surface text-4xl font-bold tracking-tight truncate w-full text-right mt-1"
          >
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <button
            aria-label={t('清除', 'Clear')}
            onClick={handleClear}
            className="col-span-2 py-4 rounded-xl bg-red-50 text-red-500 font-bold text-lg hover:bg-red-100 transition-colors"
          >
            AC
          </button>
          <button
            aria-label={t('删除上一位', 'Delete previous digit')}
            onClick={handleDelete}
            className="py-4 rounded-xl bg-surface-container-high text-secondary font-bold text-lg hover:bg-surface-variant transition-colors flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            aria-label={t('除以', 'Divide')}
            onClick={() => handleOperator('/')}
            className={`py-4 rounded-xl font-bold text-lg transition-colors ${opActive('/') ? 'bg-primary text-on-primary' : 'bg-primary-container/50 text-primary hover:bg-primary-container'}`}
          >
            <Divide className="w-5 h-5 mx-auto" />
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumber('7')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            7
          </button>
          <button
            onClick={() => handleNumber('8')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            8
          </button>
          <button
            onClick={() => handleNumber('9')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            9
          </button>
          <button
            aria-label={t('乘以', 'Multiply')}
            onClick={() => handleOperator('*')}
            className={`py-4 rounded-xl font-bold text-lg transition-colors ${opActive('*') ? 'bg-primary text-on-primary' : 'bg-primary-container/50 text-primary hover:bg-primary-container'}`}
          >
            <X className="w-5 h-5 mx-auto" />
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumber('4')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            4
          </button>
          <button
            onClick={() => handleNumber('5')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            5
          </button>
          <button
            onClick={() => handleNumber('6')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            6
          </button>
          <button
            aria-label={t('减去', 'Subtract')}
            onClick={() => handleOperator('-')}
            className={`py-4 rounded-xl font-bold text-lg transition-colors ${opActive('-') ? 'bg-primary text-on-primary' : 'bg-primary-container/50 text-primary hover:bg-primary-container'}`}
          >
            <Minus className="w-5 h-5 mx-auto" />
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleNumber('1')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            1
          </button>
          <button
            onClick={() => handleNumber('2')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            2
          </button>
          <button
            onClick={() => handleNumber('3')}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            3
          </button>
          <button
            aria-label={t('加上', 'Add')}
            onClick={() => handleOperator('+')}
            className={`py-4 rounded-xl font-bold text-lg transition-colors ${opActive('+') ? 'bg-primary text-on-primary' : 'bg-primary-container/50 text-primary hover:bg-primary-container'}`}
          >
            <Plus className="w-5 h-5 mx-auto" />
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleNumber('0')}
            className="col-span-2 py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="py-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xl hover:bg-surface-container transition-colors border border-surface-variant/20"
          >
            .
          </button>
          <button
            aria-label={t('计算结果', 'Calculate result')}
            onClick={handleEquals}
            className="py-4 rounded-xl bg-primary text-on-primary font-bold text-lg hover:bg-primary/90 transition-colors"
          >
            <Equal className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div
          className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-surface-variant/20"
        >
          <h3 className="text-sm font-bold text-secondary mb-3">{t('计算历史', 'History')}</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div
                key={i}
                className="text-sm text-on-surface-variant font-mono p-2 bg-surface-container-low rounded-lg"
              >
                {h}
              </div>
            ))}
          </div>
          <button
            onClick={() => setHistory([])}
            className="mt-3 text-xs text-secondary hover:text-primary transition-colors"
          >
            {t('清除历史', 'Clear History')}
          </button>
        </div>
      )}
    </div>
  );
}
