import {
  AlertTriangle,
  BookOpen,
  Brain,
  Clock3,
  FileUp,
  History,
  ListChecks,
  Play,
  Shuffle,
  Star,
  Target,
} from 'lucide-react';
import { useMemo } from 'react';
import { getReviewWorkbenchSummary } from '../../lib/reviewQueues';
import { useQuestionBankStore } from '../../store/questionBankStore';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';

function idsOf<T extends { id: string }>(items: T[]) {
  return items.map((item) => item.id);
}

function MetricTile({
  label,
  value,
  tone = 'plain',
}: {
  label: string;
  value: string | number;
  tone?: 'plain' | 'primary' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'primary'
      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
      : tone === 'warning'
        ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
        : tone === 'danger'
          ? 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
          : 'bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)]';

  return (
    <div className={`rounded-[1.25rem] p-4 ${toneClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-80">{label}</p>
    </div>
  );
}

function WorkbenchReference() {
  return (
    <section className="grid gap-4 md:grid-cols-3" aria-label="复习小筑参考信息">
      <GlassCard>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">使用方法</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          先从导入页预览题库，确认题干和答案后写入本地，再回到工作台选择开始复习、快速抽查或错题重练。
        </p>
      </GlassCard>
      <GlassCard>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">常见问题</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          题库和复习记录保存在当前浏览器。更换设备或清理浏览器数据前，可以先在设置里导出 JSON 备份。
        </p>
      </GlassCard>
      <GlassCard>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">相关入口</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          题库页适合搜索和编辑，错题页适合集中重练，设置页用于导出备份和调整本次建议题量。
        </p>
      </GlassCard>
    </section>
  );
}

export function ReviewWorkbench() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const reviewPlan = useQuestionBankStore((state) => state.reviewPlan);
  const importedFiles = useQuestionBankStore((state) => state.importedFiles);
  const lastReviewSession = useQuestionBankStore((state) => state.lastReviewSession);
  const actions = useQuestionBankStore((state) => state.actions);
  const summary = useMemo(
    () => getReviewWorkbenchSummary(questions, reviewMeta, reviewPlan),
    [questions, reviewMeta, reviewPlan],
  );

  const canResume = Boolean(
    lastReviewSession?.questionIds.some((id) => questions.some((question) => question.id === id)),
  );
  const suggestedIds = idsOf(summary.suggestedQuestions);
  const weakIds = idsOf(summary.weakQuestions);
  const wrongIds = idsOf(summary.wrongQuestions);
  const frequentWrongIds = idsOf(summary.frequentWrongQuestions);
  const favoriteIds = idsOf(summary.favoriteQuestions);
  const recentFiles = importedFiles.slice(0, 3);

  if (!questions.length) {
    return (
      <div className="space-y-5">
        <section className="rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[var(--color-card)] p-5 shadow-soft md:p-7">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--color-primary)]">复习工作台</p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--color-ink)] md:text-4xl">
              先放进题库，再开始复习
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)] md:text-base">
              文件、粘贴文本和内置题库都会先在本地预览。确认无误后，再进入刷题、背答案和错题重练。
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <SoftButton
              variant="primary"
              icon={<FileUp size={17} aria-hidden="true" />}
              onClick={() => actions.setActiveView('import')}
            >
              选择文件
            </SoftButton>
            <SoftButton
              icon={<BookOpen size={17} aria-hidden="true" />}
              onClick={() => actions.setActiveView('import')}
            >
              粘贴题库
            </SoftButton>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard>
            <FileUp className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-ink)]">先预览</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              导入前可以检查题干、答案和解析，减少脏数据进入题库。
            </p>
          </GlassCard>
          <GlassCard>
            <Brain className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-ink)]">再回忆</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              支持刷题、背答案和解析浏览，数据保存在浏览器本地。
            </p>
          </GlassCard>
          <GlassCard>
            <AlertTriangle className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-ink)]">错题回流</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              模糊、重来和答错的题会进入更靠前的位置，方便短时间补弱。
            </p>
          </GlassCard>
        </div>
        <WorkbenchReference />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[var(--color-card)] p-5 shadow-soft md:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
              <Target size={14} aria-hidden="true" />
              {summary.actionLabel}
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight text-[var(--color-ink)] md:text-4xl">
              复习工作台
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)] md:text-base">
              直接继续上次、抽查一组题，或把错题和薄弱题拉出来重练。所有复习记录只保存在本地。
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <SoftButton
                variant="primary"
                icon={<Play size={17} aria-hidden="true" />}
                onClick={() => actions.startReview(suggestedIds, 'quiz')}
                disabled={!suggestedIds.length}
              >
                开始复习
              </SoftButton>
              <SoftButton
                icon={<Shuffle size={17} aria-hidden="true" />}
                onClick={() => actions.startReview(suggestedIds, 'quiz')}
                disabled={!suggestedIds.length}
              >
                快速抽查
              </SoftButton>
              <SoftButton
                icon={<History size={17} aria-hidden="true" />}
                onClick={actions.resumeReview}
                disabled={!canResume}
              >
                继续上次
              </SoftButton>
              <SoftButton
                icon={<FileUp size={17} aria-hidden="true" />}
                onClick={() => actions.setActiveView('import')}
              >
                导入题库
              </SoftButton>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="题库总数" value={questions.length} tone="primary" />
            <MetricTile label="未复习" value={summary.unreviewedCount} />
            <MetricTile label="错题" value={summary.wrongQuestions.length} tone="danger" />
            <MetricTile label="平均掌握" value={`${summary.averageMastery}%`} tone="warning" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard>
            <AlertTriangle className="text-[var(--color-error)]" size={20} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-ink)]">错题重练</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {summary.wrongQuestions.length} 题需要回看。
            </p>
            <SoftButton
              className="mt-4 w-full"
              onClick={() => actions.startReview(wrongIds, 'quiz')}
              disabled={!wrongIds.length}
            >
              错题重练
            </SoftButton>
          </GlassCard>

          <GlassCard>
            <Target className="text-[var(--color-warning)]" size={20} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-ink)]">薄弱题</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {summary.weakQuestions.length} 题掌握度偏低。
            </p>
            <SoftButton
              className="mt-4 w-full"
              onClick={() => actions.startReview(weakIds, 'memorize')}
              disabled={!weakIds.length}
            >
              背答案
            </SoftButton>
          </GlassCard>

          <GlassCard>
            <Star className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-ink)]">收藏题</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {summary.favoriteQuestions.length} 题已收藏。
            </p>
            <SoftButton
              className="mt-4 w-full"
              onClick={() => actions.startReview(favoriteIds, 'analysis')}
              disabled={!favoriteIds.length}
            >
              看解析
            </SoftButton>
          </GlassCard>

          <GlassCard>
            <Clock3 className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-ink)]">考前速刷</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {frequentWrongIds.length || wrongIds.length || suggestedIds.length} 题优先抽查。
            </p>
            <SoftButton
              className="mt-4 w-full"
              onClick={() =>
                actions.startReview(
                  frequentWrongIds.length
                    ? frequentWrongIds
                    : wrongIds.length
                      ? wrongIds
                      : suggestedIds,
                  'quiz',
                )
              }
              disabled={!suggestedIds.length}
            >
              速刷一轮
            </SoftButton>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center gap-3">
            <ListChecks size={20} className="text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[var(--color-ink)]">最近导入</h2>
          </div>
          <div className="mt-4 space-y-3">
            {recentFiles.length ? (
              recentFiles.map((file) => (
                <div key={file.id} className="rounded-2xl bg-[color:rgb(255_255_255_/_0.62)] p-3">
                  <p className="truncate text-sm font-bold text-[var(--color-ink)]">{file.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {file.questionCount} 题 · {file.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                暂无导入记录。导入成功后会显示在这里。
              </p>
            )}
          </div>
        </GlassCard>
      </div>
      <WorkbenchReference />
    </div>
  );
}
