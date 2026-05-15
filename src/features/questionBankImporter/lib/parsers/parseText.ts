import type { ParserContext, ParserOutput } from './types';
import type { Difficulty, QuestionType } from '../../types/question';
import {
  createQuestion,
  normalizeAnswer,
  normalizeQuestionType,
  normalizeTags,
} from '../utils/normalize';

interface DraftQuestion {
  questionLines: string[];
  options: string[];
  answer?: string | string[];
  explanationLines: string[];
  tags: string[];
  chapter?: string;
  difficulty?: Difficulty;
  typeHint?: QuestionType;
}

const questionStartPattern =
  /^(\s*(?:\d+[.、．、)]|[（(]\d+[）)]|题目[:：]|题干[:：]|问题[:：]|Q[:：]))\s*(.+)?$/i;
const optionPattern = /^\s*([A-F])\s*[.、．)]\s*(.+)$/i;
const answerPattern =
  /^\s*(?:【\s*)?(?:参考答案|正确答案|答案|Answer|A)(?:\s*】)?\s*[:：]?\s*(.+)$/i;
const explanationPattern = /^\s*(?:解析|解释|Explanation)[:：]\s*(.*)$/i;
const difficultyPattern = /^\s*(?:【\s*)?(?:难易程度|难易度|难度)(?:\s*】)?\s*[:：]?\s*(.+)$/i;
const tagPattern = /^\s*(?:标签|Tags?)[:：]\s*(.+)$/i;
const chapterPattern = /^\s*(?:章节|章|Chapter)[:：]\s*(.+)$/i;

function cleanQuestionLead(line: string): string {
  return line
    .replace(/^\s*(?:\d+[.、．)]|[（(]\d+[）)]|题目[:：]|题干[:：]|问题[:：]|Q[:：])\s*/i, '')
    .trim();
}

function normalizeDifficultyText(text: string): Difficulty | undefined {
  const clean = text.trim();
  if (['易', '简单', 'easy'].includes(clean)) return 'easy';
  if (['中', '中等', 'medium'].includes(clean)) return 'medium';
  if (['难', '困难', 'hard'].includes(clean)) return 'hard';
  return undefined;
}

function detectSectionType(line: string): QuestionType | undefined {
  if (/多(项|选)|多项选择/.test(line)) return 'multiple';
  if (/单(项|选)|单项选择/.test(line)) return 'single';
  if (/判断/.test(line)) return 'judge';
  if (/填空|补空/.test(line)) return 'blank';
  if (/简答|问答/.test(line)) return 'short';
  return undefined;
}

function isSectionHeading(line: string, detectedType: QuestionType): boolean {
  if (/^[一二三四五六七八九十]+[、.．]/.test(line)) return true;
  if (/^[（(][一二三四五六七八九十\d]+[）)]/.test(line)) return true;
  const headingPattern: Record<QuestionType, RegExp> = {
    single: /^(?:单项选择题?|单选题?)\d*$/,
    multiple: /^(?:多项选择题?|多选题?)\d*$/,
    judge: /^(?:判断题?)\d*$/,
    blank: /^(?:填空题?|补空题?)\d*$/,
    short: /^(?:简答题?|问答题?)\d*$/,
    flashcard: /^(?:背诵卡|卡片)\d*$/,
  };
  return headingPattern[detectedType].test(line);
}

function isNonQuestionHeading(line: string): boolean {
  if (/^第[一二三四五六七八九十\d]+章/.test(line)) return true;
  if (/^[一二三四五六七八九十]+[、.．]\s*(?:选择题|练习题|测试题)\d*$/.test(line)) return true;
  if (/^(?:选择题|练习题|测试题)\d*$/.test(line)) return true;
  return false;
}

function detectChapter(line: string): string | undefined {
  const explicit = line.match(chapterPattern);
  if (explicit?.[1]?.trim()) return explicit[1].trim();
  if (/^第[一二三四五六七八九十\d]+章/.test(line)) return line.trim();
  return undefined;
}

function finalizeDraft(draft: DraftQuestion | undefined, context: ParserContext) {
  if (!draft) return undefined;
  const question = draft.questionLines.join('\n').trim();
  if (!question) return undefined;
  if (!draft.options.length && !draft.answer && !draft.explanationLines.length) return undefined;
  const answer = draft.answer ? normalizeAnswer(draft.answer) : undefined;
  const options = draft.options.length ? draft.options : undefined;
  const inferredType = normalizeQuestionType(draft.typeHint, options, answer);
  return createQuestion({
    sourceFile: context.sourceFile,
    sourcePath: context.sourcePath,
    question,
    options,
    answer,
    explanation: draft.explanationLines.join('\n').trim(),
    tags: [...(context.defaultTags ?? []), ...draft.tags],
    chapter: draft.chapter,
    type: inferredType,
    difficulty: draft.difficulty,
  });
}

export function stripMarkdownCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '\n');
}

export function parseText(text: string, context: ParserContext): ParserOutput {
  const questions = [];
  const warnings: string[] = [];
  let current: DraftQuestion | undefined;
  let readingExplanation = false;
  let sectionType: QuestionType | undefined;
  let currentChapter: string | undefined;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      readingExplanation = false;
      continue;
    }

    const detectedChapter = detectChapter(trimmed);
    if (detectedChapter) {
      currentChapter = detectedChapter;
      if (current) current.chapter = detectedChapter;
      continue;
    }

    const detectedSectionType = detectSectionType(trimmed);
    if (detectedSectionType && isSectionHeading(trimmed, detectedSectionType)) {
      sectionType = detectedSectionType;
      continue;
    }

    if (isNonQuestionHeading(trimmed)) {
      continue;
    }

    const questionMatch = trimmed.match(questionStartPattern);
    const optionMatch = trimmed.match(optionPattern);
    const answerMatch = trimmed.match(answerPattern);
    const explanationMatch = trimmed.match(explanationPattern);
    const difficultyMatch = trimmed.match(difficultyPattern);
    const tagMatch = trimmed.match(tagPattern);

    if (questionMatch) {
      const complete = finalizeDraft(current, context);
      if (complete) questions.push(complete);
      current = {
        questionLines: [cleanQuestionLead(trimmed)],
        options: [],
        explanationLines: [],
        tags: [],
        chapter: currentChapter,
        typeHint: sectionType,
      };
      readingExplanation = false;
      continue;
    }

    if (!current) {
      current = {
        questionLines: [cleanQuestionLead(trimmed)],
        options: [],
        explanationLines: [],
        tags: [],
        chapter: currentChapter,
        typeHint: sectionType,
      };
      continue;
    }

    if (optionMatch) {
      current.options.push(`${optionMatch[1].toUpperCase()}. ${optionMatch[2].trim()}`);
      readingExplanation = false;
      continue;
    }

    if (answerMatch) {
      current.answer = answerMatch[1].trim();
      readingExplanation = false;
      continue;
    }

    if (explanationMatch) {
      const explanation = explanationMatch[1].trim();
      if (explanation) current.explanationLines.push(explanation);
      readingExplanation = true;
      continue;
    }

    if (difficultyMatch) {
      current.difficulty = normalizeDifficultyText(difficultyMatch[1]);
      continue;
    }

    if (tagMatch) {
      current.tags.push(...normalizeTags(tagMatch[1]));
      continue;
    }

    if (readingExplanation) {
      current.explanationLines.push(trimmed);
      continue;
    }

    if (current.answer) {
      const complete = finalizeDraft(current, context);
      if (complete) questions.push(complete);
      current = {
        questionLines: [cleanQuestionLead(trimmed)],
        options: [],
        explanationLines: [],
        tags: [],
        chapter: currentChapter,
        typeHint: sectionType,
      };
      continue;
    }

    current.questionLines.push(trimmed.replace(/^[-*]\s+/, ''));
  }

  const complete = finalizeDraft(current, context);
  if (complete) questions.push(complete);

  if (!questions.length) warnings.push('未识别出题目，请检查题目、答案或 Q/A 格式。');
  return { questions, warnings };
}
