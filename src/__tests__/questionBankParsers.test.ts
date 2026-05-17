import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defaultBuiltInQuestionBank } from '../features/questionBankImporter/config/builtInQuestionBanks';
import { parseCsv } from '../features/questionBankImporter/lib/parsers/parseCsv';
import { parseJson } from '../features/questionBankImporter/lib/parsers/parseJson';
import { parseRar } from '../features/questionBankImporter/lib/parsers/parseRar';
import { parseText } from '../features/questionBankImporter/lib/parsers/parseText';
import {
  normalizeAnswer,
  normalizeQuestionType,
} from '../features/questionBankImporter/lib/utils/normalize';

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

  it('parses inline exam-bank text with bracketed type and answer analysis labels', () => {
    const result = parseText(
      [
        '【单选题】1. 下列协议用于域名解析的是？ A. HTTP B. FTP C. DNS D. SMTP 正确答案为 C 答案解析：DNS 用于域名解析。',
        '【多选题】2. 以下属于浏览器本地存储的是？ A. localStorage B. IndexedDB C. 云数据库 D. Cookie 参考答案：A B D',
      ].join('\n'),
      { sourceFile: 'inline-bank.txt' },
    );

    expect(result.questions).toHaveLength(2);
    expect(result.questions[0]).toMatchObject({
      type: 'single',
      answer: 'C',
      explanation: 'DNS 用于域名解析。',
    });
    expect(result.questions[0].options).toEqual(['A. HTTP', 'B. FTP', 'C. DNS', 'D. SMTP']);
    expect(result.questions[1]).toMatchObject({
      type: 'multiple',
      answer: ['A', 'B', 'D'],
    });
  });

  it('parses TSV/CSV exports with common answer field aliases', () => {
    const result = parseCsv(
      [
        '题干\t选项A\t选项B\t正确选项\t答案解析\t题型',
        '复习小筑默认把题库保存在哪里？\t本机浏览器\t远程服务器\tA. 本机浏览器\t默认本地保存，可导出备份。\t单选题',
      ].join('\n'),
      { sourceFile: 'export.tsv' },
    );

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({
      type: 'single',
      answer: 'A',
      explanation: '默认本地保存，可导出备份。',
    });
  });

  it('parses JSON wrapped in data records with snake_case answer fields', () => {
    const result = parseJson(
      JSON.stringify({
        data: {
          records: [
            {
              stem: '移动端复习时主要操作区应该放在哪里？',
              option_a: '屏幕下半部分',
              option_b: '隐藏到菜单里',
              correct_answer: '选项A',
              analysis: '单手操作时底部更容易触达。',
              question_type: 'single',
            },
          ],
        },
      }),
      { sourceFile: 'wrapped.json' },
    );

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({
      type: 'single',
      answer: 'A',
    });
  });

  it('normalizes common answer forms to option letters', () => {
    expect(normalizeAnswer('A. 本机浏览器')).toBe('A');
    expect(normalizeAnswer('选项B')).toBe('B');
    expect(normalizeAnswer('A/B/D')).toEqual(['A', 'B', 'D']);
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
