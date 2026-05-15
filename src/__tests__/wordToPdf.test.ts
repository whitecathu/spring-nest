import { describe, expect, it } from 'vitest';
import mammoth from 'mammoth';
import {
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { isImageDataMostlyBlank, prepareWordHtmlForPdf } from '../lib/converters/wordToPdf';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l0c73QAAAABJRU5ErkJggg==',
  'base64',
);

describe('word to pdf preprocessing', () => {
  it('removes empty blocks before rendering', () => {
    const result = prepareWordHtmlForPdf('<p>标题</p><p> </p><p>&nbsp;</p><p>正文</p>');

    expect(result.html).toContain('标题');
    expect(result.html).toContain('正文');
    expect(result.html).not.toContain('&nbsp;');
    expect(result.warnings[0]).toContain('已清理');
  });

  it('keeps image-only documents renderable', () => {
    const result = prepareWordHtmlForPdf(
      '<p><img src="data:image/png;base64,AAAA" width="960" height="480" alt="diagram"></p>',
    );

    expect(result.html).toContain('img');
    expect(result.html).toContain('width="960"');
    expect(result.html).toContain('height="480"');
  });

  it('prepares a generated DOCX fixture with Chinese text, tables, and embedded images', async () => {
    const document = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun('春日小筑中文标题')],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('列一')] }),
                    new TableCell({ children: [new Paragraph('列二')] }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  type: 'png',
                  data: onePixelPng,
                  transformation: { width: 24, height: 24 },
                  altText: {
                    name: '图示',
                    title: '图示',
                    description: '图示',
                  },
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun('第二页中文内容')],
            }),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(document);
    const result = await mammoth.convertToHtml(
      { buffer } as unknown as Parameters<typeof mammoth.convertToHtml>[0],
      {
        convertImage: mammoth.images.imgElement(async (image) => ({
          src: `data:${image.contentType};base64,${await image.readAsBase64String()}`,
        })),
      },
    );
    const prepared = prepareWordHtmlForPdf(result.value);

    expect(prepared.html).toContain('春日小筑中文标题');
    expect(prepared.html).toContain('第二页中文内容');
    expect(prepared.html).toContain('data-spring-nest-table="true"');
    expect(prepared.html).toContain('<td>');
    expect(prepared.html).toContain('data:image/png;base64');
    expect(prepared.html).toContain('alt="图示"');
  });

  it('preserves explicit page-break hints before empty block cleanup', () => {
    const result = prepareWordHtmlForPdf(
      '<p>第一页</p><p style="page-break-before: always;"></p><p>第二页</p>',
    );

    expect(result.html).toContain('html2pdf__page-break');
    expect(result.html).toContain('第一页');
    expect(result.html).toContain('第二页');
  });

  it('rejects documents without visible text, tables, or images', () => {
    expect(() => prepareWordHtmlForPdf('<p> </p><div><br></div>')).toThrow(
      '未能从 Word 文档中解析出可转换内容',
    );
  });
});

describe('blank pdf page detection helper', () => {
  it('treats all-white image data as blank', () => {
    const data = new Uint8ClampedArray(20 * 20 * 4).fill(255);

    expect(isImageDataMostlyBlank(data, 20, 20)).toBe(true);
  });

  it('detects visible ink in sampled image data', () => {
    const data = new Uint8ClampedArray(20 * 20 * 4).fill(255);
    for (let pixel = 0; pixel < 20; pixel += 1) {
      const index = pixel * 4;
      data[index] = 30;
      data[index + 1] = 50;
      data[index + 2] = 35;
      data[index + 3] = 255;
    }

    expect(isImageDataMostlyBlank(data, 20, 20)).toBe(false);
  });
});
