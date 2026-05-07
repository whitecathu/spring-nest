import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Check, Type } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy } from '../../lib/animations';

type CaseType = 'upper' | 'lower' | 'title' | 'sentence' | 'toggle' | 'reverse';

const CASES: { id: CaseType; label: [string, string]; desc: [string, string] }[] = [
  { id: 'upper', label: ['全部大写', 'UPPERCASE'], desc: ['所有字母转大写', 'ALL LETTERS TO UPPER'] },
  { id: 'lower', label: ['全部小写', 'lowercase'], desc: ['所有字母转小写', 'all letters to lower'] },
  { id: 'title', label: ['首字母大写', 'Title Case'], desc: ['每个单词首字母大写', 'Capitalize Each Word'] },
  { id: 'sentence', label: ['句首大写', 'Sentence case'], desc: ['每句开头首字母大写', 'Capitalize first letter of sentences'] },
  { id: 'toggle', label: ['大小写反转', 'tOGGLE cASE'], desc: ['反转每个字母的大小写', 'Toggle every letter case'] },
  { id: 'reverse', label: ['文本反转', 'Reverse'], desc: ['反转文本顺序', 'Reverse text order'] },
];

function convertCase(text: string, type: CaseType): string {
  switch (type) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'title': return text.replace(/\b\w/g, c => c.toUpperCase());
    case 'sentence': return text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
    case 'toggle': return text.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
    case 'reverse': return text.split('').reverse().join('');
    default: return text;
  }
}

export default function CaseConverter({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [input, setInput] = useState('');
  const [activeCase, setActiveCase] = useState<CaseType>('upper');
  const [copied, setCopied] = useState(false);

  const output = convertCase(input, activeCase);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const charCount = input.length;
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const lineCount = input ? input.split('\n').length : 0;

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <Type className="w-8 h-8 text-primary" />
            {t('大小写转换', 'Case Converter')}
          </h1>
          <p className="text-sm text-secondary mt-1">{t('快速转换文本大小写格式', 'Quickly convert text case formats')}</p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-secondary">{t('输入文本', 'Input Text')}</label>
            <span className="text-xs text-secondary">{charCount} {t('字符', 'chars')} · {wordCount} {t('词', 'words')} · {lineCount} {t('行', 'lines')}</span>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('在此输入或粘贴文本...', 'Type or paste text here...')}
            className="w-full h-40 px-4 py-3 bg-surface-container rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface resize-none"
          />
        </div>

        {/* Case Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CASES.map(c => (
            <motion.button
              key={c.id}
              onClick={() => setActiveCase(c.id)}
              whileTap={{ scale: 0.93 }}
              className={`px-4 py-2 rounded-full font-semibold text-sm min-h-[44px] transition-all ${
                activeCase === c.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
              }`}
            >
              {t(...c.label)}
            </motion.button>
          ))}
        </div>

        {/* Output */}
        {input && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-secondary">{t('转换结果', 'Result')}</label>
              <motion.button
                onClick={handleCopy}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold min-h-[36px]"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t('已复制', 'Copied')}
                    </motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                      <Copy className="w-3 h-3" /> {t('复制', 'Copy')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
            <div className="w-full h-40 px-4 py-3 bg-surface-container-low rounded-xl text-on-surface overflow-auto whitespace-pre-wrap">
              {output}
            </div>
          </motion.div>
        )}

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t('选择转换类型，结果实时更新', 'Select a conversion type, results update in real-time')}
        </div>
      </motion.div>
    </div>
  );
}
