import type { ParserContext, ParserOutput } from './types';
import {
  createQuestion,
  normalizeAnswer,
  normalizeDifficulty,
  normalizeOptions,
  normalizeQuestionType,
  normalizeTags,
} from '../utils/normalize';

function normalizeHeaderKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[\uFEFF\s]+/, '')
    .replace(/[\s_-]+/g, '');
}

function detectDelimiter(text: string): ',' | '\t' | ';' {
  const firstDataLine = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .find((line) => line.trim());
  if (!firstDataLine) return ',';

  const candidates: Array<',' | '\t' | ';'> = [',', '\t', ';'];
  const counts = candidates.map((delimiter) => ({
    delimiter,
    count: firstDataLine.split(delimiter).length - 1,
  }));
  return counts.sort((a, b) => b.count - a.count)[0]?.delimiter ?? ',';
}

function parseCsvRows(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      row.push(field.trim());
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function get(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[normalizeHeaderKey(key)];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

export function parseCsv(text: string, context: ParserContext): ParserOutput {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return { questions: [], warnings: ['CSV 至少需要表头和一行题目数据。'] };
  }

  const headers = rows[0].map(normalizeHeaderKey);
  const warnings: string[] = [];
  const questions = rows.slice(1).flatMap((cells) => {
    const record = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = cells[index]?.trim() ?? '';
      return acc;
    }, {});

    const question = get(record, [
      'question',
      'questionText',
      'stem',
      'title',
      'content',
      '题目',
      '题目内容',
      '题干',
      '问题',
      '问题描述',
    ]);
    if (!question) return [];

    const directOptions = normalizeOptions(get(record, ['options', 'optionList', '选项', '选项内容']));
    const columnOptions = ['A', 'B', 'C', 'D', 'E', 'F']
      .map((letter) => {
        const value = get(record, [
          `option${letter}`,
          `option_${letter}`,
          `选项${letter}`,
          `${letter}选项`,
          letter,
        ]);
        return value ? `${letter}. ${value.replace(/^[A-F][.、\s]+/i, '')}` : '';
      })
      .filter(Boolean);
    const options = directOptions ?? (columnOptions.length ? columnOptions : undefined);
    const answer = normalizeAnswer(
      get(record, [
        'answer',
        'correct',
        'correctAnswer',
        'correct_answer',
        'rightAnswer',
        'right_answer',
        'key',
        '答案',
        '参考答案',
        '标准答案',
        '正确答案',
        '正确选项',
        '答案选项',
      ]),
    );
    const type = normalizeQuestionType(
      get(record, ['type', 'questionType', '类型', '题型']),
      options,
      answer,
    );

    return [
      createQuestion({
        sourceFile: context.sourceFile,
        sourcePath: context.sourcePath,
        question,
        options,
        answer,
        explanation: get(record, ['explanation', 'analysis', 'solution', '解析', '答案解析', '详解']),
        tags: [...(context.defaultTags ?? []), ...normalizeTags(get(record, ['tags', '标签']))],
        chapter: get(record, ['chapter', '章节', '章']),
        difficulty: normalizeDifficulty(get(record, ['difficulty', '难度'])),
        type,
      }),
    ];
  });

  const skipped = rows.length - 1 - questions.length;
  if (skipped > 0) warnings.push(`有 ${skipped} 行缺少题目字段，已跳过。`);
  return { questions, warnings };
}
