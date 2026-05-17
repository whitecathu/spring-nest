import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defaultBuiltInQuestionBank } from '../features/questionBankImporter/config/builtInQuestionBanks';
import { parseRar } from '../features/questionBankImporter/lib/parsers/parseRar';
import { parseText } from '../features/questionBankImporter/lib/parsers/parseText';
import { normalizeQuestionType } from '../features/questionBankImporter/lib/utils/normalize';

describe('question bank parsing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recognizes fill-in questions as a first-class review type', () => {
    expect(normalizeQuestionType('填空题')).toBe('blank');
    expect(normalizeQuestionType('blank')).toBe('blank');
  });

  it('parses fill-in sections from pasted exam text', () => {
    const result = parseText(
      [
        '填空题',
        '1. 春日小筑的数据默认保存在浏览器的____中。',
        '答案：localStorage',
        '解析：当前复习小筑使用本地浏览器保存题库和复习记录。',
      ].join('\n'),
      { sourceFile: 'paste.txt' },
    );

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({
      type: 'blank',
      answer: 'localStorage',
      sourceFile: 'paste.txt',
    });
  });

  it('carries chapter headings into parsed questions', () => {
    const result = parseText(
      [
        '第一章 数据结构',
        '单选题',
        '1. 栈的特点是？',
        'A. 先进先出',
        'B. 后进先出',
        '答案：B',
      ].join('\n'),
      { sourceFile: 'chapters.txt' },
    );

    expect(result.questions[0]).toMatchObject({
      chapter: '第一章 数据结构',
      type: 'single',
    });
  });

  it('parses the built-in 2024 revised Maogai RAR question bank', async () => {
    const wasmBinary = readFileSync(
      path.resolve(process.cwd(), 'node_modules/node-unrar-js/esm/js/unrar.wasm'),
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(wasmBinary, {
        status: 200,
        headers: { 'content-type': 'application/wasm' },
      }),
    );

    const data = readFileSync(
      path.resolve(
        process.cwd(),
        'public',
        defaultBuiltInQuestionBank.assetPath.replaceAll('/', path.sep),
      ),
    );
    const file = new File([data], defaultBuiltInQuestionBank.fileName, {
      type: 'application/vnd.rar',
    });

    const result = await parseRar(file);

    expect(result.errors).toEqual([]);
    expect(result.questions.length).toBeGreaterThan(100);
    expect(result.report).toMatchObject({
      name: defaultBuiltInQuestionBank.fileName,
      extension: 'rar',
      status: 'warning',
    });
    expect(result.report.children?.[0]?.children?.length).toBeGreaterThanOrEqual(8);
    expect(result.questions[0]).toMatchObject({
      sourceFile: defaultBuiltInQuestionBank.fileName,
    });
  });
});
