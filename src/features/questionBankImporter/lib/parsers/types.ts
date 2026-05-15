import type { ImportedFileReport, ParseResult, Question } from '../../types/question';
import { createId } from '../utils/id';

export interface ParserContext {
  sourceFile: string;
  sourcePath?: string;
  defaultTags?: string[];
}

export interface ParserOutput {
  questions: Question[];
  warnings: string[];
}

export type TextParser = (text: string, context: ParserContext) => ParserOutput;

export function emptyParseResult(): ParseResult {
  return {
    questions: [],
    files: [],
    warnings: [],
    errors: [],
  };
}

export function createFileReport(input: {
  name: string;
  path?: string;
  extension: string;
  size: number;
  status: ImportedFileReport['status'];
  message?: string;
  questionCount?: number;
  warnings?: string[];
  children?: ImportedFileReport[];
}): ImportedFileReport {
  return {
    id: createId('report'),
    name: input.name,
    path: input.path,
    extension: input.extension,
    size: input.size,
    status: input.status,
    message: input.message,
    questionCount: input.questionCount ?? 0,
    warnings: input.warnings ?? [],
    children: input.children,
  };
}
