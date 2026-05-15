import { BookOpenCheck, Brain, Database, Download, FileArchive, Sparkles } from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { bundledMaoQuestionBank } from '../../data/bundledQuestionBank';
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
        <GlassCard className="overflow-hidden bg-[linear-gradient(135deg,rgb(223_243_231_/_0.9),rgb(253_249_240_/_0.9)_54%,rgb(249_228_183_/_0.72))]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[color:rgb(255_255_255_/_0.72)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                <BookOpenCheck size={15} aria-hidden="true" />
                真实题库已内置
              </div>
              <h2 className="text-2xl font-bold leading-8 text-[var(--color-ink)]">
                {bundledMaoQuestionBank.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                {bundledMaoQuestionBank.description} 支持直接解析 RAR、兼容式 DOC 和
                DOCX，导入后可搜索、刷题、背答案和加入错题本。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <SoftButton
                variant="primary"
                icon={<Download size={17} aria-hidden="true" />}
                onClick={actions.loadBundledMaoBank}
                disabled={isParsing}
              >
                导入毛概题库
              </SoftButton>
              <SoftButton
                icon={<Brain size={17} aria-hidden="true" />}
                onClick={() => actions.startReview(undefined, 'memorize')}
                disabled={!questions.length}
              >
                背答案
              </SoftButton>
            </div>
          </div>
        </GlassCard>

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
            description="可先导入内置毛概题库，或拖拽 txt、md、csv、json、zip、rar、doc、docx 到上传区。"
            actionLabel="导入内置题库"
            onAction={actions.loadBundledMaoBank}
            icon={<BookOpenCheck size={22} aria-hidden="true" />}
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

        <div className="grid gap-2">
          <SoftButton
            className="w-full"
            onClick={actions.loadBundledMaoBank}
            icon={<Download size={17} />}
          >
            导入 2024 修订版毛概题库
          </SoftButton>
        </div>
      </aside>
    </div>
  );
}
