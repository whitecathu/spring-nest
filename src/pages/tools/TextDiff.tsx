import { useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Copy, Check, Trash2, ArrowLeftRight } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface DiffSegment {
  type: 'equal' | 'added' | 'removed';
  text: string;
}

function computeLineDiff(
  oldText: string,
  newText: string,
): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // LCS-based diff on lines
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const oldResult: DiffSegment[] = [];
  const newResult: DiffSegment[] = [];
  let i = m;
  let j = n;

  const oldTemp: DiffSegment[] = [];
  const newTemp: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      oldTemp.push({ type: 'equal', text: oldLines[i - 1] });
      newTemp.push({ type: 'equal', text: newLines[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      newTemp.push({ type: 'added', text: newLines[j - 1] });
      oldTemp.push({ type: 'equal', text: '' });
      j--;
    } else if (i > 0) {
      oldTemp.push({ type: 'removed', text: oldLines[i - 1] });
      newTemp.push({ type: 'equal', text: '' });
      i--;
    }
  }

  oldTemp.reverse().forEach((s) => oldResult.push(s));
  newTemp.reverse().forEach((s) => newResult.push(s));

  return { oldSegments: oldResult, newSegments: newResult };
}

export default function TextDiff({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [copied, setCopied] = useState(false);

  const diff = useMemo(() => {
    if (!textA && !textB) return null;
    return computeLineDiff(textA, textB);
  }, [textA, textB]);

  const stats = useMemo(() => {
    if (!diff) return null;
    const added = diff.newSegments.filter((s) => s.type === 'added').length;
    const removed = diff.oldSegments.filter((s) => s.type === 'removed').length;
    const unchanged = diff.oldSegments.filter((s) => s.type === 'equal' && s.text !== '').length;
    return { added, removed, unchanged };
  }, [diff]);

  const handleSwap = useCallback(() => {
    setTextA(textB);
    setTextB(textA);
  }, [textA, textB]);

  const handleClear = useCallback(() => {
    setTextA('');
    setTextB('');
  }, []);

  const handleCopy = useCallback(async () => {
    if (!diff) return;
    const lines: string[] = [];
    diff.oldSegments.forEach((seg, idx) => {
      const newSeg = diff.newSegments[idx];
      if (seg.type === 'removed') {
        lines.push(`- ${seg.text}`);
      }
      if (newSeg.type === 'added') {
        lines.push(`+ ${newSeg.text}`);
      }
      if (seg.type === 'equal' && seg.text) {
        lines.push(`  ${seg.text}`);
      }
    });
    const result = lines.join('\n');
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [diff]);

  const renderDiffPanel = (segments: DiffSegment[], side: 'left' | 'right') => {
    return segments.map((seg, idx) => {
      const lineNum = segments
        .slice(0, idx + 1)
        .filter(
          (s) =>
            s.type === 'equal' || (side === 'left' ? s.type === 'removed' : s.type === 'added'),
        ).length;
      let bgClass = '';
      if (seg.type === 'removed')
        bgClass = 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-400';
      else if (seg.type === 'added')
        bgClass = 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-400';
      else bgClass = 'bg-transparent';

      return (
        <div key={idx} className={`flex ${bgClass}`}>
          <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-xs text-secondary/50 font-mono select-none">
            {idx + 1}
          </span>
          <span className="py-0.5 pr-3 text-sm font-mono text-on-surface whitespace-pre-wrap break-all flex-1">
            {seg.text || ' '}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30">
        <h2 className="text-2xl font-bold text-on-surface text-center mb-2">
          {t('文本对比', 'Text Diff')}
        </h2>
        <p className="text-sm text-secondary text-center mb-6">
          {t(
            '逐行对比两段文本，高亮显示差异',
            'Compare two texts line by line with highlighted differences',
          )}
        </p>

        {/* Input Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-on-surface mb-2 block">
              {t('原始文本', 'Original Text')}
            </label>
            <textarea
              aria-label={t('原始文本', 'Original text')}
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder={t('在此输入原始文本...', 'Enter original text here...')}
              rows={8}
              className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface placeholder-secondary/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-mono leading-relaxed"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface mb-2 block">
              {t('修改后文本', 'Modified Text')}
            </label>
            <textarea
              aria-label={t('修改后文本', 'Modified text')}
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder={t('在此输入修改后的文本...', 'Enter modified text here...')}
              rows={8}
              className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface placeholder-secondary/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleSwap}
            className="flex-1 min-w-[80px] py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeftRight className="w-4 h-4" />
            {t('交换', 'Swap')}
          </button>
          <button
            onClick={handleCopy}
            disabled={!diff}
            className={`flex-1 min-w-[80px] py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              copied
                ? 'bg-green-100 text-green-600'
                : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
            } disabled:opacity-40`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('已复制!', 'Copied!') : t('复制差异', 'Copy Diff')}
          </button>
          <button
            onClick={handleClear}
            className="py-2.5 px-4 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {t('清空', 'Clear')}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              + {stats.added} {t('行新增', 'lines added')}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              - {stats.removed} {t('行删除', 'lines removed')}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {stats.unchanged} {t('行相同', 'lines unchanged')}
            </span>
          </div>
        )}

        {/* Diff Output */}
        {diff && (
          <div className="rounded-2xl bg-surface-container-low border border-surface-variant/30 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-surface-variant/30">
              <div className="overflow-x-auto">
                <div className="px-3 py-2 text-xs font-semibold text-secondary border-b border-surface-variant/20 bg-surface-container">
                  {t('原始文本', 'Original')}
                </div>
                {diff && renderDiffPanel(diff.oldSegments, 'left')}
              </div>
              <div className="overflow-x-auto">
                <div className="px-3 py-2 text-xs font-semibold text-secondary border-b border-surface-variant/20 bg-surface-container">
                  {t('修改后文本', 'Modified')}
                </div>
                {diff && renderDiffPanel(diff.newSegments, 'right')}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!diff && (
          <div className="text-center py-12 text-secondary/50">
            <p className="text-lg">
              {t(
                '在上方输入两段文本，即可查看差异',
                'Enter two texts above to see the differences',
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
