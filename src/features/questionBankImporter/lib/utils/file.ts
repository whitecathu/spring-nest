export function getExtension(name: string): string {
  const clean = name.split('?')[0] ?? name;
  const last = clean.split('.').pop();
  return last && last !== clean ? last.toLowerCase() : '';
}

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function isHiddenArchivePath(path: string): boolean {
  const normalized = path.replaceAll('\\', '/');
  if (normalized.startsWith('__MACOSX/')) return true;
  return normalized.split('/').some((part) => part.startsWith('.'));
}

export function getArchiveDepth(path: string): number {
  return path.replaceAll('\\', '/').split('/').filter(Boolean).length;
}
