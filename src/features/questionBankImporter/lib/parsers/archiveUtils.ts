import {
  archiveReadableExtensions,
  backendRequiredExtensions,
  placeholderExtensions,
} from '../../config/supportedFormats';
import type { ImportedFileReport } from '../../types/question';
import { getExtension } from '../utils/file';
import { parseCsv } from './parseCsv';
import { parseJson } from './parseJson';
import { parseMarkdown } from './parseMarkdown';
import { parseText } from './parseText';
import { decodeQuestionText } from './textEncoding';
import { parseWordDocument } from './parseWord';
import { createFileReport, type ParserContext, type ParserOutput } from './types';

export type ArchiveNode = ImportedFileReport & { children?: ArchiveNode[] };

export function addToArchiveTree(root: ArchiveNode, path: string, report: ImportedFileReport) {
  const parts = path.split('/').filter(Boolean);
  let cursor = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const partialPath = parts.slice(0, index + 1).join('/');
    const existing = cursor.children?.find(
      (child) => child.name === parts[index] && child.extension === 'folder',
    );
    if (existing) {
      cursor = existing;
      continue;
    }
    const folder: ArchiveNode = {
      id: `folder-${partialPath}`,
      name: parts[index],
      path: partialPath,
      extension: 'folder',
      size: 0,
      status: 'success',
      questionCount: 0,
      warnings: [],
      children: [],
    };
    cursor.children = cursor.children ?? [];
    cursor.children.push(folder);
    cursor = folder;
  }
  cursor.children = cursor.children ?? [];
  cursor.children.push(report);
}

export function summarizeArchiveTree(node: ArchiveNode): number {
  const childTotal = (node.children ?? []).reduce(
    (sum, child) => sum + summarizeArchiveTree(child),
    0,
  );
  node.questionCount += childTotal;
  if (node.children?.some((child) => child.status === 'error')) {
    node.status = node.questionCount > 0 ? 'warning' : 'error';
  } else if (node.children?.some((child) => child.status === 'warning')) {
    node.status = 'warning';
  }
  return node.questionCount;
}

export function createUnsupportedArchiveReport(input: {
  archiveKind: 'ZIP' | 'RAR';
  path: string;
  extension: string;
  size: number;
}) {
  const extensionLabel = input.extension || 'unknown';
  const message = `暂不支持 ${input.archiveKind} 内的 .${extensionLabel} 文件。`;
  return {
    report: createFileReport({
      name: input.path.split('/').pop() ?? input.path,
      path: input.path,
      extension: extensionLabel,
      size: input.size,
      status: 'warning',
      message,
      warnings: [message],
    }),
    message,
  };
}

export function createBackendRequiredArchiveReport(input: {
  path: string;
  extension: string;
  size: number;
}) {
  const message = `${input.extension.toUpperCase()} 当前需要后端解析服务支持。`;
  return {
    report: createFileReport({
      name: input.path.split('/').pop() ?? input.path,
      path: input.path,
      extension: input.extension,
      size: input.size,
      status: 'warning',
      message,
      warnings: [message],
    }),
    message,
  };
}

export function createPlaceholderArchiveReport(input: {
  path: string;
  extension: string;
  size: number;
}) {
  const message = `${input.extension.toUpperCase()} 当前建议后端解析，浏览器端仅保留 adapter。`;
  return {
    report: createFileReport({
      name: input.path.split('/').pop() ?? input.path,
      path: input.path,
      extension: input.extension,
      size: input.size,
      status: 'warning',
      message,
      warnings: [message],
    }),
    message,
  };
}

export function defaultTagsFromArchivePath(path: string): string[] {
  const fileName = path.split('/').pop() ?? path;
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const tag = baseName
    .replace(/^修订/, '')
    .replace(/题库|习题|练习题|知识点|补充/g, '')
    .replace(/[+_]+/g, ' ')
    .trim();
  return tag ? [tag] : [];
}

export async function parseArchiveEntryData(input: {
  data: ArrayBuffer | Uint8Array;
  extension: string;
  context: ParserContext;
}): Promise<ParserOutput> {
  if (input.extension === 'doc' || input.extension === 'docx') {
    return parseWordDocument(input.data, input.context, input.extension);
  }

  const decoded = decodeQuestionText(input.data);
  const parsed =
    input.extension === 'json'
      ? parseJson(decoded.text, input.context)
      : input.extension === 'csv'
        ? parseCsv(decoded.text, input.context)
        : input.extension === 'md'
          ? parseMarkdown(decoded.text, input.context)
          : parseText(decoded.text, input.context);

  return {
    questions: parsed.questions,
    warnings: decoded.warning ? [decoded.warning, ...parsed.warnings] : parsed.warnings,
  };
}

export function getArchiveEntrySupport(extension: string) {
  if (backendRequiredExtensions.has(extension)) return 'backend';
  if (placeholderExtensions.has(extension)) return 'placeholder';
  if (!archiveReadableExtensions.has(extension) || extension === 'zip' || extension === 'rar')
    return 'unsupported';
  return 'readable';
}

export function getReportExtension(path: string): string {
  return getExtension(path) || 'unknown';
}
