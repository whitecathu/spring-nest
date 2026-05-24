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
      id="question-bank-upload-entry"
      className={`rounded-[1.5rem] border border-dashed p-4 transition duration-200 md:rounded-[2rem] md:border-2 md:p-8 ${
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
        className="hidden"
        type="file"
        multiple
        accept=".txt,.md,.csv,.json,.zip,.rar,.doc,.docx"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.currentTarget.value = '';
        }}
      />
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3 md:gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] md:size-14 md:rounded-3xl">
            <FileUp size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-7 text-[var(--color-ink)] md:text-3xl">
              选择题库文件
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)] md:text-base">
              手机上点按钮选择文件；桌面端也可以拖入 TXT、Markdown、CSV、JSON、Word 或压缩包。
            </p>
          </div>
        </div>
        <SoftButton
          variant="primary"
          disabled={disabled}
          icon={<FileUp size={18} aria-hidden="true" />}
          onClick={() => inputRef.current?.click()}
        >
          选择题库文件
        </SoftButton>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {browserFormats.map((format) => (
          <span
            key={format.extension}
            className="rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]"
            title={format.description}
          >
            {format.extension}
          </span>
        ))}
      </div>

      <div className="mt-5 flex min-w-0 items-start gap-2 rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-primary)]">
        <ShieldCheck size={18} aria-hidden="true" />
        <span className="min-w-0 break-words">
          文件默认在本地浏览器解析；Excel、PDF 和 7Z 请先转为支持格式或接入后端解析。
        </span>
      </div>
    </div>
  );
}
const browserFormats = supportedFormats.filter((format) => format.level !== 'backend-required');
