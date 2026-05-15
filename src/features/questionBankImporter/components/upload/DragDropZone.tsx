import { useRef, useState } from 'react';
import { FileUp, ShieldCheck } from 'lucide-react';
import { supportedFormats } from '../../config/supportedFormats';
import { SoftButton } from '../common/SoftButton';

interface DragDropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function DragDropZone({ onFiles, disabled }: DragDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    onFiles(Array.from(fileList));
  }

  return (
    <div
      className={`rounded-[2rem] border-2 border-dashed p-5 transition duration-200 md:p-8 ${
        dragging
          ? 'border-[var(--color-primary)] bg-[color:rgb(188_238_207_/_0.45)]'
          : 'border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.58)]'
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        multiple
        accept=".txt,.md,.csv,.json,.zip,.rar,.doc,.docx,.xlsx,.xls,.pdf,.7z"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-3xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <FileUp size={26} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-ink)] md:text-3xl">
              把散乱资料变成可复习题库
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)] md:text-base">
              支持多格式题库和压缩包导入，自动整理成可刷题、可搜索、可复习的学习卡片。
            </p>
          </div>
        </div>
        <SoftButton
          variant="primary"
          disabled={disabled}
          icon={<FileUp size={18} aria-hidden="true" />}
          onClick={() => inputRef.current?.click()}
        >
          选择文件
        </SoftButton>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {supportedFormats.slice(0, 9).map((format) => (
          <span
            key={format.extension}
            className="rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]"
            title={format.description}
          >
            {format.extension}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-primary)]">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>文件默认在本地浏览器解析，后续可切换到后端解析服务。</span>
      </div>
    </div>
  );
}
