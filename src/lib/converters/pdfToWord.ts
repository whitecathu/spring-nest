import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { ConversionProgress } from './wordToPdf';

type PdfTextItemLike = {
  str: string;
  transform?: number[];
  hasEOL?: boolean;
};

export type ExtractedPdfPage = {
  pageNumber: number;
  text: string;
};

export type PdfToWordResult = {
  blob: Blob;
  pageCount: number;
  textLength: number;
  emptyPageCount: number;
};

function isTextItem(item: unknown): item is PdfTextItemLike {
  return typeof item === 'object' && item !== null && 'str' in item;
}

function pushLine(lines: string[], value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized) lines.push(normalized);
}

export function normalizePdfTextItems(items: PdfTextItemLike[]): string {
  const lines: string[] = [];
  let currentLine = '';
  let currentY: number | null = null;

  for (const item of items) {
    const text = item.str.replace(/\s+/g, ' ');
    const nextY =
      Array.isArray(item.transform) && typeof item.transform[5] === 'number'
        ? Math.round(item.transform[5])
        : null;
    const movedLine = currentY !== null && nextY !== null && Math.abs(nextY - currentY) > 5;

    if (movedLine) {
      pushLine(lines, currentLine);
      currentLine = '';
    }

    currentLine += text;
    if (nextY !== null) currentY = nextY;

    if (item.hasEOL) {
      pushLine(lines, currentLine);
      currentLine = '';
      currentY = null;
    }
  }

  pushLine(lines, currentLine);
  return lines.join('\n');
}

async function extractPdfPages(file: File, onProgress?: ConversionProgress) {
  onProgress?.('正在读取 PDF 文件', 16);
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages: ExtractedPdfPage[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.(
        `正在提取第 ${pageNumber} / ${pdf.numPages} 页文本`,
        20 + (pageNumber / pdf.numPages) * 50,
      );
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const items = textContent.items.filter(isTextItem) as PdfTextItemLike[];
      pages.push({
        pageNumber,
        text: normalizePdfTextItems(items),
      });
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages;
}

function splitIntoParagraphs(text: string) {
  return text
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function convertPdfToWord(
  file: File,
  onProgress?: ConversionProgress,
): Promise<PdfToWordResult> {
  const pages = await extractPdfPages(file, onProgress);
  const totalText = pages
    .map((page) => page.text)
    .join('\n')
    .trim();

  if (!totalText) {
    throw new Error('该 PDF 可能是扫描件，暂不支持 OCR 识别。请使用文本型 PDF 后重试。');
  }

  onProgress?.('正在生成 Word 文档', 82);
  const { Document, HeadingLevel, Packer, PageBreak, Paragraph, TextRun } = await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [];
  pages.forEach((page, index) => {
    if (index > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: index === 0 ? 0 : 120, after: 180 },
        children: [
          new TextRun({
            text: `第 ${page.pageNumber} 页`,
            bold: true,
            color: '3F6751',
            font: 'Noto Sans SC',
          }),
        ],
      }),
    );

    const paragraphs = splitIntoParagraphs(page.text);
    if (paragraphs.length === 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '（本页未提取到文本）', italics: true, color: '777777' })],
        }),
      );
      return;
    }

    paragraphs.forEach((paragraphText) => {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: paragraphText,
              font: 'Noto Sans SC',
              size: 22,
            }),
          ],
        }),
      );
    });
  });

  const document = new Document({
    creator: 'Spring Nest',
    title: file.name.replace(/\.pdf$/i, ''),
    description: 'Generated locally in the browser by Spring Nest.',
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  onProgress?.('Word 文档已生成', 100);

  return {
    blob,
    pageCount: pages.length,
    textLength: totalText.length,
    emptyPageCount: pages.filter((page) => !page.text.trim()).length,
  };
}
