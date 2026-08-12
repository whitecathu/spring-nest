import { describe, expect, it } from 'vitest';

// Mirror of MarkdownPreview sanitizers for unit coverage without mounting React.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

  let processed = text.replace(/`([^`]+)`/g, (_, code: string) =>
    stash(`<code>${escapeHtml(code)}</code>`),
  );

  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
    const safeHref = sanitizeHref(href);
    if (!safeHref) return stash(escapeHtml(`[${label}](${href})`));
    return stash(`<a href="${escapeHtml(safeHref)}">${escapeHtml(label)}</a>`);
  });

  processed = processed.replace(/\*\*(.+?)\*\*/g, (_, inner: string) =>
    stash(`<strong>${escapeHtml(inner)}</strong>`),
  );
  processed = processed.replace(/\*(.+?)\*/g, (_, inner: string) =>
    stash(`<em>${escapeHtml(inner)}</em>`),
  );

  processed = escapeHtml(processed);
  processed = processed.replace(
    /\u0000(\d+)\u0000/g,
    (_, index: string) => stashed[Number(index)] ?? '',
  );
  return processed;
}

describe('markdown inline sanitizer', () => {
  it('escapes raw HTML tags', () => {
    const html = parseInline('<img onerror=alert(1) src=x>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('blocks javascript: links', () => {
    const html = parseInline('[click](javascript:alert(1))');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('javascript:alert(1)');
  });

  it('allows https links', () => {
    const html = parseInline('[ok](https://example.com)');
    expect(html).toContain('href="https://example.com"');
  });
});
