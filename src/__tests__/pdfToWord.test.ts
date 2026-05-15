import { describe, expect, it } from 'vitest';
import { normalizePdfTextItems } from '../lib/converters/pdfToWord';

describe('pdf text normalization', () => {
  it('keeps same-line fragments together and separates visual lines', () => {
    const text = normalizePdfTextItems([
      { str: '第一行', transform: [1, 0, 0, 1, 10, 700] },
      { str: '内容', transform: [1, 0, 0, 1, 80, 700] },
      { str: '第二行', transform: [1, 0, 0, 1, 10, 680] },
    ]);

    expect(text).toBe('第一行内容\n第二行');
  });

  it('respects explicit end-of-line markers', () => {
    const text = normalizePdfTextItems([
      { str: 'A', transform: [1, 0, 0, 1, 10, 700], hasEOL: true },
      { str: 'B', transform: [1, 0, 0, 1, 10, 700] },
    ]);

    expect(text).toBe('A\nB');
  });
});
