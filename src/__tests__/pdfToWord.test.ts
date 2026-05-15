import { describe, expect, it } from 'vitest';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import {
  convertPdfToWord,
  normalizePdfTextItems,
  scalePdfPageImageForDocx,
} from '../lib/converters/pdfToWord';

class TestDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: number[]) {
    if (Array.isArray(init)) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = [
        init[0] ?? 1,
        init[1] ?? 0,
        init[2] ?? 0,
        init[3] ?? 1,
        init[4] ?? 0,
        init[5] ?? 0,
      ];
    }
  }

  translate() {
    return this;
  }

  scale() {
    return this;
  }

  invertSelf() {
    return this;
  }

  multiplySelf() {
    return this;
  }

  preMultiplySelf() {
    return this;
  }
}

class TestPath2D {
  addPath() {}
}

if (!('DOMMatrix' in globalThis)) {
  Object.defineProperty(globalThis, 'DOMMatrix', { value: TestDOMMatrix });
}

if (!('Path2D' in globalThis)) {
  Object.defineProperty(globalThis, 'Path2D', { value: TestPath2D });
}

function pdfFileFrom(doc: jsPDF, name = 'fixture.pdf') {
  return new File([doc.output('arraybuffer')], name, { type: 'application/pdf' });
}

async function readDocxDocumentXml(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const documentXml = await zip.file('word/document.xml')?.async('text');
  if (!documentXml) throw new Error('DOCX document.xml missing');
  return documentXml;
}

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

  it('adds spaces between latin fragments on the same visual line', () => {
    const text = normalizePdfTextItems([
      { str: 'Hello', transform: [1, 0, 0, 1, 10, 700] },
      { str: 'world', transform: [1, 0, 0, 1, 62, 700] },
      { str: '2026', transform: [1, 0, 0, 1, 120, 700] },
    ]);

    expect(text).toBe('Hello world 2026');
  });

  it('sorts visual fragments by row and column when transforms are available', () => {
    const text = normalizePdfTextItems([
      { str: 'B', transform: [1, 0, 0, 1, 50, 680] },
      { str: 'A', transform: [1, 0, 0, 1, 10, 700] },
      { str: '1', transform: [1, 0, 0, 1, 30, 700] },
    ]);

    expect(text).toBe('A 1\nB');
  });

  it('scales rendered PDF page images into Word-safe dimensions', () => {
    expect(scalePdfPageImageForDocx(1200, 1600)).toEqual({ width: 560, height: 747 });
    expect(scalePdfPageImageForDocx(320, 240)).toEqual({ width: 320, height: 240 });
  });
});

describe('pdf to word fixture conversion', () => {
  it('converts a real text PDF into a DOCX with extracted text', async () => {
    const pdf = new jsPDF();
    pdf.text('Hello world 2026', 20, 24);
    pdf.addPage();
    pdf.text('Second page text', 20, 24);

    const result = await convertPdfToWord(pdfFileFrom(pdf));
    const xml = await readDocxDocumentXml(result.blob);

    expect(result.pageCount).toBe(2);
    expect(result.emptyPageCount).toBe(0);
    expect(result.textLength).toBeGreaterThan(20);
    expect(xml).toContain('Hello world 2026');
    expect(xml).toContain('Second page text');
  });

  it('skips blank pages in a mixed real PDF and reports them', async () => {
    const pdf = new jsPDF();
    pdf.text('Visible first page', 20, 24);
    pdf.addPage();

    const result = await convertPdfToWord(pdfFileFrom(pdf, 'with-blank-page.pdf'));
    const xml = await readDocxDocumentXml(result.blob);

    expect(result.pageCount).toBe(2);
    expect(result.emptyPageCount).toBe(1);
    expect(result.skippedPageNumbers).toEqual([2]);
    expect(xml).toContain('Visible first page');
    expect(xml).toContain('已跳过 1 个空白页面');
  });

  it('rejects a real PDF with no extractable content instead of emitting a blank DOCX', async () => {
    const pdf = new jsPDF();

    await expect(convertPdfToWord(pdfFileFrom(pdf, 'blank.pdf'))).rejects.toThrow(
      '未提取到可复制文字',
    );
  });

  it('maps unreadable PDFs to a friendly error', async () => {
    const file = new File([new Uint8Array([37, 80, 68, 70, 45, 49])], 'broken.pdf', {
      type: 'application/pdf',
    });

    await expect(convertPdfToWord(file)).rejects.toThrow('PDF 文件无法打开');
  });

  it('maps password-protected PDFs to a friendly encrypted-file error', async () => {
    const pdf = new jsPDF({
      encryption: {
        userPassword: 'secret',
        ownerPassword: 'owner-secret',
        userPermissions: ['print'],
      },
    });
    pdf.text('Protected content', 20, 24);

    await expect(convertPdfToWord(pdfFileFrom(pdf, 'protected.pdf'))).rejects.toThrow(
      '该 PDF 已加密或受密码保护',
    );
  });
});
