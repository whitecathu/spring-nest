import { describe, expect, it } from 'vitest';
import { parseText } from '../features/questionBankImporter/lib/parsers/parseText';
import { normalizeQuestionType } from '../features/questionBankImporter/lib/utils/normalize';

describe('question bank parsing', () => {
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
});
