import { getFileExtension } from '../documentFiles';

export type ConversionProgress = (message: string, progress: number) => void;

export type WordToPdfResult = {
  blob: Blob;
  warnings: string[];
};

type Html2PdfWorkerLike = {
  set: (options: object) => Html2PdfWorkerLike;
  from: (source: HTMLElement) => Html2PdfWorkerLike;
  outputPdf: (type?: string) => Promise<unknown>;
};

const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:|#|\/)/i;
const SAFE_IMAGE_PATTERN = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i;
const ALLOWED_ATTRIBUTES = new Set(['alt', 'colspan', 'href', 'rowspan', 'src', 'title']);

function sanitizeMammothHtml(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

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
    });
  });

  template.content
    .querySelectorAll('script, iframe, object, embed, link, meta')
    .forEach((element) => {
      element.remove();
    });

  return template.innerHTML;
}

function createExportRoot(html: string) {
  const root = document.createElement('article');
  root.setAttribute('aria-hidden', 'true');
  root.style.position = 'fixed';
  root.style.left = '-10000px';
  root.style.top = '0';
  root.style.width = '794px';
  root.style.minHeight = '1123px';
  root.style.background = '#fffdf8';
  root.style.color = '#20251f';
  root.style.boxSizing = 'border-box';
  root.style.padding = '48px 56px';
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
  root.innerHTML = sanitizeMammothHtml(html) || '<p>未能从文档中解析出内容。</p>';
  root.prepend(style);
  return root;
}

export async function convertWordToPdf(
  file: File,
  onProgress?: ConversionProgress,
): Promise<WordToPdfResult> {
  const extension = getFileExtension(file.name);

  if (extension === 'doc') {
    throw new Error('浏览器本地转换暂不支持旧版 .doc 文件，请先另存为 .docx 后重试。');
  }

  onProgress?.('正在读取 Word 文档', 18);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.('正在解析正文、标题、表格和图片', 42);
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

  onProgress?.('正在排版 PDF 页面', 70);
  const { default: html2pdf } = await import('html2pdf.js');
  const exportRoot = createExportRoot(result.value);
  document.body.appendChild(exportRoot);

  try {
    const options = {
      margin: [10, 10, 10, 10],
      filename: `${file.name.replace(/\.(docx|doc)$/i, '')}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
      enableLinks: true,
      html2canvas: {
        backgroundColor: '#fffdf8',
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['img', 'table', 'tr', 'h1', 'h2', 'h3'] },
    };

    const worker = html2pdf() as unknown as Html2PdfWorkerLike;
    const output = await worker.set(options).from(exportRoot).outputPdf('blob');
    onProgress?.('PDF 已生成', 100);

    return {
      blob:
        output instanceof Blob
          ? output
          : new Blob([output as BlobPart], { type: 'application/pdf' }),
      warnings: result.messages.map((message) => message.message),
    };
  } finally {
    document.body.removeChild(exportRoot);
  }
}
