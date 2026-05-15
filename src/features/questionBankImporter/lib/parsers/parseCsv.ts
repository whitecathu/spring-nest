import type { ParserContext, ParserOutput } from './types';
import {
  createQuestion,
  normalizeAnswer,
  normalizeDifficulty,
  normalizeOptions,
  normalizeQuestionType,
  normalizeTags,
} from '../utils/normalize';

function parseCsvRows(text: string): string[][] {
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
    if (char === ',' && !inQuotes) {
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
    const value = row[key.toLowerCase()];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

export function parseCsv(text: string, context: ParserContext): ParserOutput {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return { questions: [], warnings: ['CSV 至少需要表头和一行题目数据。'] };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const warnings: string[] = [];
  const questions = rows.slice(1).flatMap((cells) => {
    const record = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = cells[index]?.trim() ?? '';
      return acc;
    }, {});

    const question = get(record, ['question', '题目', '题干', '问题']);
    if (!question) return [];

    const directOptions = normalizeOptions(get(record, ['options', '选项']));
    const columnOptions = ['A', 'B', 'C', 'D', 'E', 'F']
      .map((letter) => {
        const value = get(record, [`option${letter}`, `选项${letter}`, letter]);
        return value ? `${letter}. ${value.replace(/^[A-F][.、\s]+/i, '')}` : '';
      })
      .filter(Boolean);
    const options = directOptions ?? (columnOptions.length ? columnOptions : undefined);
    const answer = normalizeAnswer(get(record, ['answer', '答案', '正确答案']));
    const type = normalizeQuestionType(get(record, ['type', '类型', '题型']), options, answer);

    return [
      createQuestion({
        sourceFile: context.sourceFile,
        sourcePath: context.sourcePath,
        question,
        options,
        answer,
        explanation: get(record, ['explanation', '解析']),
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
