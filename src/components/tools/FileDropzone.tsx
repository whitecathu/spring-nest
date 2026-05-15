import { useRef, useState, type DragEvent } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { formatFileSize } from '../../lib/documentFiles';

type FileDropzoneProps = {
  id: string;
  accept: string;
  file: File | null;
  title: string;
  description: string;
  browseLabel: string;
  selectedLabel: string;
  clearLabel: string;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
};

export default function FileDropzone({
  id,
  accept,
  file,
  title,
  description,
  browseLabel,
  selectedLabel,
  clearLabel,
  disabled = false,
  onSelect,
  onClear,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pickFile = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    const nextFile = files?.[0];
    if (nextFile) onSelect(nextFile);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrag = (event: DragEvent<HTMLDivElement>, dragging: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(dragging);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!disabled) handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      onDragEnter={(event) => handleDrag(event, true)}
      onDragOver={(event) => handleDrag(event, true)}
      onDragLeave={(event) => handleDrag(event, false)}
      onDrop={handleDrop}
      className={`rounded-3xl border border-dashed p-5 transition-all ${
        isDragging
          ? 'border-primary bg-primary-container/30 shadow-[0_12px_30px_rgba(63,103,81,0.16)]'
          : 'border-surface-variant/60 bg-surface-container-low'
      } ${disabled ? 'opacity-70' : ''}`}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => handleFiles(event.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {file ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-surface-container">
              <FileText className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {selectedLabel}
              </p>
              <p className="truncate font-semibold text-on-surface">{file.name}</p>
              <p className="mt-1 text-sm text-secondary">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pickFile}
              disabled={disabled}
              className="min-h-[48px] rounded-xl bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-container/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-container"
            >
              {browseLabel}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/20 dark:text-red-300"
              aria-label={clearLabel}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-surface-container">
            <Upload className="h-8 w-8" />
          </div>
          <p className="text-lg font-bold text-on-surface">{title}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">{description}</p>
          <button
            type="button"
            onClick={pickFile}
            disabled={disabled}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary shadow-md transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {browseLabel}
          </button>
        </div>
      )}
    </div>
  );
}
