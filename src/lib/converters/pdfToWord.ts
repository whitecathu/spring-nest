import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { ConversionProgress } from './wordToPdf';

type PdfJsModule = typeof import('pdfjs-dist');

type PdfTextItemLike = {
  str: string;
  transform?: number[];
  hasEOL?: boolean;
};

export type ExtractedPdfPage = {
  pageNumber: number;
  text: string;
  imageCount: number;
  image?: PdfPageImage;
};

export type PdfPageImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type PdfToWordResult = {
  blob: Blob;
  pageCount: number;
  textLength: number;
  emptyPageCount: number;
  skippedPageNumbers: number[];
  scannedPageCount: number;
  renderedImagePageNumbers: number[];
};

function isTextItem(item: unknown): item is PdfTextItemLike {
  return typeof item === 'object' && item !== null && 'str' in item;
}

function pushLine(lines: string[], value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized) lines.push(normalized);
}

function sortPdfTextItems(items: PdfTextItemLike[]): PdfTextItemLike[] {
  const sortable = items.every(
    (item) =>
      Array.isArray(item.transform) &&
      typeof item.transform[4] === 'number' &&
      typeof item.transform[5] === 'number',
  );

  if (!sortable) return items;

  return [...items].sort((a, b) => {
    const ay = Math.round(a.transform?.[5] ?? 0);
    const by = Math.round(b.transform?.[5] ?? 0);
    if (Math.abs(by - ay) > 5) return by - ay;
    return (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0);
  });
}

function needsSpaceBetween(previous: string, next: string) {
  if (!previous || !next) return false;
  return /[A-Za-z0-9)]$/.test(previous) && /^[A-Za-z0-9([]/.test(next);
}

export function normalizePdfTextItems(items: PdfTextItemLike[]): string {
  const lines: string[] = [];
  let currentLine = '';
  let currentY: number | null = null;

  for (const item of sortPdfTextItems(items)) {
    const rawText = item.str.replace(/\s+/g, ' ');
    const text = rawText.trim();
    const nextY =
      Array.isArray(item.transform) && typeof item.transform[5] === 'number'
        ? Math.round(item.transform[5])
        : null;
    const movedLine = currentY !== null && nextY !== null && Math.abs(nextY - currentY) > 5;

    if (movedLine) {
      pushLine(lines, currentLine);
      currentLine = '';
    }

    if (text) {
      const spacer =
        rawText.startsWith(' ') || needsSpaceBetween(currentLine.trimEnd(), text) ? ' ' : '';
      currentLine += `${currentLine ? spacer : ''}${text}`;
    } else if (currentLine && !currentLine.endsWith(' ')) {
      currentLine += ' ';
    }

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

async function loadPdfJs(): Promise<PdfJsModule> {
  if (import.meta.env.MODE === 'test') {
    return (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsModule;
  }

  return import('pdfjs-dist');
}

function countImageOperators(pdfjs: PdfJsModule, fnArray: number[]) {
  const ops = pdfjs.OPS as unknown as Record<string, number | undefined>;
  const imageOps = new Set(
    [
      ops.paintImageXObject,
      ops.paintInlineImageXObject,
      ops.paintImageMaskXObject,
      ops.paintXObject,
    ].filter((value): value is number => typeof value === 'number'),
  );
  return fnArray.filter((fn) => imageOps.has(fn)).length;
}

function toFriendlyPdfError(error: unknown): Error {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error ?? '');
  const signal = `${name} ${message}`;

  if (/password|encrypted|PasswordException/i.test(signal)) {
    return new Error('该 PDF 已加密或受密码保护，请先解除保护后再转换。');
  }

  if (/InvalidPDF|MissingPDF|bad XRef|Invalid PDF structure|FormatError/i.test(signal)) {
    return new Error('PDF 文件无法打开，请确认文件完整且没有损坏。');
  }

  return error instanceof Error ? error : new Error('PDF 解析失败，请换一个文件重试。');
}

function canvasToPngData(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PDF 页面图片生成失败，请重试。'));
        return;
      }
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, 'image/png');
  });
}

export function scalePdfPageImageForDocx(
  width: number,
  height: number,
  maxWidth = 560,
  maxHeight = 760,
) {
  const ratio = Math.min(maxWidth / Math.max(width, 1), maxHeight / Math.max(height, 1), 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function renderPdfPageImage(page: PDFPageProxy): Promise<PdfPageImage> {
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(1.4, 1100 / Math.max(baseViewport.width, 1));
  const viewport = page.getViewport({ scale: Math.max(0.8, scale) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法渲染 PDF 页面图片。');

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return {
    data: await canvasToPngData(canvas),
    width: canvas.width,
    height: canvas.height,
  };
}

async function extractPdfPages(file: File, onProgress?: ConversionProgress) {
  onProgress?.('读取文件：正在读取 PDF 文件', 16);
  const pdfjs = await loadPdfJs();
  if (import.meta.env.MODE !== 'test') {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise.catch(async (error: unknown) => {
    await loadingTask.destroy().catch(() => undefined);
    throw toFriendlyPdfError(error);
  });
  const pages: ExtractedPdfPage[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.(
        `解析内容：正在提取第 ${pageNumber} / ${pdf.numPages} 页文本`,
        20 + (pageNumber / pdf.numPages) * 50,
      );
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const operatorList = await page.getOperatorList();
      const items = textContent.items.filter(isTextItem) as PdfTextItemLike[];
      const text = normalizePdfTextItems(items);
      const imageCount = countImageOperators(pdfjs, operatorList.fnArray as number[]);
      pages.push({
        pageNumber,
        text,
        imageCount,
        image: !text.trim() && imageCount > 0 ? await renderPdfPageImage(page) : undefined,
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
  const contentPages = pages.filter((page) => page.text.trim() || page.image);
  const skippedPages = pages.filter((page) => !page.text.trim() && !page.image);
  const renderedImagePages = pages.filter((page) => page.image);
  const scannedPageCount = skippedPages.filter((page) => page.imageCount > 0).length;
  const renderedScannedPageCount = renderedImagePages.length;
  const totalText = pages
    .map((page) => page.text)
    .join('\n')
    .trim();

  if (!totalText && !renderedImagePages.length) {
    if (scannedPageCount > 0) {
      throw new Error('该 PDF 可能是图片扫描件，当前需要 OCR 才能提取文字。');
    }
    throw new Error('该 PDF 未提取到可复制文字，可能是空白页、加密或受保护文件。');
  }

  onProgress?.('生成结果：正在生成 Word 文档', 82);
  const { Document, HeadingLevel, ImageRun, Packer, PageBreak, Paragraph, TextRun } =
    await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({
          text:
            skippedPages.length > 0 || renderedScannedPageCount > 0
              ? [
                  skippedPages.length
                    ? `已跳过 ${skippedPages.length} 个空白页面：${skippedPages
                        .map((page) => page.pageNumber)
                        .join('、')}`
                    : '',
                  renderedScannedPageCount
                    ? `已将 ${renderedScannedPageCount} 个无可复制文本的图片页作为页面图片插入，若需可编辑文字请使用 OCR。`
                    : '',
                ]
                  .filter(Boolean)
                  .join('；')
              : 'PDF 文本已按页面顺序整理为可编辑 Word 文档。',
          color: skippedPages.length > 0 || renderedScannedPageCount > 0 ? '835917' : '3F6751',
          font: 'Noto Sans SC',
          size: 21,
        }),
      ],
    }),
  ];

  contentPages.forEach((page, index) => {
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

    if (page.image) {
      const dimensions = scalePdfPageImageForDocx(page.image.width, page.image.height);
      children.push(
        new Paragraph({
          spacing: { before: paragraphs.length ? 180 : 0, after: 120 },
          children: [
            new TextRun({
              text: '此页未提取到可复制文本，已保留页面图片。需要编辑文字时请先 OCR。',
              color: '835917',
              font: 'Noto Sans SC',
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 180 },
          children: [
            new ImageRun({
              type: 'png',
              data: page.image.data,
              transformation: dimensions,
              altText: {
                name: `PDF page ${page.pageNumber}`,
                title: `PDF 第 ${page.pageNumber} 页图片`,
                description: `PDF 第 ${page.pageNumber} 页渲染图片`,
              },
            }),
          ],
        }),
      );
    }
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
  onProgress?.('完成：Word 文档已生成', 100);

  return {
    blob,
    pageCount: pages.length,
    textLength: totalText.length,
    emptyPageCount: skippedPages.length,
    skippedPageNumbers: skippedPages.map((page) => page.pageNumber),
    scannedPageCount: scannedPageCount + renderedScannedPageCount,
    renderedImagePageNumbers: renderedImagePages.map((page) => page.pageNumber),
  };
}
