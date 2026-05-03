import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check, Calendar } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Mode = 'diff' | 'offset';

const WEEKDAYS_CN = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr: string, lang: 'zh' | 'en'): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const idx = d.getDay();
  return lang === 'zh' ? `周${WEEKDAYS_CN[idx]}` : WEEKDAYS_EN[idx];
}

function diffDays(start: string, end: string): number | null {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string | null {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DateCalculator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const lang = t('zh', 'en') === 'zh' ? 'zh' as const : 'en' as const;
  const [mode, setMode] = useState<Mode>('diff');

  // Diff mode
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());

  // Offset mode
  const [offsetDate, setOffsetDate] = useState(getToday());
  const [offsetDays, setOffsetDays] = useState('30');

  const [copied, setCopied] = useState(false);

  const diffResult = diffDays(startDate, endDate);
  const offsetResult = addDays(offsetDate, parseInt(offsetDays, 10) || 0);

  const getDiffSummary = useCallback((): string => {
    if (diffResult === null) return t('请输入有效日期', 'Please enter valid dates');
    const absDays = Math.abs(diffResult);
    const weeks = Math.floor(absDays / 7);
    const remainDays = absDays % 7;
    const months = (absDays / 30.44).toFixed(1);
    const sign = diffResult >= 0 ? '' : '-';
    const parts = [
      `${sign}${absDays} ${t('天', 'days')}`,
    ];
    if (weeks > 0) parts.push(`${weeks} ${t('周', 'weeks')} ${remainDays > 0 ? `${remainDays} ${t('天', 'days')}` : ''}`.trim());
    parts.push(`≈ ${months} ${t('个月', 'months')}`);
    return parts.join('  |  ');
  }, [diffResult, t]);

  const getCopyText = useCallback((): string => {
    if (mode === 'diff') {
      if (diffResult === null) return '';
      return [
        `${t('起始', 'Start')}: ${startDate} (${getDayOfWeek(startDate, lang)})`,
        `${t('结束', 'End')}: ${endDate} (${getDayOfWeek(endDate, lang)})`,
        `${t('相差', 'Difference')}: ${diffResult} ${t('天', 'days')}`,
        getDiffSummary(),
      ].join('\n');
    } else {
      if (!offsetResult) return '';
      return [
        `${t('起始', 'Start')}: ${offsetDate} (${getDayOfWeek(offsetDate, lang)})`,
        `${t('偏移', 'Offset')}: ${parseInt(offsetDays, 10) || 0} ${t('天', 'days')}`,
        `${t('结果', 'Result')}: ${offsetResult} (${getDayOfWeek(offsetResult, lang)})`,
      ].join('\n');
    }
  }, [mode, startDate, endDate, diffResult, offsetDate, offsetDays, offsetResult, lang, t, getDiffSummary]);

  const handleCopy = useCallback(async () => {
    const text = getCopyText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getCopyText]);

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30">
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">{t('日期计算器', 'Date Calculator')}</h2>

        {/* Mode Selector */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setMode('diff')}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              mode === 'diff' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
            }`}
          >
            {t('日期差', 'Date Diff')}
          </button>
          <button
            onClick={() => setMode('offset')}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              mode === 'offset' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
            }`}
          >
            {t('日期推算', 'Date Offset')}
          </button>
        </div>

        {mode === 'diff' ? (
          <>
            {/* Start Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary mb-2">{t('起始日期', 'Start Date')}</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface text-sm outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => setStartDate(getToday())}
                  className="px-3 rounded-xl bg-surface-container-high text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t('今天', 'Today')}
                </button>
              </div>
              {startDate && (
                <span className="text-xs text-secondary/60 mt-1 block">{getDayOfWeek(startDate, lang)}</span>
              )}
            </div>

            {/* End Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary mb-2">{t('结束日期', 'End Date')}</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface text-sm outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => setEndDate(getToday())}
                  className="px-3 rounded-xl bg-surface-container-high text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t('今天', 'Today')}
                </button>
              </div>
              {endDate && (
                <span className="text-xs text-secondary/60 mt-1 block">{getDayOfWeek(endDate, lang)}</span>
              )}
            </div>

            {/* Result */}
            {diffResult !== null && (
              <div className="bg-primary-container/20 rounded-2xl p-4 mb-4">
                <div className="text-3xl font-bold text-on-surface text-center mb-2">
                  {Math.abs(diffResult)} {t('天', 'days')}
                </div>
                <div className="text-sm text-secondary text-center">
                  {getDiffSummary()}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Date Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary mb-2">{t('起始日期', 'Start Date')}</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={offsetDate}
                  onChange={(e) => setOffsetDate(e.target.value)}
                  className="flex-1 bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface text-sm outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => setOffsetDate(getToday())}
                  className="px-3 rounded-xl bg-surface-container-high text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t('今天', 'Today')}
                </button>
              </div>
              {offsetDate && (
                <span className="text-xs text-secondary/60 mt-1 block">{getDayOfWeek(offsetDate, lang)}</span>
              )}
            </div>

            {/* Days Offset */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary mb-2">{t('偏移天数', 'Days Offset')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffsetDays(String((parseInt(offsetDays, 10) || 0) - 1))}
                  className="w-12 rounded-xl bg-surface-container-high text-secondary hover:text-primary font-bold text-lg transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={offsetDays}
                  onChange={(e) => setOffsetDays(e.target.value)}
                  className="flex-1 bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface text-center text-lg font-semibold outline-none focus:border-primary/50"
                  placeholder="0"
                />
                <button
                  onClick={() => setOffsetDays(String((parseInt(offsetDays, 10) || 0) + 1))}
                  className="w-12 rounded-xl bg-surface-container-high text-secondary hover:text-primary font-bold text-lg transition-colors"
                >
                  +
                </button>
              </div>
              <div className="flex justify-between text-xs text-secondary/50 mt-1 px-1">
                <span>{t('负数 = 往前推算', 'Negative = go back')}</span>
              </div>
            </div>

            {/* Result */}
            {offsetResult && (
              <div className="bg-primary-container/20 rounded-2xl p-4 mb-4">
                <div className="text-2xl font-bold text-on-surface text-center mb-1">
                  {offsetResult}
                </div>
                <div className="text-sm text-secondary text-center">
                  {getDayOfWeek(offsetResult, lang)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-xl bg-surface-container-high text-secondary hover:text-primary font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? t('已复制!', 'Copied!') : t('复制结果', 'Copy Result')}
        </button>
      </motion.div>
    </div>
  );
}
