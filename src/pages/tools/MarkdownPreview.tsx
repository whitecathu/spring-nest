import { useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Copy, Check, Trash2, Edit3, Eye } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

/* ============ Simple Markdown Parser ============ */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allow only http(s), mailto, and in-page hash / relative paths. */
function sanitizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || /[\s<>"']/.test(trimmed)) return null;
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('#') && !trimmed.includes(':')) return trimmed;
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  ) {
    return trimmed;
  }
  return null;
}

function parseInline(text: string): string {
  const stashed: string[] = [];
  const stash = (html: string) => {
    stashed.push(html);
    return `\u0000${stashed.length - 1}\u0000`;
  };

  // Protect code spans first (content escaped)
  let processed = text.replace(/`([^`]+)`/g, (_, code: string) =>
    stash(
      `<code class="bg-surface-container-high px-1.5 py-0.5 rounded text-sm text-primary font-mono">${escapeHtml(code)}</code>`,
    ),
  );

  // Links — escape label, allowlist href schemes
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
    const safeHref = sanitizeHref(href);
    if (!safeHref) return stash(escapeHtml(`[${label}](${href})`));
    return stash(
      `<a href="${escapeHtml(safeHref)}" class="text-primary underline" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
    );
  });

  // Bold + italic / bold / italic — escape inner text
  processed = processed.replace(/\*\*\*(.+?)\*\*\*/g, (_, inner: string) =>
    stash(`<strong><em>${escapeHtml(inner)}</em></strong>`),
  );
  processed = processed.replace(/\*\*(.+?)\*\*/g, (_, inner: string) =>
    stash(`<strong>${escapeHtml(inner)}</strong>`),
  );
  processed = processed.replace(/\*(.+?)\*/g, (_, inner: string) =>
    stash(`<em>${escapeHtml(inner)}</em>`),
  );

  // Escape remaining plain text, then restore safe HTML tokens
  processed = escapeHtml(processed);
  processed = processed.replace(
    /\u0000(\d+)\u0000/g,
    (_, index: string) => stashed[Number(index)] ?? '',
  );

  return processed;
}

function parseMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeBlockContent = '';
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const closeList = () => {
    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        html += `<pre class="bg-surface-container-high rounded-xl p-4 overflow-x-auto text-sm font-mono text-on-surface my-3"><code>${escapeHtml(codeBlockContent)}</code></pre>`;
        inCodeBlock = false;
        codeBlockContent = '';
      } else {
        closeList();
        inCodeBlock = true;
        codeBlockContent = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += (codeBlockContent ? '\n' : '') + line;
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      closeList();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeList();
      html += '<hr class="border-surface-variant/30 my-4">';
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];
      const weights = [
        'font-bold',
        'font-bold',
        'font-bold',
        'font-semibold',
        'font-semibold',
        'font-semibold',
      ];
      html += `<h${level} class="${sizes[level - 1]} ${weights[level - 1]} text-on-surface mt-4 mb-2">${parseInline(headingMatch[2])}</h${level}>`;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeList();
      html += `<blockquote class="border-l-4 border-primary/30 pl-4 py-1 my-2 text-secondary italic">${parseInline(line.slice(2))}</blockquote>`;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        html += '<ul class="list-disc list-inside space-y-1 my-2 text-on-surface">';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${parseInline(ulMatch[1])}</li>`;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        html += '<ol class="list-decimal list-inside space-y-1 my-2 text-on-surface">';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${parseInline(olMatch[1])}</li>`;
      continue;
    }

    // Regular paragraph
    closeList();
    html += `<p class="my-2 text-on-surface leading-relaxed">${parseInline(line)}</p>`;
  }

  closeList();

  return html;
}

/* ============ Component ============ */

type MobileTab = 'edit' | 'preview';

export default function MarkdownPreview({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [markdown, setMarkdown] = useState(
    '## Hello\n\n**Bold** and *italic* text.\n\n- Item 1\n- Item 2\n\n> A blockquote\n\n`inline code`\n\n---\n\n[Link](https://example.com)',
  );
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('edit');

  const html = useMemo(() => parseMarkdown(markdown), [markdown]);

  const handleClear = useCallback(() => {
    setMarkdown('');
  }, []);

  const handleCopyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [html]);

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30">
        <h1 className="text-2xl font-bold text-on-surface text-center mb-4">
          {t('Markdown 预览', 'Markdown Preview')}
        </h1>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleCopyHtml}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              copied
                ? 'bg-green-100 text-green-600'
                : 'bg-primary-container/50 text-primary hover:bg-primary-container'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('已复制!', 'Copied!') : t('复制 HTML', 'Copy HTML')}
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2 rounded-xl bg-surface-container-high text-secondary font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {t('清空', 'Clear')}
          </button>
        </div>

        {/* Mobile Tab Toggle */}
        <div className="md:hidden flex justify-center mb-4">
          <div className="bg-surface-container-high rounded-full p-1 flex gap-1">
            <button
              onClick={() => setMobileTab('edit')}
              className={`px-5 py-1.5 rounded-full font-semibold text-sm transition-all flex items-center gap-1.5 ${mobileTab === 'edit' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              <Edit3 className="w-4 h-4" />
              {t('编辑', 'Edit')}
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-5 py-1.5 rounded-full font-semibold text-sm transition-all flex items-center gap-1.5 ${mobileTab === 'preview' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              <Eye className="w-4 h-4" />
              {t('预览', 'Preview')}
            </button>
          </div>
        </div>

        {/* Desktop: Side by Side */}
        <div className="hidden md:grid md:grid-cols-2 gap-4">
          {/* Editor */}
          <div>
            <div className="text-xs font-bold text-secondary mb-2">{t('编辑', 'Edit')}</div>
            <textarea
              aria-label={t('Markdown 编辑器', 'Markdown editor')}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={t('输入 Markdown 文本...', 'Type Markdown here...')}
              rows={16}
              className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface placeholder-secondary/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-mono leading-relaxed h-full"
            />
          </div>
          {/* Preview */}
          <div>
            <div className="text-xs font-bold text-secondary mb-2">{t('预览', 'Preview')}</div>
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 min-h-[320px] overflow-y-auto">
              {html ? (
                <div dangerouslySetInnerHTML={{ __html: html }} className="prose-sm" />
              ) : (
                <div className="text-secondary/40 text-sm">{t('预览区域', 'Preview area')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Stacked with tabs */}
        <div className="md:hidden">
          {mobileTab === 'edit' ? (
            <textarea
              aria-label={t('Markdown 编辑器', 'Markdown editor')}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={t('输入 Markdown 文本...', 'Type Markdown here...')}
              rows={14}
              className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface placeholder-secondary/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-mono leading-relaxed"
            />
          ) : (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 min-h-[280px] overflow-y-auto">
              {html ? (
                <div dangerouslySetInnerHTML={{ __html: html }} className="prose-sm" />
              ) : (
                <div className="text-secondary/40 text-sm">{t('预览区域', 'Preview area')}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
