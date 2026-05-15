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

const questionFields = ['question', '题目', '题干', '问题', 'title', 'content'];
const optionsFields = ['options', '选项'];
const answerFields = ['answer', '答案', '正确答案', 'correctAnswer'];
const explanationFields = ['explanation', '解析', 'analysis'];
const tagsFields = ['tags', '标签'];
const typeFields = ['type', '类型', '题型'];
const difficultyFields = ['difficulty', '难度'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return undefined;
}

function readOptions(record: Record<string, unknown>): string[] | undefined {
  const direct = normalizeOptions(pick(record, optionsFields));
  if (direct?.length) return direct;

  const optionValues = ['A', 'B', 'C', 'D', 'E', 'F']
    .map((letter) => {
      const value =
        record[`option${letter}`] ??
        record[`选项${letter}`] ??
        record[letter] ??
        record[letter.toLowerCase()];
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

  return createQuestion({
    sourceFile: context.sourceFile,
    sourcePath: context.sourcePath,
    question: questionText,
    options,
    answer,
    explanation,
    tags,
    type: type as QuestionType,
    difficulty: difficulty as Difficulty | undefined,
  });
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

  const rawQuestions = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.questions)
      ? parsed.questions
      : undefined;

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
