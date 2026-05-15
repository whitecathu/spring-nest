import JSZip from 'jszip';
import { appConfig } from '../../config/appConfig';
import type { ImportedFileReport, Question } from '../../types/question';
import { getArchiveDepth, getExtension, isHiddenArchivePath } from '../utils/file';
import { validateArchiveEntrySize, validateArchiveExpandedSize } from '../utils/validation';
import {
  addToArchiveTree,
  createBackendRequiredArchiveReport,
  createPlaceholderArchiveReport,
  createUnsupportedArchiveReport,
  defaultTagsFromArchivePath,
  getArchiveEntrySupport,
  parseArchiveEntryData,
  summarizeArchiveTree,
  type ArchiveNode,
} from './archiveUtils';
import { createFileReport } from './types';

interface ZipParseOutput {
  questions: Question[];
  report: ImportedFileReport;
  warnings: string[];
  errors: string[];
}

function getZipEntrySize(entry: JSZip.JSZipObject): number {
  return (
    (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0
  );
}

export async function parseZip(file: File): Promise<ZipParseOutput> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const questions: Question[] = [];
  const root: ArchiveNode = createFileReport({
    name: file.name,
    extension: 'zip',
    size: file.size,
    status: 'parsing',
    message: '正在读取 ZIP 文件树。',
    children: [],
  });

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch (error) {
    const message = `ZIP 读取失败：${error instanceof Error ? error.message : '未知错误'}`;
    return {
      questions,
      report: { ...root, status: 'error', message, warnings: [message] },
      warnings: [message],
      errors: [message],
    };
  }

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const visibleEntries = entries.filter((entry) => !isHiddenArchivePath(entry.name));

  if (!visibleEntries.length) {
    const message = entries.length
      ? 'ZIP 仅包含隐藏文件或 __MACOSX，未发现可解析内容。'
      : 'ZIP 为空。';
    return {
      questions,
      report: { ...root, status: 'warning', message, warnings: [message] },
      warnings: [message],
      errors,
    };
  }

  if (visibleEntries.length > appConfig.maxFilesInArchive) {
    const message = `ZIP 内文件数 ${visibleEntries.length} 超过限制 ${appConfig.maxFilesInArchive}，已停止解析。`;
    return {
      questions,
      report: { ...root, status: 'error', message, warnings: [message] },
      warnings,
      errors: [message],
    };
  }

  const totalExpandedError = validateArchiveExpandedSize(
    visibleEntries.reduce((total, entry) => total + getZipEntrySize(entry), 0),
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

  for (const entry of visibleEntries) {
    const normalizedPath = entry.name.replaceAll('\\', '/');
    const extension = getExtension(normalizedPath);
    const size = getZipEntrySize(entry);
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

    if (support === 'placeholder') {
      const { report, message } = createPlaceholderArchiveReport({
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
        archiveKind: 'ZIP',
        path: normalizedPath,
        extension,
        size,
      });
      addToArchiveTree(root, normalizedPath, report);
      warnings.push(`${normalizedPath}: ${message}`);
      continue;
    }

    try {
      const data = await entry.async('arraybuffer');
      const result = await parseArchiveEntryData({
        data,
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
      const message = `解析失败：${error instanceof Error ? error.message : '未知错误'}`;
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
    ? `ZIP 解析完成，新增 ${questions.length} 题。`
    : 'ZIP 未解析出题目。';
  root.warnings = [...new Set(warnings)];
  root.questionCount = questions.length;

  return {
    questions,
    report: root,
    warnings: [...new Set(warnings)],
    errors,
  };
}
