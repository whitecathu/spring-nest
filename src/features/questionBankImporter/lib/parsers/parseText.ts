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
  /^(\s*(?:第?\d+\s*题[.、．、):：]?|\d+[.、．、)]|[（(]\d+[）)]|题目[:：]|题干[:：]|问题[:：]|Q[:：]))\s*(.+)?$/i;
const optionPattern = /^\s*([A-F])\s*[.、．)]\s*(.+)$/i;
const answerLabel = String.raw`(?:参考答案|标准答案|正确答案|正确选项|答案(?!解析)|Answer|Correct\s*Answer|Correct|Ans)`;
const namedAnswerPattern = new RegExp(
  String.raw`^\s*(?:【\s*)?${answerLabel}(?:\s*】)?\s*(?:是|为|选|[:：])?\s*(.+)$`,
  'i',
);
const qaAnswerPattern = /^\s*A\s*[:：]\s*(.+)$/i;
const inlineAnswerPattern = new RegExp(
  String.raw`(?:【\s*)?${answerLabel}(?:\s*】)?\s*(?:是|为|选|[:：])\s*(.+)$`,
  'i',
);
const explanationPattern = /^\s*(?:答案解析|试题解析|解析|详解|解释|Analysis|Explanation)[:：]\s*(.*)$/i;
const inlineExplanationPattern =
  /\s*(?:答案解析|试题解析|解析|详解|解释|Analysis|Explanation)\s*[:：]\s*/i;
const difficultyPattern = /^\s*(?:【\s*)?(?:难易程度|难易度|难度)(?:\s*】)?\s*[:：]?\s*(.+)$/i;
const tagPattern = /^\s*(?:标签|Tags?)[:：]\s*(.+)$/i;
const chapterPattern = /^\s*(?:章节|章|Chapter)[:：]\s*(.+)$/i;

function stripTypePrefix(line: string): { line: string; typeHint?: QuestionType } {
  let working = line.trim();
  let typeHint: QuestionType | undefined;

  for (let index = 0; index < 3; index += 1) {
    const bracketed = working.match(
      /^\s*[【\[(（]\s*(单项选择题?|单选题?|多项选择题?|多选题?|判断题?|填空题?|补空题?|简答题?|问答题?|背诵卡|卡片)\s*[】\])）]\s*/i,
    );
    if (bracketed) {
      typeHint = detectSectionType(bracketed[1]) ?? typeHint;
      working = working.slice(bracketed[0].length).trim();
      continue;
    }

    const plain = working.match(
      /^\s*(单项选择题?|单选题?|多项选择题?|多选题?|判断题?|填空题?|补空题?|简答题?|问答题?|背诵卡|卡片)\s*[:：]?\s*(?=(?:第?\d+\s*题|\d+[.、．、)]|[（(]\d+[）)]|题目[:：]|题干[:：]|问题[:：]|Q[:：]))/i,
    );
    if (plain) {
      typeHint = detectSectionType(plain[1]) ?? typeHint;
      working = working.slice(plain[0].length).trim();
      continue;
    }

    break;
  }

  return { line: working, typeHint };
}

function cleanQuestionLead(line: string): string {
  const withoutNumber = line.replace(
    /^\s*(?:第?\d+\s*题[.、．、):：]?|\d+[.、．)]|[（(]\d+[）)]|题目[:：]|题干[:：]|问题[:：]|Q[:：])\s*/i,
    '',
  );
  return stripTypePrefix(withoutNumber).line.trim();
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
  if (/背诵卡|卡片/.test(line)) return 'flashcard';
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

function cleanAnswerText(text: string): string {
  const [answerPart] = text.split(inlineExplanationPattern);
  return answerPart.replace(/[。；;，,、\s]+$/, '').trim();
}

function matchAnswerText(line: string): string | undefined {
  const qaMatch = line.match(qaAnswerPattern);
  if (qaMatch?.[1]) return cleanAnswerText(qaMatch[1]);

  const namedMatch = line.match(namedAnswerPattern);
  if (namedMatch?.[1]) return cleanAnswerText(namedMatch[1]);

  return undefined;
}

function splitInlineExplanation(text: string): { text: string; explanation?: string } {
  const match = text.match(inlineExplanationPattern);
  if (!match || match.index === undefined) return { text };
  return {
    text: text.slice(0, match.index).trim(),
    explanation: text.slice(match.index + match[0].length).trim(),
  };
}

function splitInlineAnswer(text: string): { text: string; answer?: string } {
  const match = text.match(inlineAnswerPattern);
  if (!match || match.index === undefined || !match[1]) return { text };
  return {
    text: text.slice(0, match.index).trim(),
    answer: cleanAnswerText(match[1]),
  };
}

function splitInlineOptions(text: string): { question: string; options: string[] } {
  const optionMatches = [...text.matchAll(/([A-F])\s*[.、．):：]\s*/gi)].filter((match) => {
    const index = match.index ?? 0;
    const before = index > 0 ? text[index - 1] : ' ';
    return index === 0 || /[\s　(（【\[]/.test(before);
  });

  if (optionMatches.length < 2) return { question: text.trim(), options: [] };

  const firstIndex = optionMatches[0].index ?? 0;
  const question = text.slice(0, firstIndex).trim();
  const options = optionMatches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = optionMatches[index + 1]?.index ?? text.length;
      const body = text.slice(start, end).trim();
      return body ? `${match[1].toUpperCase()}. ${body.replace(/^[A-F][.、．):：\s]+/i, '')}` : '';
    })
    .filter(Boolean);

  return { question: question || text.trim(), options };
}

function parseQuestionPayload(text: string) {
  const withExplanation = splitInlineExplanation(text);
  const withAnswer = splitInlineAnswer(withExplanation.text);
  const withOptions = splitInlineOptions(withAnswer.text);
  return {
    question: withOptions.question,
    options: withOptions.options,
    answer: withAnswer.answer,
    explanation: withExplanation.explanation,
  };
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
    const line = rawLine.replace(/\uFEFF/g, '').replace(/\u00a0/g, ' ').trimEnd();
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

    const typedLine = stripTypePrefix(trimmed);
    const workingLine = typedLine.line;

    const questionMatch = trimmed.match(questionStartPattern);
    const typedQuestionMatch = workingLine.match(questionStartPattern);
    const optionMatch = workingLine.match(optionPattern);
    const answerText = matchAnswerText(workingLine);
    const explanationMatch = workingLine.match(explanationPattern);
    const difficultyMatch = workingLine.match(difficultyPattern);
    const tagMatch = workingLine.match(tagPattern);

    if (questionMatch || typedQuestionMatch) {
      const complete = finalizeDraft(current, context);
      if (complete) questions.push(complete);
      const parsed = parseQuestionPayload(cleanQuestionLead(workingLine));
      current = {
        questionLines: [parsed.question],
        options: parsed.options,
        answer: parsed.answer,
        explanationLines: parsed.explanation ? [parsed.explanation] : [],
        tags: [],
        chapter: currentChapter,
        typeHint: typedLine.typeHint ?? sectionType,
      };
      readingExplanation = false;
      continue;
    }

    if (!current) {
      const parsed = parseQuestionPayload(workingLine);
      current = {
        questionLines: [parsed.question],
        options: parsed.options,
        answer: parsed.answer,
        explanationLines: parsed.explanation ? [parsed.explanation] : [],
        tags: [],
        chapter: currentChapter,
        typeHint: typedLine.typeHint ?? sectionType,
      };
      continue;
    }

    if (optionMatch) {
      current.options.push(`${optionMatch[1].toUpperCase()}. ${optionMatch[2].trim()}`);
      readingExplanation = false;
      continue;
    }

    if (answerText) {
      current.answer = answerText;
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
      const parsed = parseQuestionPayload(workingLine);
      current = {
        questionLines: [parsed.question],
        options: parsed.options,
        answer: parsed.answer,
        explanationLines: parsed.explanation ? [parsed.explanation] : [],
        tags: [],
        chapter: currentChapter,
        typeHint: typedLine.typeHint ?? sectionType,
      };
      continue;
    }

    current.questionLines.push(workingLine.replace(/^[-*]\s+/, ''));
  }

  const complete = finalizeDraft(current, context);
  if (complete) questions.push(complete);

  if (!questions.length) warnings.push('未识别出题目，请检查题目、答案或 Q/A 格式。');
  return { questions, warnings };
}
