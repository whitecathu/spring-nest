import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Check, Type, X } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy, springSmooth, springSnappy, toolPageEnter } from '../../lib/animations';

type CaseType = 'upper' | 'lower' | 'title' | 'sentence' | 'toggle' | 'reverse';

const CASES: { id: CaseType; label: [string, string]; desc: [string, string] }[] = [
  {
    id: 'upper',
    label: ['全部大写', 'UPPERCASE'],
    desc: ['所有字母转大写', 'ALL LETTERS TO UPPER'],
  },
  {
    id: 'lower',
    label: ['全部小写', 'lowercase'],
    desc: ['所有字母转小写', 'all letters to lower'],
  },
  {
    id: 'title',
    label: ['首字母大写', 'Title Case'],
    desc: ['每个单词首字母大写', 'Capitalize Each Word'],
  },
  {
    id: 'sentence',
    label: ['句首大写', 'Sentence case'],
    desc: ['每句开头首字母大写', 'Capitalize first letter of sentences'],
  },
  {
    id: 'toggle',
    label: ['大小写反转', 'tOGGLE cASE'],
    desc: ['反转每个字母的大小写', 'Toggle every letter case'],
  },
  { id: 'reverse', label: ['文本反转', 'Reverse'], desc: ['反转文本顺序', 'Reverse text order'] },
];

function convertCase(text: string, type: CaseType): string {
  switch (type) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    case 'sentence':
      return text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
    case 'toggle':
      return text
        .split('')
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    case 'reverse':
      return text.split('').reverse().join('');
    default:
      return text;
  }
}

export default function CaseConverter({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [input, setInput] = useState('');
  const [activeCase, setActiveCase] = useState<CaseType>('upper');
  const [copied, setCopied] = useState(false);
  const [shaking, setShaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(shakeTimeoutRef.current);
      clearTimeout(copiedTimeoutRef.current);
    },
    [],
  );

  const handleCaseSwitch = useCallback(
    (id: CaseType) => {
      if (!input.trim()) {
        setShaking(true);
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = setTimeout(() => setShaking(false), 500);
        textareaRef.current?.focus();
        return;
      }
      setActiveCase(id);
    },
    [input],
  );

  const output = useMemo(() => convertCase(input, activeCase), [input, activeCase]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const startCopiedTimer = () => {
      setCopied(true);
      clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    };
    try {
      await navigator.clipboard.writeText(output);
      startCopiedTimer();
    } catch {
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      startCopiedTimer();
    }
  }, [output]);

  const charCount = input.length;
  const wordCount = useMemo(() => (input.trim() ? input.trim().split(/\s+/).length : 0), [input]);
  const lineCount = useMemo(() => (input ? input.split('\n').length : 0), [input]);

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div {...toolPageEnter}>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <Type className="w-8 h-8 text-primary" />
            {t('大小写转换', 'Case Converter')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('快速转换文本大小写格式', 'Quickly convert text case formats')}
          </p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-secondary">
              {t('输入文本', 'Input Text')}
            </label>
            <span className="text-xs text-secondary">
              <motion.span
                key={charCount}
                initial={{ scale: 1.3, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springBouncy}
                className="inline-block"
              >
                {charCount}
              </motion.span>{' '}
              {t('字符', 'chars')} · {wordCount} {t('词', 'words')} · {lineCount} {t('行', 'lines')}
            </span>
          </div>
          <motion.div
            animate={shaking ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <textarea
              ref={textareaRef}
              spellCheck="false"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('在此输入或粘贴文本...', 'Type or paste text here...')}
              className="w-full h-40 px-4 py-3 bg-surface-container rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface resize-none"
            />
            <AnimatePresence>
              {input && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springSnappy}
                  onClick={() => setInput('')}
                  className="absolute top-3 right-3 min-w-[48px] min-h-[48px] rounded-full bg-surface-container-high text-secondary flex items-center justify-center hover:text-on-surface transition-colors"
                  aria-label={t('清除输入', 'Clear input')}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Case Buttons with sliding layoutId highlight */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CASES.map((c) => (
            <motion.button
              key={c.id}
              onClick={() => handleCaseSwitch(c.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              transition={springSnappy}
              className={`relative px-4 py-2 rounded-full font-semibold text-sm min-h-[48px] ${
                activeCase === c.id ? 'text-on-primary' : 'text-on-surface hover:bg-surface-variant'
              }`}
            >
              {activeCase === c.id && (
                <motion.div
                  layoutId="case-active-bg"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{ ...springBouncy, damping: 12, stiffness: 350, mass: 0.8 }}
                />
              )}
              <span className="relative z-10">{t(...c.label)}</span>
            </motion.button>
          ))}
        </div>

        {/* Output with AnimatePresence */}
        <AnimatePresence mode="wait">
          {input ? (
            <motion.div
              key={`output-${activeCase}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
              transition={springSmooth}
              className="mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-secondary">
                  {t('转换结果', 'Result')}
                </label>
                <motion.button
                  onClick={handleCopy}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold min-h-[48px]"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.4, times: [0, 0.6, 1] }}
                        className="flex items-center gap-1 text-green-600 dark:text-green-400"
                      >
                        <Check className="w-3 h-3" /> {t('已复制', 'Copied')}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springBouncy}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> {t('复制', 'Copy')}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
              <div className="relative">
                <motion.div
                  key={output}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={springBouncy}
                  className="w-full h-40 px-4 py-3 bg-surface-container-low rounded-xl text-on-surface overflow-auto whitespace-pre-wrap"
                >
                  {output}
                </motion.div>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-container-low to-transparent rounded-b-xl pointer-events-none" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-output"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 bg-surface-container rounded-2xl p-8 text-center"
            >
              <Type className="w-10 h-10 text-secondary/30 mx-auto mb-2" />
              <p className="text-sm text-secondary/50">
                {t('结果将显示在此处', 'Results will appear here')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('选择转换类型，结果实时更新', 'Select a conversion type, results update in real-time')}
        </div>
      </motion.div>
    </div>
  );
}
