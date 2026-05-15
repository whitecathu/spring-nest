export const DEFAULT_DOCUMENT_MAX_SIZE = 25 * 1024 * 1024;

export type FileValidationOptions = {
  extensions: string[];
  maxSize?: number;
  emptyMessage?: string;
  sizeMessage?: (maxSizeLabel: string) => string;
  typeMessage?: (extensionsLabel: string) => string;
};

export type FileValidationResult =
  | { valid: true; extension: string }
  | { valid: false; error: string };

export function getFileExtension(fileName: string): string {
  const cleanName = fileName.trim().toLowerCase();
  const dotIndex = cleanName.lastIndexOf('.');
  return dotIndex >= 0 ? cleanName.slice(dotIndex + 1) : '';
}

export function getFileStem(fileName: string): string {
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf('.');
  const stem = dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed;
  return stem.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'spring-nest-document';
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  const fractionDigits = unitIndex === 0 || value >= 10 ? 0 : 1;
  const formatted = value.toFixed(fractionDigits).replace(/\.0$/, '');
  return `${formatted} ${units[unitIndex]}`;
}

export function validateFile(
  file: File | null,
  options: FileValidationOptions,
): FileValidationResult {
  if (!file) {
    return { valid: false, error: '请选择一个文件。' };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: options.emptyMessage ?? '文件为空，请选择包含内容的文件。',
    };
  }

  const maxSize = options.maxSize ?? DEFAULT_DOCUMENT_MAX_SIZE;
  if (file.size > maxSize) {
    return {
      valid: false,
      error:
        options.sizeMessage?.(formatFileSize(maxSize)) ??
        `文件过大，请选择不超过 ${formatFileSize(maxSize)} 的文件。`,
    };
  }

  const extension = getFileExtension(file.name);
  const allowedExtensions = options.extensions.map((item) => item.toLowerCase());
  if (!allowedExtensions.includes(extension)) {
    const extensionsLabel = allowedExtensions.map((item) => `.${item}`).join(' / ');
    return {
      valid: false,
      error:
        options.typeMessage?.(extensionsLabel) ??
        `文件格式不正确，请选择 ${extensionsLabel} 文件。`,
    };
  }

  return { valid: true, extension };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
