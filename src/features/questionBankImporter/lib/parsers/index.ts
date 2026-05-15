import {
  backendRequiredExtensions,
  textLocalExtensions,
  wordLocalExtensions,
} from '../../config/supportedFormats';
import type { ParseResult } from '../../types/question';
import { getExtension } from '../utils/file';
import { validateFileSize } from '../utils/validation';
import { parseCsv } from './parseCsv';
import { parseJson } from './parseJson';
import { parseMarkdown } from './parseMarkdown';
import { parseRar } from './parseRar';
import { parseText } from './parseText';
import { decodeQuestionText } from './textEncoding';
import { parseWordDocument } from './parseWord';
import { parseZip } from './parseZip';
import { createFileReport } from './types';

async function parseTextFile(file: File, extension: string): Promise<ParseResult> {
  const decoded = decodeQuestionText(await file.arrayBuffer());
  const context = { sourceFile: file.name };
  const result =
    extension === 'json'
      ? parseJson(decoded.text, context)
      : extension === 'csv'
        ? parseCsv(decoded.text, context)
        : extension === 'md'
          ? parseMarkdown(decoded.text, context)
          : parseText(decoded.text, context);
  const warnings = decoded.warning ? [decoded.warning, ...result.warnings] : result.warnings;

  const status = result.questions.length ? (warnings.length ? 'warning' : 'success') : 'warning';
  return {
    questions: result.questions,
    files: [
      createFileReport({
        name: file.name,
        extension,
        size: file.size,
        status,
        message: result.questions.length ? '解析完成' : '未识别出题目',
        questionCount: result.questions.length,
        warnings,
      }),
    ],
    warnings,
    errors: [],
  };
}

async function parseWordFile(file: File, extension: 'doc' | 'docx'): Promise<ParseResult> {
  const result = await parseWordDocument(
    await file.arrayBuffer(),
    { sourceFile: file.name },
    extension,
  );
  const status = result.questions.length
    ? result.warnings.length
      ? 'warning'
      : 'success'
    : 'warning';
  return {
    questions: result.questions,
    files: [
      createFileReport({
        name: file.name,
        extension,
        size: file.size,
        status,
        message: result.questions.length ? '解析完成' : '未识别出题目',
        questionCount: result.questions.length,
        warnings: result.warnings,
      }),
    ],
    warnings: result.warnings,
    errors: [],
  };
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = getExtension(file.name);
  const sizeError = validateFileSize(file);
  if (sizeError) {
    return {
      questions: [],
      files: [
        createFileReport({
          name: file.name,
          extension: extension || 'unknown',
          size: file.size,
          status: 'error',
          message: sizeError,
          warnings: [sizeError],
        }),
      ],
      warnings: [],
      errors: [sizeError],
    };
  }

  if (extension === 'zip') {
    const result = await parseZip(file);
    return {
      questions: result.questions,
      files: [result.report],
      warnings: result.warnings,
      errors: result.errors,
    };
  }

  if (extension === 'rar') {
    const result = await parseRar(file);
    return {
      questions: result.questions,
      files: [result.report],
      warnings: result.warnings,
      errors: result.errors,
    };
  }

  if (textLocalExtensions.has(extension)) {
    return parseTextFile(file, extension);
  }

  if (wordLocalExtensions.has(extension)) {
    return parseWordFile(file, extension as 'doc' | 'docx');
  }

  if (backendRequiredExtensions.has(extension)) {
    const message = `${file.name} 当前需要先转为 TXT、CSV、JSON 或 DOCX，或接入后端解析服务。`;
    return {
      questions: [],
      files: [
        createFileReport({
          name: file.name,
          extension,
          size: file.size,
          status: 'warning',
          message,
          warnings: [message],
        }),
      ],
      warnings: [message],
      errors: [],
    };
  }

  const message = `${file.name} 格式暂不支持。`;
  return {
    questions: [],
    files: [
      createFileReport({
        name: file.name,
        extension: extension || 'unknown',
        size: file.size,
        status: 'warning',
        message,
        warnings: [message],
      }),
    ],
    warnings: [message],
    errors: [],
  };
}

export async function parseFiles(files: File[]): Promise<ParseResult> {
  const settled = await Promise.all(files.map((file) => parseFile(file)));
  return settled.reduce<ParseResult>(
    (acc, item) => ({
      questions: [...acc.questions, ...item.questions],
      files: [...acc.files, ...item.files],
      warnings: [...acc.warnings, ...item.warnings],
      errors: [...acc.errors, ...item.errors],
    }),
    { questions: [], files: [], warnings: [], errors: [] },
  );
}
