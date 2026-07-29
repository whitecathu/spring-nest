import { getFileExtension } from '../documentFiles';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

export type ConversionProgress = (message: string, progress: number) => void;

export type WordToPdfResult = {
  blob: Blob;
  warnings: string[];
};

export type WordToPdfOptions = {
  pageSize: 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'standard' | 'compact';
  imageQuality: 'standard' | 'high';
};

export const DEFAULT_WORD_TO_PDF_OPTIONS: WordToPdfOptions = {
  pageSize: 'a4',
  orientation: 'auto',
  margin: 'standard',
  imageQuality: 'standard',
};

type Html2PdfWorkerLike = {
  set: (options: object) => Html2PdfWorkerLike;
  from: (source: HTMLElement) => Html2PdfWorkerLike;
  outputPdf: (type?: string) => Promise<unknown>;
};

const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:|#|\/)/i;
const SAFE_IMAGE_PATTERN = /^data:image\/(png|jpe?g|gif|webp);base64,/i;
const ALLOWED_ATTRIBUTES = new Set([
  'alt',
  'colspan',
  'height',
  'href',
  'rowspan',
  'src',
  'title',
  'width',
]);
const EMPTY_BLOCK_SELECTOR =
  'p, div, section, article, header, footer, aside, h1, h2, h3, h4, h5, h6, li';

function sanitizeMammothHtml(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (
        name === 'style' &&
        /(?:page-break-before|break-before)\s*:\s*(?:always|page)/i.test(value)
      ) {
        element.setAttribute('data-spring-nest-page-break', 'before');
      }

      if (name.startsWith('on') || !ALLOWED_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === 'href' && !SAFE_URL_PATTERN.test(value)) {
        element.removeAttribute(attribute.name);
      }

      if (name === 'src' && !SAFE_IMAGE_PATTERN.test(value)) {
        element.removeAttribute(attribute.name);
      }

      if ((name === 'width' || name === 'height') && !/^\d{1,5}$/.test(value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  template.content
    .querySelectorAll('script, iframe, object, embed, link, meta')
    .forEach((element) => {
      element.remove();
    });

  return template.innerHTML;
}

export function prepareWordHtmlForPdf(html: string): { html: string; warnings: string[] } {
  const warnings: string[] = [];
  const template = document.createElement('template');
  template.innerHTML = sanitizeMammothHtml(html);

  template.content.querySelectorAll('br + br + br').forEach((br) => br.remove());

  template.content.querySelectorAll('[data-spring-nest-page-break]').forEach((element) => {
    element.classList.add('html2pdf__page-break');
  });

  let removedEmptyBlocks = 0;
  template.content.querySelectorAll(EMPTY_BLOCK_SELECTOR).forEach((element) => {
    const hasPageBreak = element.hasAttribute('data-spring-nest-page-break');
    const hasMedia = Boolean(element.querySelector('img, table, ul, ol, pre, blockquote'));
    const text = (element.textContent ?? '').replace(/\u00a0/g, ' ').trim();
    if (!hasPageBreak && !hasMedia && !text) {
      element.remove();
      removedEmptyBlocks += 1;
    }
  });

  template.content.querySelectorAll('table').forEach((table) => {
    table.setAttribute('data-spring-nest-table', 'true');
  });

  template.content.querySelectorAll('img').forEach((image) => {
    image.setAttribute('loading', 'eager');
    image.setAttribute('decoding', 'sync');
  });

  const hasRenderableContent = Boolean(
    template.content.textContent?.replace(/\u00a0/g, ' ').trim() ||
    template.content.querySelector('img, table'),
  );

  if (removedEmptyBlocks > 0) {
    warnings.push(`已清理 ${removedEmptyBlocks} 个空白段落，降低生成空白页的概率`);
  }

  if (!hasRenderableContent) {
    throw new Error('未能从 Word 文档中解析出可转换内容，请确认文件不是空白文档。');
  }

  return { html: template.innerHTML, warnings };
}

function resolveOrientation(root: ParentNode, options: WordToPdfOptions) {
  if (options.orientation !== 'auto') return options.orientation;

  const widestTableColumns = Array.from(root.querySelectorAll('tr')).reduce((max, row) => {
    return Math.max(max, row.querySelectorAll('th, td').length);
  }, 0);
  const hasWideImage = Array.from(root.querySelectorAll('img')).some((image) => {
    const width = Number(image.getAttribute('width') || image.naturalWidth || 0);
    const height = Number(image.getAttribute('height') || image.naturalHeight || 0);
    return width > 0 && height > 0 && width / Math.max(height, 1) > 1.45;
  });

  return widestTableColumns >= 6 || hasWideImage ? 'landscape' : 'portrait';
}

function getPdfMargins(options: WordToPdfOptions) {
  return options.margin === 'compact' ? [6, 7, 6, 7] : [10, 10, 10, 10];
}

export function isImageDataMostlyBlank(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): boolean {
  const pixelCount = Math.max(width * height, 1);
  const sampleStep = Math.max(1, Math.floor(pixelCount / 7000));
  let samples = 0;
  let inkSamples = 0;

  for (let pixel = 0; pixel < pixelCount; pixel += sampleStep) {
    const index = pixel * 4;
    const alpha = data[index + 3] ?? 0;
    if (alpha < 12) continue;
    samples += 1;
    const red = data[index] ?? 255;
    const green = data[index + 1] ?? 255;
    const blue = data[index + 2] ?? 255;
    const looksLikeInk = red < 242 || green < 242 || blue < 242;
    if (looksLikeInk) inkSamples += 1;
  }

  if (!samples) return true;
  return inkSamples / samples < 0.004;
}

async function detectBlankPdfPages(blob: Blob): Promise<number[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const data = new Uint8Array(await blob.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const blankPages: number[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.22 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) continue;

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      if (isImageDataMostlyBlank(imageData.data, canvas.width, canvas.height)) {
        blankPages.push(pageNumber);
      }
    }
  } finally {
    await loadingTask.destroy();
  }

  return blankPages;
}

function createExportRoot(html: string, options: WordToPdfOptions) {
  const root = document.createElement('article');
  root.setAttribute('aria-hidden', 'true');
  root.style.position = 'fixed';
  root.style.left = '-10000px';
  root.style.top = '0';
  root.style.width =
    options.pageSize === 'letter'
      ? options.orientation === 'landscape'
        ? '1056px'
        : '816px'
      : options.orientation === 'landscape'
        ? '1123px'
        : '794px';
  root.style.minHeight = options.orientation === 'landscape' ? '794px' : '1123px';
  root.style.background = '#fffdf8';
  root.style.color = '#20251f';
  root.style.boxSizing = 'border-box';
  root.style.padding = options.margin === 'compact' ? '34px 40px' : '48px 56px';
  root.style.fontFamily =
    '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif';
  root.style.fontSize = '15px';
  root.style.lineHeight = '1.72';

  const style = document.createElement('style');
  style.textContent = `
    .spring-nest-doc-export * {
      box-sizing: border-box;
      max-width: 100%;
    }
    .spring-nest-doc-export h1,
    .spring-nest-doc-export h2,
    .spring-nest-doc-export h3,
    .spring-nest-doc-export h4 {
      color: #1f3e2c;
      line-height: 1.28;
      margin: 0 0 14px;
      page-break-after: avoid;
    }
    .spring-nest-doc-export h1 { font-size: 28px; }
    .spring-nest-doc-export h2 { font-size: 23px; margin-top: 22px; }
    .spring-nest-doc-export h3 { font-size: 19px; margin-top: 18px; }
    .spring-nest-doc-export p {
      margin: 0 0 12px;
      overflow-wrap: anywhere;
    }
    .spring-nest-doc-export ul,
    .spring-nest-doc-export ol {
      margin: 0 0 14px 24px;
      padding: 0;
    }
    .spring-nest-doc-export li {
      margin: 4px 0;
    }
    .spring-nest-doc-export table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      page-break-inside: auto;
      overflow-wrap: anywhere;
      table-layout: auto;
    }
    .spring-nest-doc-export tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    .spring-nest-doc-export th,
    .spring-nest-doc-export td {
      border: 1px solid #d7ded6;
      padding: 8px 10px;
      vertical-align: top;
    }
    .spring-nest-doc-export th {
      background: #edf7f0;
      color: #244833;
      font-weight: 700;
    }
    .spring-nest-doc-export img {
      display: block;
      height: auto;
      margin: 14px auto;
      page-break-inside: avoid;
      object-fit: contain;
    }
    .spring-nest-doc-export .html2pdf__page-break {
      break-before: page;
      page-break-before: always;
      min-height: 1px;
    }
    .spring-nest-doc-export blockquote {
      margin: 16px 0;
      padding: 10px 16px;
      border: 1px solid #dce7df;
      border-radius: 10px;
      background: #f4faf6;
      color: #415044;
    }
    .spring-nest-doc-export pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      border-radius: 10px;
      background: #f1f4ef;
      padding: 12px;
    }
  `;
  root.className = 'spring-nest-doc-export';
  root.innerHTML = html;
  root.prepend(style);
  return root;
}

export async function convertWordToPdf(
  file: File,
  onProgress?: ConversionProgress,
  options: WordToPdfOptions = DEFAULT_WORD_TO_PDF_OPTIONS,
): Promise<WordToPdfResult> {
  const extension = getFileExtension(file.name);

  if (extension === 'doc') {
    throw new Error('浏览器本地转换暂不支持旧版 .doc 文件，请先另存为 .docx 后重试。');
  }

  onProgress?.('读取文件：正在读取 Word 文档', 14);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.('解析内容：正在抽取正文、标题、表格和图片', 36);
  const mammothModule = await import('mammoth');
  const mammoth = ((mammothModule as { default?: typeof import('mammoth') }).default ??
    mammothModule) as typeof import('mammoth');

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => ({
        src: `data:${image.contentType};base64,${await image.readAsBase64String()}`,
      })),
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    },
  );

  onProgress?.('转换中：正在清理空白段落与异常分页', 58);
  const prepared = prepareWordHtmlForPdf(result.value);
  const warnings = [
    ...result.messages.map((message) => message.message),
    ...prepared.warnings,
  ].filter(Boolean);

  const { default: html2pdf } = await import('html2pdf.js');
  const normalizedOptions = { ...DEFAULT_WORD_TO_PDF_OPTIONS, ...options };
  const orientationProbe = document.createElement('div');
  orientationProbe.innerHTML = prepared.html;
  const orientation = resolveOrientation(orientationProbe, normalizedOptions);
  const exportRoot = createExportRoot(prepared.html, { ...normalizedOptions, orientation });
  document.body.appendChild(exportRoot);

  try {
    onProgress?.('生成结果：正在排版 PDF 页面', 74);
    const options = {
      margin: getPdfMargins(normalizedOptions),
      filename: `${file.name.replace(/\.(docx|doc)$/i, '')}.pdf`,
      image: {
        type: 'jpeg',
        quality: normalizedOptions.imageQuality === 'high' ? 0.98 : 0.92,
      },
      enableLinks: true,
      html2canvas: {
        backgroundColor: '#fffdf8',
        scale:
          normalizedOptions.imageQuality === 'high'
            ? Math.min(2.4, window.devicePixelRatio || 2)
            : Math.min(1.8, window.devicePixelRatio || 1.5),
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { unit: 'mm', format: normalizedOptions.pageSize, orientation },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['img', 'table', 'tr', 'h1', 'h2', 'h3'] },
    };

    const worker = html2pdf() as unknown as Html2PdfWorkerLike;
    const output = await worker.set(options).from(exportRoot).outputPdf('blob');
    const blob =
      output instanceof Blob ? output : new Blob([output as BlobPart], { type: 'application/pdf' });

    onProgress?.('完成：正在校验是否存在空白页', 92);
    const blankPages = await detectBlankPdfPages(blob);
    if (blankPages.length > 0) {
      if (blankPages.length >= 1) {
        warnings.push(
          `检测到第 ${blankPages.join('、')} 页可能为空白，请检查源文档分页符或尝试紧凑边距`,
        );
      }
      if (blankPages.length >= 1 && blob.size < 2048) {
        throw new Error('生成的 PDF 内容异常偏小，请检查源文档后重试。');
      }
    }

    onProgress?.('完成：PDF 已生成', 100);

    return {
      blob,
      warnings,
    };
  } finally {
    document.body.removeChild(exportRoot);
  }
}
