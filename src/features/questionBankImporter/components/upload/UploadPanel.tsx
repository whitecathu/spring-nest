import { useRef, useState } from 'react';
import {
  Brain,
  ClipboardPaste,
  Database,
  FileArchive,
  History,
  Sparkles,
  Upload,
} from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { localQuestionBankClient } from '../../lib/api/localQuestionBankClient';
import { parseText } from '../../lib/parsers/parseText';
import { useQuestionBankStore } from '../../store/questionBankStore';
import type { ImportedFileReport, Question } from '../../types/question';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { DragDropZone } from './DragDropZone';
import { FileParseResult } from './FileParseResult';
import { ParseProgress } from './ParseProgress';

export function UploadPanel() {
  const [pastedText, setPastedText] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [previewSourceName, setPreviewSourceName] = useState('');
  const [previewSourceType, setPreviewSourceType] = useState<'paste' | 'files' | ''>('');
  const [previewReports, setPreviewReports] = useState<ImportedFileReport[]>([]);
  const [isPreviewParsing, setIsPreviewParsing] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const questions = useQuestionBankStore((state) => state.questions);
  const lastReviewSession = useQuestionBankStore((state) => state.lastReviewSession);
  const importedFiles = useQuestionBankStore((state) => state.importedFiles);
  const isParsing = useQuestionBankStore((state) => state.isParsing);
  const storageError = useQuestionBankStore((state) => state.storageError);
  const actions = useQuestionBankStore((state) => state.actions);
  const isBusy = isParsing || isPreviewParsing;
  const canPreviewPaste = pastedText.trim().length >= 8 && !isBusy;
  const canResume = Boolean(
    lastReviewSession?.questionIds.some((id) => questions.some((question) => question.id === id)),
  );

  function previewPastedText() {
    if (!canPreviewPaste) return;
    const sourceName = `粘贴题库-${new Date().toISOString().slice(0, 10)}.txt`;
    const result = parseText(pastedText, { sourceFile: sourceName });
    setPreviewSourceName(sourceName);
    setPreviewSourceType('paste');
    setPreviewReports([]);
    setPreviewQuestions(result.questions);
    setPreviewWarnings(
      result.questions.length
        ? result.warnings
        : ['未识别出可导入题目，请按示例补充题号、答案或解析。'],
    );
  }

  function updatePreviewQuestion(questionId: string, patch: Partial<Question>) {
    setPreviewQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, ...patch, updatedAt: new Date().toISOString() }
          : question,
      ),
    );
  }

  function clearPreview() {
    setPreviewQuestions([]);
    setPreviewWarnings([]);
    setPreviewSourceName('');
    setPreviewSourceType('');
    setPreviewReports([]);
  }

  async function previewFiles(files: File[]) {
    if (!files.length || isBusy) return;
    clearPreview();
    setIsPreviewParsing(true);
    const sourceName = files.length === 1 ? files[0].name : `${files.length} 个文件`;
    try {
      const result = await localQuestionBankClient.parseFiles(files);
      const notices = [...new Set([...result.errors, ...result.warnings])];
      setPreviewSourceName(sourceName);
      setPreviewSourceType('files');
      setPreviewReports(result.files);
      setPreviewQuestions(result.questions);
      setPreviewWarnings(
        result.questions.length
          ? notices
          : notices.length
            ? notices
            : ['未识别出可导入题目，请检查文件内容或转换为 TXT、CSV、JSON、DOCX 后重试。'],
      );
      if (!result.questions.length) {
        actions.importReviewedQuestions([], sourceName, notices, result.files);
      }
    } catch (error) {
      setPreviewSourceName(sourceName);
      setPreviewSourceType('files');
      setPreviewWarnings([error instanceof Error ? error.message : '文件解析失败。']);
    } finally {
      setIsPreviewParsing(false);
    }
  }

  function importPreviewQuestions() {
    actions.importReviewedQuestions(
      previewQuestions,
      previewSourceName || '粘贴题库.txt',
      previewWarnings,
      previewReports,
    );
    if (previewSourceType === 'paste') setPastedText('');
    clearPreview();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-5">
        <DragDropZone onFiles={(files) => void previewFiles(files)} disabled={isBusy} />
        <GlassCard className="space-y-4">
          <div className="flex items-start gap-3">
            <ClipboardPaste
              className="mt-1 shrink-0 text-[var(--color-primary)]"
              size={20}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[var(--color-ink)]">粘贴文本导入</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                适合从文档、网页或聊天记录中复制题目。支持题号、选项、答案、解析的常见写法。
              </p>
            </div>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]">
            题库文本
            <textarea
              value={pastedText}
              onChange={(event) => {
                setPastedText(event.target.value);
                clearPreview();
              }}
              disabled={isBusy}
              rows={6}
              className="min-h-36 resize-y rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.68)] px-4 py-3 text-sm leading-6 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgb(63_103_81_/_0.16)] disabled:opacity-60"
              placeholder={'例：1. 下列哪项正确？\nA. 选项一\nB. 选项二\n答案：A\n解析：...'}
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--color-muted)]">
              已输入 {pastedText.trim().length} 个字符，先预览并修正，再确认导入本地题库。
            </p>
            <SoftButton
              variant="primary"
              icon={<ClipboardPaste size={17} aria-hidden="true" />}
              disabled={!canPreviewPaste}
              onClick={previewPastedText}
            >
              预览识别
            </SoftButton>
          </div>
          {previewWarnings.length ? (
            <div className="space-y-1 rounded-2xl bg-[var(--color-accent-yellow)] p-3 text-xs leading-5 text-[var(--color-ink)]">
              {previewWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
          {previewQuestions.length ? (
            <div className="space-y-3 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.56)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-bold text-[var(--color-ink)]">导入预览</h4>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {previewSourceName ? `来源：${previewSourceName}。` : ''}
                    已识别 {previewQuestions.length} 题，可先修正题干、答案和解析。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SoftButton onClick={clearPreview}>取消预览</SoftButton>
                  <SoftButton variant="primary" onClick={importPreviewQuestions}>
                    确认导入
                  </SoftButton>
                </div>
              </div>
              <div className="space-y-3">
                {previewQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="space-y-3 rounded-2xl border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] p-3"
                  >
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-[var(--color-muted)]">
                        题目 {index + 1}
                      </span>
                      <textarea
                        className="min-h-20 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm leading-6 text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                        value={question.question}
                        onChange={(event) =>
                          updatePreviewQuestion(question.id, { question: event.target.value })
                        }
                      />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-[var(--color-muted)]">
                          答案
                        </span>
                        <input
                          className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                          value={
                            Array.isArray(question.answer)
                              ? question.answer.join(', ')
                              : (question.answer ?? '')
                          }
                          onChange={(event) =>
                            updatePreviewQuestion(question.id, { answer: event.target.value })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-[var(--color-muted)]">
                          解析
                        </span>
                        <textarea
                          className="min-h-20 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm leading-6 text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                          value={question.explanation ?? ''}
                          onChange={(event) =>
                            updatePreviewQuestion(question.id, {
                              explanation: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </GlassCard>
        {isBusy ? <ParseProgress /> : null}
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
                onClick={actions.resumeReview}
                disabled={!canResume}
                icon={<History size={17} aria-hidden="true" />}
              >
                继续上次复习
              </SoftButton>
              <SoftButton
                className="mt-2 w-full"
                onClick={() => actions.startReview(undefined, 'memorize')}
                disabled={!questions.length}
                icon={<Brain size={17} aria-hidden="true" />}
              >
                背答案
              </SoftButton>
              <input
                ref={backupInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void actions.importBackupJson(file);
                  event.currentTarget.value = '';
                }}
              />
              <SoftButton
                className="mt-2 w-full"
                onClick={() => backupInputRef.current?.click()}
                icon={<Upload size={17} aria-hidden="true" />}
              >
                导入备份 JSON
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
                为兼容式文本抽取；Excel、PDF 和 7Z 请先转为支持格式，或接入后端解析服务。
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
