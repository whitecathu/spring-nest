import { appConfig } from '../../config/appConfig';
import type { Question } from '../../types/question';

function maxBytes(megabytes: number): number {
  return megabytes * 1024 * 1024;
}

export function validateFileSize(file: File): string | undefined {
  if (file.size > maxBytes(appConfig.maxFileSizeMB)) {
    return `文件超过 ${appConfig.maxFileSizeMB}MB，已跳过。`;
  }
  return undefined;
}

export function validateArchiveEntrySize(path: string, size: number): string | undefined {
  if (size > maxBytes(appConfig.maxFileSizeMB)) {
    return `${path} 解压后超过 ${appConfig.maxFileSizeMB}MB，已跳过。`;
  }
  return undefined;
}

export function validateArchiveExpandedSize(totalSize: number): string | undefined {
  if (totalSize > maxBytes(appConfig.maxArchiveExpandedSizeMB)) {
    return `压缩包解压后总大小超过 ${appConfig.maxArchiveExpandedSizeMB}MB，已停止解析。`;
  }
  return undefined;
}

export function isUsableQuestion(question: Question): boolean {
  return question.question.trim().length > 0;
}
