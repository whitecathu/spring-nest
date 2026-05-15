import type { ArcFile, FileHeader } from 'node-unrar-js/esm/index.esm';
import unrarWasmUrl from 'node-unrar-js/esm/js/unrar.wasm?url';
import { appConfig } from '../../config/appConfig';
import type { ImportedFileReport, Question } from '../../types/question';
import { getArchiveDepth, getExtension, isHiddenArchivePath } from '../utils/file';
import { validateArchiveEntrySize, validateArchiveExpandedSize } from '../utils/validation';
import {
  addToArchiveTree,
  createBackendRequiredArchiveReport,
  createUnsupportedArchiveReport,
  defaultTagsFromArchivePath,
  getArchiveEntrySupport,
  parseArchiveEntryData,
  summarizeArchiveTree,
  type ArchiveNode,
} from './archiveUtils';
import { createFileReport } from './types';

interface RarParseOutput {
  questions: Question[];
  report: ImportedFileReport;
  warnings: string[];
  errors: string[];
}

interface RarEntryCandidate {
  header: FileHeader;
  normalizedPath: string;
  extension: string;
  size: number;
}

type RarExtractor = {
  getFileList: () => { fileHeaders: Generator<FileHeader> };
  extract: (options?: { files?: (fileHeader: FileHeader) => boolean }) => {
    files: Generator<ArcFile<Uint8Array>>;
  };
};

let wasmBinaryPromise: Promise<ArrayBuffer> | undefined;

function loadWasmBinary(): Promise<ArrayBuffer> {
  wasmBinaryPromise =
    wasmBinaryPromise ??
    fetch(unrarWasmUrl).then((response) => {
      if (!response.ok) throw new Error(`unrar wasm 加载失败：${response.status}`);
      return response.arrayBuffer();
    });
  return wasmBinaryPromise;
}

function archiveErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '未知错误';
}

function createRootReport(file: File): ArchiveNode {
  return createFileReport({
    name: file.name,
    extension: 'rar',
    size: file.size,
    status: 'parsing',
    message: '正在解压 RAR 文件树。',
    children: [],
  });
}

export async function parseRar(file: File): Promise<RarParseOutput> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const questions: Question[] = [];
  const root = createRootReport(file);

  let extractor: RarExtractor;
  let fileHeaders: FileHeader[];
  try {
    const { createExtractorFromData } = await import('node-unrar-js/esm/index.esm');
    extractor = await createExtractorFromData({
      data: await file.arrayBuffer(),
      wasmBinary: await loadWasmBinary(),
    });
    fileHeaders = [...extractor.getFileList().fileHeaders];
  } catch (error) {
    const message = `RAR 解压失败：${archiveErrorMessage(error)}`;
    return {
      questions,
      report: { ...root, status: 'error', message, warnings: [message] },
      warnings: [message],
      errors: [message],
    };
  }

  const entries = fileHeaders.filter((entry) => !entry.flags.directory);
  const visibleEntries = entries.filter((entry) => !isHiddenArchivePath(entry.name));

  if (!visibleEntries.length) {
    const message = entries.length ? 'RAR 仅包含隐藏文件，未发现可解析内容。' : 'RAR 为空。';
    return {
      questions,
      report: { ...root, status: 'warning', message, warnings: [message] },
      warnings: [message],
      errors,
    };
  }

  if (visibleEntries.length > appConfig.maxFilesInArchive) {
    const message = `RAR 内文件数 ${visibleEntries.length} 超过限制 ${appConfig.maxFilesInArchive}，已停止解析。`;
    return {
      questions,
      report: { ...root, status: 'error', message, warnings: [message] },
      warnings,
      errors: [message],
    };
  }

  const totalExpandedError = validateArchiveExpandedSize(
    visibleEntries.reduce((total, entry) => total + (entry.unpSize ?? 0), 0),
  );
  if (totalExpandedError) {
    return {
      questions,
      report: {
        ...root,
        status: 'error',
        message: totalExpandedError,
        warnings: [totalExpandedError],
      },
      warnings: [totalExpandedError],
      errors: [totalExpandedError],
    };
  }

  const seenPaths = new Set<string>();
  const candidates: RarEntryCandidate[] = [];

  for (const entry of visibleEntries) {
    const normalizedPath = entry.name.replaceAll('\\', '/');
    const extension = getExtension(normalizedPath);
    const size = entry.unpSize ?? 0;
    const duplicate = seenPaths.has(normalizedPath.toLowerCase());
    seenPaths.add(normalizedPath.toLowerCase());

    if (getArchiveDepth(normalizedPath) > appConfig.maxZipDepth) {
      const message = `层级超过 ${appConfig.maxZipDepth}：${normalizedPath}`;
      addToArchiveTree(
        root,
        normalizedPath,
        createFileReport({
          name: normalizedPath.split('/').pop() ?? normalizedPath,
          path: normalizedPath,
          extension,
          size,
          status: 'error',
          message,
          warnings: [message],
        }),
      );
      errors.push(message);
      continue;
    }

    if (duplicate) {
      warnings.push(`检测到重复路径：${normalizedPath}`);
    }

    const sizeError = validateArchiveEntrySize(normalizedPath, size);
    if (sizeError) {
      addToArchiveTree(
        root,
        normalizedPath,
        createFileReport({
          name: normalizedPath.split('/').pop() ?? normalizedPath,
          path: normalizedPath,
          extension,
          size,
          status: 'error',
          message: sizeError,
          warnings: [sizeError],
        }),
      );
      errors.push(sizeError);
      continue;
    }

    const support = getArchiveEntrySupport(extension);
    if (support === 'backend') {
      const { report, message } = createBackendRequiredArchiveReport({
        path: normalizedPath,
        extension,
        size,
      });
      addToArchiveTree(root, normalizedPath, report);
      warnings.push(`${normalizedPath}: ${message}`);
      continue;
    }

    if (support === 'unsupported') {
      const { report, message } = createUnsupportedArchiveReport({
        archiveKind: 'RAR',
        path: normalizedPath,
        extension,
        size,
      });
      addToArchiveTree(root, normalizedPath, report);
      warnings.push(`${normalizedPath}: ${message}`);
      continue;
    }

    candidates.push({ header: entry, normalizedPath, extension, size });
  }

  const candidatesByName = new Map<string, RarEntryCandidate[]>();
  for (const candidate of candidates) {
    const existing = candidatesByName.get(candidate.header.name) ?? [];
    existing.push(candidate);
    candidatesByName.set(candidate.header.name, existing);
  }

  let extractedFiles: Array<ArcFile<Uint8Array>> = [];
  if (candidates.length) {
    try {
      extractedFiles = [
        ...extractor.extract({
          files: (fileHeader) => candidatesByName.has(fileHeader.name),
        }).files,
      ];
    } catch (error) {
      const message = `RAR 解压失败：${archiveErrorMessage(error)}`;
      errors.push(message);
      root.status = 'error';
      root.message = message;
      root.warnings = [...new Set([...warnings, message])];
      return {
        questions,
        report: root,
        warnings: root.warnings,
        errors,
      };
    }
  }

  for (const entry of extractedFiles) {
    const queuedCandidates = candidatesByName.get(entry.fileHeader.name);
    const candidate = queuedCandidates?.shift();
    if (!candidate) continue;

    const { normalizedPath, extension, size } = candidate;

    if (!entry.extraction) {
      const message = `RAR 条目未能解压：${normalizedPath}`;
      errors.push(message);
      addToArchiveTree(
        root,
        normalizedPath,
        createFileReport({
          name: normalizedPath.split('/').pop() ?? normalizedPath,
          path: normalizedPath,
          extension,
          size,
          status: 'error',
          message,
          warnings: [message],
        }),
      );
      continue;
    }

    try {
      const result = await parseArchiveEntryData({
        data: entry.extraction,
        extension,
        context: {
          sourceFile: file.name,
          sourcePath: normalizedPath,
          defaultTags: defaultTagsFromArchivePath(normalizedPath),
        },
      });
      questions.push(...result.questions);
      warnings.push(...result.warnings.map((warning) => `${normalizedPath}: ${warning}`));
      addToArchiveTree(
        root,
        normalizedPath,
        createFileReport({
          name: normalizedPath.split('/').pop() ?? normalizedPath,
          path: normalizedPath,
          extension,
          size,
          status: result.questions.length
            ? result.warnings.length
              ? 'warning'
              : 'success'
            : 'warning',
          message: result.questions.length ? '解析完成' : '未识别出题目',
          questionCount: result.questions.length,
          warnings: result.warnings,
        }),
      );
    } catch (error) {
      const message = `解析失败：${archiveErrorMessage(error)}`;
      errors.push(`${normalizedPath}: ${message}`);
      addToArchiveTree(
        root,
        normalizedPath,
        createFileReport({
          name: normalizedPath.split('/').pop() ?? normalizedPath,
          path: normalizedPath,
          extension,
          size,
          status: 'error',
          message,
          warnings: [message],
        }),
      );
    }
  }

  summarizeArchiveTree(root);
  root.status = errors.length
    ? questions.length
      ? 'warning'
      : 'error'
    : warnings.length
      ? 'warning'
      : 'success';
  root.message = questions.length
    ? `RAR 解析完成，新增 ${questions.length} 题。`
    : 'RAR 未解析出题目。';
  root.warnings = [...new Set(warnings)];
  root.questionCount = questions.length;

  return {
    questions,
    report: root,
    warnings: [...new Set(warnings)],
    errors,
  };
}
