import { useState, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Copy, Check, Trash2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface Stats {
  totalChars: number;
  charsNoSpace: number;
  chineseChars: number;
  englishWords: number;
  lines: number;
  paragraphs: number;
}

function computeStats(text: string): Stats {
  const totalChars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const chineseChars = (text.match(/[一-鿿]/g) || []).length;
  const englishWords = text
    .replace(/[一-鿿]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w)).length;
  const lines = text === '' ? 0 : text.split('\n').length;
  const paragraphs = text.split('\n').filter((l) => l.trim().length > 0).length;
  return { totalChars, charsNoSpace, chineseChars, englishWords, lines, paragraphs };
}

export default function WordCounter({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => computeStats(text), [text]);

  const handleClear = useCallback(() => {
    setText('');
  }, []);

  const handleCopy = useCallback(async () => {
    const result = [
      `${t('总字符数', 'Total characters')}: ${stats.totalChars}`,
      `${t('字符数（不含空格）', 'Characters (no space)')}: ${stats.charsNoSpace}`,
      `${t('中文字符数', 'Chinese characters')}: ${stats.chineseChars}`,
      `${t('英文单词数', 'English words')}: ${stats.englishWords}`,
      `${t('行数', 'Lines')}: ${stats.lines}`,
      `${t('段落数', 'Paragraphs')}: ${stats.paragraphs}`,
    ].join('\n');

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
  }, [stats, t]);

  const statItems = [
    { label: t('总字符数', 'Total characters'), value: stats.totalChars },
    { label: t('字符数（不含空格）', 'Characters (no space)'), value: stats.charsNoSpace },
    { label: t('中文字符数', 'Chinese characters'), value: stats.chineseChars },
    { label: t('英文单词数', 'English words'), value: stats.englishWords },
    { label: t('行数', 'Lines'), value: stats.lines },
    { label: t('段落数', 'Paragraphs'), value: stats.paragraphs },
  ];

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30">
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">
          {t('字数统计', 'Word Counter')}
        </h2>

        {/* Textarea */}
        <div className="mb-4">
          <textarea
            aria-label={t('待统计文本', 'Text to count')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('在此输入或粘贴文本...', 'Type or paste text here...')}
            rows={8}
            className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface placeholder-secondary/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm leading-relaxed"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {statItems.map((item, i) => (
            <div key={i} className="bg-surface-container-low rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-primary">{item.value}</div>
              <div className="text-xs text-secondary font-medium mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              copied
                ? 'bg-green-100 text-green-600'
                : 'bg-primary-container/50 text-primary hover:bg-primary-container'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('已复制!', 'Copied!') : t('复制统计结果', 'Copy Stats')}
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-secondary font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {t('清空', 'Clear')}
          </button>
        </div>
      </div>
    </div>
  );
}
