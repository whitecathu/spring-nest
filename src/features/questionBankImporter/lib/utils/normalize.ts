import type { Difficulty, Question, QuestionType, ReviewMeta } from '../../types/question';
import { createId } from './id';

export function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(/[;,，、|]/))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[;,，、|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeOptions(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const options = value.map((item) => String(item).trim()).filter(Boolean);
    return options.length ? options : undefined;
  }
  if (typeof value === 'string') {
    const options = value
      .split(/\n|[|；;]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return options.length ? options : undefined;
  }
  return undefined;
}

export function normalizeAnswer(value: unknown): string | string[] | undefined {
  if (Array.isArray(value)) {
    const answers = value
      .flatMap((item) => {
        const normalized = normalizeAnswer(item);
        if (!normalized) return [];
        return Array.isArray(normalized) ? normalized : [normalized];
      })
      .map((item) => String(item).trim())
      .filter(Boolean);
    return answers.length > 1 ? answers : answers[0];
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value)
      .trim()
      .replace(/^答案\s*[:：]?\s*/i, '')
      .replace(/^正确答案\s*(?:是|为|[:：])?\s*/i, '')
      .replace(/^参考答案\s*(?:是|为|[:：])?\s*/i, '')
      .replace(/^标准答案\s*(?:是|为|[:：])?\s*/i, '')
      .replace(/^正确选项\s*(?:是|为|[:：])?\s*/i, '');
    if (!text) return undefined;
    const selectedOption = text.match(/^选项\s*([A-F])$/i);
    if (selectedOption) return selectedOption[1].toUpperCase();

    const markedOption = text.match(/^([A-F])\s*[.、．):：]\s*.+$/i);
    if (markedOption) return markedOption[1].toUpperCase();

    const compactChoices = text.replace(/[\s,，、/|；;]+/g, '').toUpperCase();
    if (/^[A-F]{2,}$/.test(compactChoices)) {
      return compactChoices.split('');
    }
    const multi = text
      .split(/[，,、/|；;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (multi.length > 1 && multi.every((item) => /^[A-Z]$/i.test(item))) {
      return multi.map((item) => item.toUpperCase());
    }
    return text;
  }
  return undefined;
}

export function normalizeDifficulty(value: unknown): Difficulty | undefined {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (['easy', '简单', '易'].includes(text)) return 'easy';
  if (['medium', 'normal', '中等', '普通'].includes(text)) return 'medium';
  if (['hard', '困难', '难'].includes(text)) return 'hard';
  return undefined;
}

export function normalizeQuestionType(
  value: unknown,
  options?: string[],
  answer?: string | string[],
): QuestionType {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (['single', '单选', '单选题'].includes(text)) return 'single';
  if (['multiple', 'multi', '多选', '多选题'].includes(text)) return 'multiple';
  if (['judge', 'truefalse', '判断', '判断题'].includes(text)) return 'judge';
  if (['blank', 'fill', 'fillblank', '填空', '填空题'].includes(text)) return 'blank';
  if (['short', '简答', '简答题'].includes(text)) return 'short';
  if (['flashcard', 'card', '背诵卡', '卡片'].includes(text)) return 'flashcard';

  const answerText = Array.isArray(answer) ? answer.join(',') : String(answer ?? '');
  if (/^(对|错|正确|错误|true|false|yes|no)$/i.test(answerText)) return 'judge';
  if (Array.isArray(answer) && answer.length > 1) return 'multiple';
  if (options && options.length > 1) return 'single';
  return 'short';
}

export function createQuestion(input: {
  sourceFile: string;
  sourcePath?: string;
  question: string;
  options?: string[];
  answer?: string | string[];
  explanation?: string;
  tags?: string[];
  chapter?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
}): Question {
  const now = new Date().toISOString();
  return {
    id: createId('q'),
    sourceFile: input.sourceFile,
    sourcePath: input.sourcePath,
    type: input.type ?? normalizeQuestionType(undefined, input.options, input.answer),
    question: input.question.trim(),
    options: input.options?.filter(Boolean),
    answer: input.answer,
    explanation: input.explanation?.trim() || undefined,
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
    chapter: input.chapter?.trim() || undefined,
    difficulty: input.difficulty,
    createdAt: now,
  };
}

export function createReviewMeta(questionId: string): ReviewMeta {
  return {
    questionId,
    favorite: false,
    wrongCount: 0,
    correctCount: 0,
    masteryLevel: 0,
    confidence: 1,
    intervalDays: 0,
    lapses: 0,
  };
}

export function mergeUniqueQuestions(existing: Question[], incoming: Question[]): Question[] {
  const seen = new Set(
    existing.map((question) =>
      [
        question.question.trim(),
        JSON.stringify(question.answer ?? ''),
        question.sourcePath ?? question.sourceFile,
      ].join('|'),
    ),
  );
  const result = [...existing];
  for (const question of incoming) {
    const key = [
      question.question.trim(),
      JSON.stringify(question.answer ?? ''),
      question.sourcePath ?? question.sourceFile,
    ].join('|');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(question);
    }
  }
  return result;
}
