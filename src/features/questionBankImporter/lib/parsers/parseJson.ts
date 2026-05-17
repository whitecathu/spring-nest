import type { ParserContext, ParserOutput } from './types';
import type { Difficulty, QuestionType } from '../../types/question';
import {
  createQuestion,
  normalizeAnswer,
  normalizeDifficulty,
  normalizeOptions,
  normalizeQuestionType,
  normalizeTags,
} from '../utils/normalize';

const questionFields = [
  'question',
  'questionText',
  'stem',
  '题目',
  '题目内容',
  '题干',
  '问题',
  '问题描述',
  'title',
  'content',
];
const optionsFields = ['options', 'optionList', '选项', '选项内容'];
const answerFields = [
  'answer',
  '答案',
  '参考答案',
  '标准答案',
  '正确答案',
  '正确选项',
  '答案选项',
  'correct',
  'correctAnswer',
  'correct_answer',
  'rightAnswer',
  'right_answer',
  'key',
];
const explanationFields = ['explanation', '解析', '答案解析', '详解', 'analysis', 'solution'];
const tagsFields = ['tags', '标签'];
const chapterFields = ['chapter', '章节', '章'];
const typeFields = ['type', 'questionType', '类型', '题型'];
const difficultyFields = ['difficulty', '难度'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeFieldKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  const normalizedRecord = new Map(
    Object.entries(record).map(([key, value]) => [normalizeFieldKey(key), value]),
  );
  for (const key of keys) {
    const value = normalizedRecord.get(normalizeFieldKey(key));
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function readOptions(record: Record<string, unknown>): string[] | undefined {
  const direct = normalizeOptions(pick(record, optionsFields));
  if (direct?.length) return direct;

  const optionValues = ['A', 'B', 'C', 'D', 'E', 'F']
    .map((letter) => {
      const value =
        pick(record, [
          `option${letter}`,
          `option_${letter}`,
          `选项${letter}`,
          `${letter}选项`,
          letter,
        ]) ?? record[letter.toLowerCase()];
      if (value === undefined || value === null) return '';
      const text = String(value).trim();
      return text ? `${letter}. ${text.replace(/^[A-F][.、\s]+/i, '')}` : '';
    })
    .filter(Boolean);
  return optionValues.length ? optionValues : undefined;
}

function parseQuestionRecord(record: Record<string, unknown>, context: ParserContext) {
  const questionText = String(pick(record, questionFields) ?? '').trim();
  if (!questionText) return undefined;

  const options = readOptions(record);
  const answer = normalizeAnswer(pick(record, answerFields));
  const type = normalizeQuestionType(pick(record, typeFields), options, answer);
  const difficulty = normalizeDifficulty(pick(record, difficultyFields));
  const explanation = String(pick(record, explanationFields) ?? '').trim();
  const tags = [...(context.defaultTags ?? []), ...normalizeTags(pick(record, tagsFields))];
  const chapter = String(pick(record, chapterFields) ?? '').trim();

  return createQuestion({
    sourceFile: context.sourceFile,
    sourcePath: context.sourcePath,
    question: questionText,
    options,
    answer,
    explanation,
    tags,
    chapter,
    type: type as QuestionType,
    difficulty: difficulty as Difficulty | undefined,
  });
}

function pickQuestionArray(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return undefined;

  const direct = pick(value, ['questions', 'questionList', 'items', 'list', 'rows', 'records']);
  if (Array.isArray(direct)) return direct;

  const data = pick(value, ['data', 'result']);
  if (Array.isArray(data)) return data;
  if (isRecord(data)) return pickQuestionArray(data);

  return undefined;
}

export function parseJson(text: string, context: ParserContext): ParserOutput {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      questions: [],
      warnings: [`JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`],
    };
  }

  const rawQuestions = pickQuestionArray(parsed);

  if (!rawQuestions) {
    return {
      questions: [],
      warnings: ['JSON 需要是题目数组，或包含 questions 数组。'],
    };
  }

  const questions = rawQuestions
    .map((item) => (isRecord(item) ? parseQuestionRecord(item, context) : undefined))
    .filter((question) => question !== undefined);

  if (questions.length !== rawQuestions.length) {
    warnings.push(`有 ${rawQuestions.length - questions.length} 条记录缺少题干，已跳过。`);
  }

  return { questions, warnings };
}
