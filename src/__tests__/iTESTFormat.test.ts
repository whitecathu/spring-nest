import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseText } from '../features/questionBankImporter/lib/parsers/parseText';

describe('iTEST document format', () => {
  it('parses the full iTEST docx through the Word pipeline', async () => {
    const { parseWordDocument } =
      await import('../features/questionBankImporter/lib/parsers/parseWord');
    const data = readFileSync(
      path.resolve('C:/Users/22821/Desktop/试卷预览（研究生24-02）+-+iTEST系统.docx'),
    );
    const parsed = await parseWordDocument(data, { sourceFile: 'itest.docx' }, 'docx');

    expect(parsed.questions.length).toBeGreaterThan(100);

    const withAnswer = parsed.questions.filter((q) => q.answer);
    const withOptions = parsed.questions.filter((q) => q.options?.length);
    const withBoth = parsed.questions.filter((q) => q.answer && q.options?.length);

    // At least 80% should have answers
    expect(withAnswer.length).toBeGreaterThan(parsed.questions.length * 0.8);
    // At least 80% should have options
    expect(withOptions.length).toBeGreaterThan(parsed.questions.length * 0.8);
    // At least 75% should have both
    expect(withBoth.length).toBeGreaterThan(parsed.questions.length * 0.75);

    // Check first question
    expect(parsed.questions[0].options).toHaveLength(4);
    expect(parsed.questions[0].answer).toBeTruthy();

    // Check for blanks
    const withBlanks = parsed.questions.filter((q) => q.question.includes('____'));
    expect(withBlanks.length).toBeGreaterThan(100);

    // Check no 答案 in options
    const answerInOpts = parsed.questions.filter((q) => q.options?.some((o) => o.includes('答案')));
    expect(answerInOpts).toHaveLength(0);
  });

  it('parses iTEST single-line options with √ marker', () => {
    const text = [
      '语法及词汇_客观题1',
      '1. The Department of Education has issued new national ____ for science teachers.',
      'A)  guidance                                    B)  guide                                           C)  guidant                                       D)  guidelines √',
      '答案：',
      'D',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].options).toEqual([
      'A. guidance',
      'B. guide',
      'C. guidant',
      'D. guidelines',
    ]);
    expect(result.questions[0].answer).toBe('D');
  });

  it('parses iTEST multi-line options with √ marker', () => {
    const text = [
      '语法及词汇_客观题2',
      "2. Contrary to what some correspondents think, it doesn't ____ the unemployment rate.",
      'A)  have anything to do with √',
      'B)  have something to do with',
      'C)  have nothing to do with',
      'D)  have many things to do with',
      '答案：',
      'A',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].options).toEqual([
      'A. have anything to do with',
      'B. have something to do with',
      'C. have nothing to do with',
      'D. have many things to do with',
    ]);
    expect(result.questions[0].answer).toBe('A');
  });

  it('skips Part and iTEST section headings', () => {
    const text = [
      'Part I Grammar & vocabulary',
      '',
      '语法及词汇_客观题1',
      '1. Test question?',
      'A)  option A √',
      'B)  option B',
      '答案：A',
      '',
      'Part II Reading comprehension',
      '',
      '仔细阅读_客观题',
      '21. Another question?',
      'A)  choice A',
      'B)  choice B √',
      '答案：B',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].answer).toBe('A');
    expect(result.questions[1].answer).toBe('B');
  });

  it('parses reading comprehension passage followed by questions', () => {
    const text = [
      '仔细阅读_客观题2',
      'This is a long passage about something interesting.',
      'It has multiple paragraphs of content.',
      '',
      '21. What is the main idea?',
      'A)  idea A',
      'B)  idea B √',
      'C)  idea C',
      'D)  idea D',
      '答案：B',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toBe('B');
    expect(result.questions[0].question).not.toContain('long passage');
  });

  it('handles inline answer on same line as 答案 label', () => {
    const text = ['1. A test question?', 'A)  option A', 'B)  option B √', '答案：B'].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toBe('B');
  });

  it('strips trailing 答案：X from option lines', () => {
    const text = [
      '26. A question with inline answer on option line?',
      'A)  option A',
      'B)  option B',
      'C)  option C',
      'D)  option D答案：C',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].options).toEqual([
      'A. option A',
      'B. option B',
      'C. option C',
      'D. option D',
    ]);
    expect(result.questions[0].answer).toBe('C');
  });

  it('strips standalone 答案： lines and captures next-line answer', () => {
    const text = ['1. A question?', 'A)  option A', 'B)  option B √', '答案：', 'B'].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toBe('B');
    expect(result.questions[0].question).not.toContain('答案');
  });

  it('handles inline 答案：D on option line with √ marker', () => {
    const text = [
      '21. What does "dementia" mean?',
      "A) Alzheimer's disease √",
      'B) Heart disease',
      'C) Dental disease',
      'D) Eye disease.',
      '答案：A',
      '',
      '22. What does "props" mean?',
      'A) Cue.                                            B) Frustration.                                 C) Property.                                     D) Support. √答案：D',
      '解析：D',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'itest.docx' });
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].answer).toBe('A');
    expect(result.questions[1].answer).toBe('D');
    expect(result.questions[1].options).toEqual([
      'A. Cue.',
      'B. Frustration.',
      'C. Property.',
      'D. Support.',
    ]);
  });
});
