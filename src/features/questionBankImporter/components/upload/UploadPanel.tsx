import { Brain, Database, FileArchive, Sparkles } from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { useQuestionBankStore } from '../../store/questionBankStore';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { DragDropZone } from './DragDropZone';
import { FileParseResult } from './FileParseResult';
import { ParseProgress } from './ParseProgress';

export function UploadPanel() {
  const questions = useQuestionBankStore((state) => state.questions);
  const importedFiles = useQuestionBankStore((state) => state.importedFiles);
  const isParsing = useQuestionBankStore((state) => state.isParsing);
  const storageError = useQuestionBankStore((state) => state.storageError);
  const actions = useQuestionBankStore((state) => state.actions);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-5">
        <DragDropZone onFiles={actions.importFiles} disabled={isParsing} />
        {isParsing ? <ParseProgress /> : null}
        {storageError ? <ErrorState title="本地数据读取失败" message={storageError} /> : null}
        {importedFiles.length ? (
          <FileParseResult
            files={importedFiles}
            questionCount={questions.length}
            onBank={() => actions.setActiveView('bank')}
            onReview={() => actions.startReview()}
            onImportMore={() => actions.setActiveView('import')}
            onExport={actions.exportJson}
          />
        ) : (
          <EmptyState
            title="还没有上传文件"
            description="拖拽自己的 txt、md、csv、json、zip、rar、doc、docx 题库文件，或点击上方按钮选择文件。"
            icon={<FileArchive size={22} aria-hidden="true" />}
          />
        )}
      </div>

      <aside className="space-y-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Database size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">当前题库</p>
              <p className="text-2xl font-bold text-[var(--color-ink)]">{questions.length} 题</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[var(--color-primary-soft)] p-3">
              <p className="font-bold text-[var(--color-primary)]">{importedFiles.length}</p>
              <p className="text-[var(--color-muted)]">导入报告</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-accent-yellow)] p-3">
              <p className="font-bold text-[var(--color-ink)]">本地</p>
              <p className="text-[var(--color-muted)]">持久化</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start gap-3">
            <Brain className="mt-1 text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[var(--color-ink)]">复习入口</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                导入自己的题库后，可以直接进入背答案或刷题模式。
              </p>
              <SoftButton
                className="mt-4 w-full"
                onClick={() => actions.startReview(undefined, 'memorize')}
                disabled={!questions.length}
                icon={<Brain size={17} aria-hidden="true" />}
              >
                背答案
              </SoftButton>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--color-ink)]">真实支持范围</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                TXT、Markdown、CSV、JSON、ZIP、RAR 和 DOCX 会在浏览器端解析。DOC
                为兼容式文本抽取，Excel、PDF 保留 adapter，7Z 需要后端服务。
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start gap-3">
            <FileArchive
              className="mt-1 text-[var(--color-primary)]"
              size={20}
              aria-hidden="true"
            />
            <div>
              <h3 className="font-bold text-[var(--color-ink)]">压缩包边界</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                压缩包最多 {appConfig.maxFilesInArchive} 个文件、{appConfig.maxZipDepth}
                层目录、单文件 {appConfig.maxFileSizeMB}MB、解压总量{' '}
                {appConfig.maxArchiveExpandedSizeMB}MB。隐藏文件、过深目录和不支持格式会进入 warning
                或 error 状态。
              </p>
            </div>
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}
