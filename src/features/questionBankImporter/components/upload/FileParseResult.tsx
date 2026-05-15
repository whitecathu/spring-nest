import { Download, FilePlus2, ListChecks, Play } from 'lucide-react';
import type { ImportedFileReport } from '../../types/question';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';
import { FileTree } from './FileTree';

interface FileParseResultProps {
  files: ImportedFileReport[];
  questionCount: number;
  onBank: () => void;
  onReview: () => void;
  onImportMore: () => void;
  onExport: () => void;
}

export function FileParseResult({
  files,
  questionCount,
  onBank,
  onReview,
  onImportMore,
  onExport,
}: FileParseResultProps) {
  const parsed = files.filter(
    (file) => file.status === 'success' || file.status === 'warning',
  ).length;
  const skipped = files.filter((file) => file.status === 'error').length;
  const added = files.reduce((sum, file) => sum + file.questionCount, 0);

  return (
    <GlassCard className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">导入结果</p>
          <h3 className="mt-1 text-2xl font-bold text-[var(--color-ink)]">
            {questionCount} 道题已在题库中
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[var(--color-primary-soft)] px-3 py-2">
            <p className="text-lg font-bold text-[var(--color-primary)]">{files.length}</p>
            <p className="text-xs text-[var(--color-muted)]">文件</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-success-soft)] px-3 py-2">
            <p className="text-lg font-bold text-[var(--color-success)]">{parsed}</p>
            <p className="text-xs text-[var(--color-muted)]">解析</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-warning-soft)] px-3 py-2">
            <p className="text-lg font-bold text-[var(--color-warning)]">{skipped}</p>
            <p className="text-xs text-[var(--color-muted)]">跳过</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[color:rgb(255_255_255_/_0.48)] p-3 text-sm text-[var(--color-muted)]">
        本次识别新增题目约 {added} 道，warning 会保留在文件树中，方便后续补充后端解析。
      </div>

      <FileTree files={files} />

      <div className="flex flex-wrap gap-2">
        <SoftButton
          variant="primary"
          icon={<ListChecks size={17} aria-hidden="true" />}
          onClick={onBank}
        >
          查看题库
        </SoftButton>
        <SoftButton
          icon={<Play size={17} aria-hidden="true" />}
          onClick={onReview}
          disabled={!questionCount}
        >
          开始复习
        </SoftButton>
        <SoftButton icon={<FilePlus2 size={17} aria-hidden="true" />} onClick={onImportMore}>
          继续导入
        </SoftButton>
        <SoftButton
          icon={<Download size={17} aria-hidden="true" />}
          onClick={onExport}
          disabled={!questionCount}
        >
          导出 JSON
        </SoftButton>
      </div>
    </GlassCard>
  );
}
