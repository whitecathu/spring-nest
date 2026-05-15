import { FileText, Folder, TriangleAlert } from 'lucide-react';
import type { ImportedFileReport } from '../../types/question';
import { formatFileSize } from '../../lib/utils/file';

interface FileTreeProps {
  files: ImportedFileReport[];
}

function statusClass(status: ImportedFileReport['status']) {
  if (status === 'success') return 'bg-[var(--color-success-soft)] text-[var(--color-success)]';
  if (status === 'error') return 'bg-[var(--color-error-soft)] text-[var(--color-error)]';
  if (status === 'warning') return 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]';
  return 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]';
}

function FileNode({ file, depth = 0 }: { file: ImportedFileReport; depth?: number }) {
  const hasChildren = Boolean(file.children?.length);
  return (
    <li>
      <div
        className="flex flex-col gap-2 rounded-2xl border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.55)] px-3 py-3 md:flex-row md:items-center md:justify-between"
        style={{ marginLeft: depth ? Math.min(depth * 16, 48) : 0 }}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 text-[var(--color-primary)]">
            {hasChildren ? (
              <Folder size={18} aria-hidden="true" />
            ) : (
              <FileText size={18} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
              {file.path ?? file.name}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {file.extension.toUpperCase()} · {formatFileSize(file.size)} · {file.questionCount} 题
            </p>
            {file.message ? (
              <p className="mt-1 text-xs text-[var(--color-muted)]">{file.message}</p>
            ) : null}
            {file.warnings.length ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-warning)]">
                <TriangleAlert size={13} aria-hidden="true" />
                {file.warnings[0]}
              </p>
            ) : null}
          </div>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(file.status)}`}
        >
          {file.status}
        </span>
      </div>
      {file.children?.length ? (
        <ul className="mt-2 space-y-2">
          {file.children.map((child) => (
            <FileNode key={child.id} file={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FileTree({ files }: FileTreeProps) {
  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <FileNode key={file.id} file={file} />
      ))}
    </ul>
  );
}
