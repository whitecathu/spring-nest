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
const optionPattern = /^\s*([A-F])\s*(?:[.、．)]\s*)?(.+)$/;
const answerLabel = String.raw`(?:参考答案|标准答案|正确答案是|正确答案|正确选项|答案(?!解析)|Answer|Correct\s*Answer|Correct|Ans)`;
const namedAnswerPattern = new RegExp(
  String.raw`^\s*(?:【\s*)?${answerLabel}(?:\s*】)?\s*(?:是|为|选)?\s*[:：]?\s*([^\s：:】](?:[^\n]*[^\s：:】])?)\s*$`,
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

const iTESTSectionLabelPattern = /^(?:\w[\w一-鿿]*_客观题?\d*|Part\s+[IVX\d]+)\s*$/i;

function isSectionHeading(line: string, detectedType: QuestionType): boolean {
  if (/^[一二三四五六七八九十]+[、.．]/.test(line)) return true;
  if (/^[（(][一二三四五六七八九十\d]+[）)]/.test(line)) return true;
  if (iTESTSectionLabelPattern.test(line)) return true;
  const headingPattern: Record<QuestionType, RegExp> = {
    single: /^(?:单项选择题?|单选题?)\s*(?:[（(]?\d+道?题目?[）)]?)?\s*[:：]?\s*$/,
    multiple: /^(?:多项选择题?|多选题?)\s*(?:[（(]?\d+道?题目?[）)]?)?\s*[:：]?\s*$/,
    judge: /^(?:判断题?)\s*(?:[（(]?\d+道?题目?[）)]?)?\s*[:：]?\s*$/,
    blank: /^(?:填空题?|补空题?)\s*(?:[（(]?\d+道?题目?[）)]?)?\s*[:：]?\s*$/,
    short: /^(?:简答题?|问答题?)\s*(?:[（(]?\d+道?题目?[）)]?)?\s*[:：]?\s*$/,
    flashcard: /^(?:背诵卡|卡片)\s*(?:[（(]?\d+道?题目?[）)]?)?\s*[:：]?\s*$/,
  };
  return headingPattern[detectedType].test(line);
}

function isNonQuestionHeading(line: string): boolean {
  if (/^第[一二三四五六七八九十\d]+章/.test(line)) return true;
  if (/^[一二三四五六七八九十]+[、.．]\s*(?:选择题|练习题|测试题)\d*$/.test(line)) return true;
  if (/^(?:选择题|练习题|测试题)\d*$/.test(line)) return true;
  if (/^Part\s+[IVX\d]+/i.test(line)) return true;
  if (/^(?:\w[\w一-鿿]*_客观题?\d*)\s*$/i.test(line)) return true;
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

const bracketAnswerPattern = /【正确答案是】\s*[:：]?\s*([^\s：:】](?:[^\n]*[^\s：:】])?)\s*$/;

function matchAnswerText(line: string): string | undefined {
  const bracketMatch = line.match(bracketAnswerPattern);
  if (bracketMatch?.[1]) return cleanAnswerText(bracketMatch[1]);

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
  const cleaned = text.replace(/√/g, '');
  const optionMatches = [...cleaned.matchAll(/([A-F])\s*[.、．):：]\s*/g)].filter((match) => {
    const index = match.index ?? 0;
    if (index === 0) return true;
    const prev = cleaned[index - 1];
    if (/[\s　(（【\[）】\])]/.test(prev)) return true;
    if (/\p{Unified_Ideograph}/u.test(prev) && !/[。？！…」】）〉》]/.test(prev)) return true;
    return false;
  });

  if (optionMatches.length < 2) return { question: cleaned.trim(), options: [] };

  const firstIndex = optionMatches[0].index ?? 0;
  const question = cleaned.slice(0, firstIndex).trim();
  const options = optionMatches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = optionMatches[index + 1]?.index ?? cleaned.length;
      const body = cleaned.slice(start, end).trim();
      return body ? `${match[1].toUpperCase()}. ${body.replace(/^[A-F][.、．):：\s]+/i, '')}` : '';
    })
    .filter(Boolean);

  return { question: question || cleaned.trim(), options };
}

function extractSingleOption(text: string): string | undefined {
  const cleaned = text.replace(/√/g, '').trim();
  const match = cleaned.match(/^\s*([A-F])\s*(?:[.、．):：]\s*)?(.+)$/);
  if (!match?.[2]) return undefined;
  return `${match[1].toUpperCase()}. ${match[2].trim()}`;
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
  if (!/[一-鿿A-Za-z]/.test(question)) return undefined;
  if (/[一-鿿]/.test(question) && !/[一-鿿]{2,}/.test(question)) return undefined;
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

  const strippedAnswerLabel = String.raw`(?:参考答案|标准答案|正确答案|正确选项|答案|Answer|Correct\s*Answer|Correct|Ans)`;
  const trailingAnswerPattern = new RegExp(
    String.raw`\s*(?:【\s*)?${strippedAnswerLabel}(?:\s*】)?\s*(?:是|为|选)?\s*[:：]\s*(.+?)?\s*$`,
    'i',
  );
  const standaloneAnswerLabelPattern = new RegExp(
    String.raw`^\s*(?:【\s*)?${strippedAnswerLabel}(?:\s*】)?\s*(?:是|为|选)?\s*[:：]?\s*$`,
    'i',
  );

  const inlineBracketAnswerPattern = /【正确答案是】\s*[:：]?\s*([^\s：:】](?:[^\n]*[^\s：:】])?)\s*$/;

  const pendingInlineAnswers = new Map<number, string>();
  const preprocessedLines = text.replace(/\r\n/g, '\n').split('\n').map((rawLine, lineIdx) => {
    const line = rawLine.replace(/﻿/g, '').replace(/ /g, ' ').trimEnd();
    const trimmed = line.trim();
    if (optionPattern.test(trimmed)) {
      const answerMatch = trailingAnswerPattern.exec(trimmed);
      if (answerMatch) {
        if (answerMatch[1]?.trim()) {
          pendingInlineAnswers.set(lineIdx, answerMatch[1].trim());
        }
        return trimmed.replace(trailingAnswerPattern, '').trimEnd();
      }
      const bracketMatch = inlineBracketAnswerPattern.exec(trimmed);
      if (bracketMatch) {
        if (bracketMatch[1]?.trim()) {
          pendingInlineAnswers.set(lineIdx, bracketMatch[1].trim());
        }
        return trimmed.replace(inlineBracketAnswerPattern, '').trimEnd();
      }
    }
    if (standaloneAnswerLabelPattern.test(trimmed)) return '';
    return line;
  });

  let lineIdx = 0;
  for (const rawLine of preprocessedLines) {
    const currentLineIdx = lineIdx++;
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
      const pending = pendingInlineAnswers.get(currentLineIdx);
      if (pending && current && current.options.length && !current.answer) {
        current.answer = pending;
        pendingInlineAnswers.delete(currentLineIdx);
      }
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
      const { options: inlineOptions } = splitInlineOptions(workingLine);
      if (inlineOptions.length > 1) {
        current.options.push(...inlineOptions);
      } else {
        current.options.push(extractSingleOption(workingLine) ?? `${optionMatch[1].toUpperCase()}. ${optionMatch[2].replace(/√/g, '').trim()}`);
      }
      const pending = pendingInlineAnswers.get(currentLineIdx);
      if (pending && !current.answer) {
        current.answer = pending;
        pendingInlineAnswers.delete(currentLineIdx);
      }
      readingExplanation = false;
      continue;
    }

    if (answerText) {
      current.answer = answerText;
      readingExplanation = false;
      continue;
    }

    if (!current.answer && current.options.length && /^\s*[A-F]\s*$/i.test(trimmed)) {
      current.answer = trimmed.trim().toUpperCase();
      readingExplanation = false;
      continue;
    }

    if (!current.answer && current.questionLines.length && /^\s*(是|否)\s*$/.test(trimmed)) {
      current.answer = trimmed.trim();
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

  for (const [, pending] of pendingInlineAnswers) {
    if (current && current.options.length && !current.answer) {
      current.answer = pending;
      break;
    }
  }
  const complete = finalizeDraft(current, context);
  if (complete) questions.push(complete);

  if (!questions.length) warnings.push('未识别出题目，请检查题目、答案或 Q/A 格式。');
  return { questions, warnings };
}
