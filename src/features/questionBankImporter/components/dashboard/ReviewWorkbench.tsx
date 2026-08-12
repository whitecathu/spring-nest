import {
  AlertTriangle,
  BookOpen,
  Brain,
  Clock3,
  FileUp,
  History,
  Layers,
  ListChecks,
  Play,
  Shuffle,
  Star,
  Target,
} from 'lucide-react';
import { useMemo } from 'react';
import { getReviewWorkbenchSummary } from '../../lib/reviewQueues';
import { getQuestionTypeLabel, useQuestionBankStore } from '../../store/questionBankStore';
import type { Question, QuestionType } from '../../types/question';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';

function idsOf<T extends { id: string }>(items: T[]) {
  return items.map((item) => item.id);
}

const questionTypes: QuestionType[] = [
  'single',
  'multiple',
  'judge',
  'blank',
  'short',
  'flashcard',
];

function getTypeEntries(questions: Question[]) {
  return questionTypes
    .map((type) => {
      const typedQuestions = questions.filter((question) => question.type === type);
      return {
        type,
        label: getQuestionTypeLabel(type),
        questions: typedQuestions,
        ids: idsOf(typedQuestions),
        count: typedQuestions.length,
      };
    })
    .filter((entry) => entry.count > 0);
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
    <div className={`rounded-[1.25rem] p-3 md:p-4 ${toneClass}`}>
      <p className="text-xl font-black md:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs font-semibold opacity-80 md:mt-1">{label}</p>
    </div>
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
  const typeEntries = useMemo(() => getTypeEntries(questions), [questions]);

  if (!questions.length) {
    return (
      <div className="space-y-4 md:space-y-5">
        <section className="rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[var(--color-card)] p-4 shadow-soft md:p-7">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--color-primary)]">复习工作台</p>
            <h1 className="mt-2 text-xl font-black leading-tight text-[var(--color-ink)] md:text-4xl">
              先放进题库，再开始复习
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)] md:mt-3 md:text-base">
              文件、粘贴文本和内置题库都会先在本地预览。确认无误后，再进入刷题、背答案和错题重练。
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:mt-5 md:flex">
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

        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          <GlassCard className="w-[72vw] shrink-0 snap-start sm:w-64 md:w-auto">
            <FileUp className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-[var(--color-ink)] md:mt-3 md:text-lg">
              先预览
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)] md:mt-2">
              导入前可以检查题干、答案和解析，减少脏数据进入题库。
            </p>
          </GlassCard>
          <GlassCard className="w-[72vw] shrink-0 snap-start sm:w-64 md:w-auto">
            <Brain className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-[var(--color-ink)] md:mt-3 md:text-lg">
              再回忆
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)] md:mt-2">
              支持刷题、背答案和解析浏览，数据保存在浏览器本地。
            </p>
          </GlassCard>
          <GlassCard className="w-[72vw] shrink-0 snap-start sm:w-64 md:w-auto">
            <AlertTriangle className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-[var(--color-ink)] md:mt-3 md:text-lg">
              错题回流
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)] md:mt-2">
              模糊、重来和答错的题会进入更靠前的位置，方便短时间补弱。
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[var(--color-card)] p-4 shadow-soft md:p-7">
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
              <Target size={14} aria-hidden="true" />
              {summary.actionLabel}
            </div>
            <h1 className="mt-2 text-xl font-black leading-tight text-[var(--color-ink)] md:mt-3 md:text-4xl">
              复习工作台
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)] md:mt-3 md:text-base">
              继续上次、抽查一组，或把错题和薄弱题拉出来重练。
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 md:mt-5 md:grid-cols-4">
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

          <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:gap-3">
            <MetricTile label="题库总数" value={questions.length} tone="primary" />
            <MetricTile label="未复习" value={summary.unreviewedCount} />
            <MetricTile label="错题" value={summary.wrongQuestions.length} tone="danger" />
            <MetricTile label="平均掌握" value={`${summary.averageMastery}%`} tone="warning" />
          </div>
        </div>
      </section>

      {typeEntries.length ? (
        <section className="rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[var(--color-card)] p-4 shadow-soft md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Layers size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[var(--color-ink)]">按题型复习与学习</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  只抽取指定题型开始刷题，也可以切到背答案模式集中学习。
                </p>
              </div>
            </div>
            <span className="self-start rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)] md:self-auto">
              {typeEntries.length} 类题型
            </span>
          </div>

          <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
            {typeEntries.map((entry) => (
              <div
                key={entry.type}
                className="w-[76vw] shrink-0 snap-start rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] p-4 sm:w-72 md:w-auto"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[var(--color-ink)]">{entry.label}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{entry.count} 题可用</p>
                  </div>
                  <span className="rounded-full bg-[var(--color-accent-yellow)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink)]">
                    题型
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <SoftButton
                    className="w-full px-3"
                    aria-label={`${entry.label}复习`}
                    icon={<Play size={16} aria-hidden="true" />}
                    onClick={() => actions.startReview(entry.ids, 'quiz')}
                  >
                    复习
                  </SoftButton>
                  <SoftButton
                    className="w-full px-3"
                    variant="primary"
                    aria-label={`${entry.label}学习`}
                    icon={<Brain size={16} aria-hidden="true" />}
                    onClick={() => actions.startReview(entry.ids, 'memorize')}
                  >
                    学习
                  </SoftButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          <GlassCard className="w-[72vw] shrink-0 snap-start sm:w-64 md:w-auto">
            <AlertTriangle className="text-[var(--color-error)]" size={20} aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-[var(--color-ink)] md:mt-3 md:text-lg">
              错题重练
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)] md:mt-2">
              {summary.wrongQuestions.length} 题需要回看。
            </p>
            <SoftButton
              className="mt-3 w-full md:mt-4"
              onClick={() => actions.startReview(wrongIds, 'quiz')}
              disabled={!wrongIds.length}
            >
              错题重练
            </SoftButton>
          </GlassCard>

          <GlassCard className="w-[72vw] shrink-0 snap-start sm:w-64 md:w-auto">
            <Target className="text-[var(--color-warning)]" size={20} aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-[var(--color-ink)] md:mt-3 md:text-lg">
              薄弱题
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)] md:mt-2">
              {summary.weakQuestions.length} 题掌握度偏低。
            </p>
            <SoftButton
              className="mt-3 w-full md:mt-4"
              onClick={() => actions.startReview(weakIds, 'memorize')}
              disabled={!weakIds.length}
            >
              背答案
            </SoftButton>
          </GlassCard>

          <GlassCard className="w-[72vw] shrink-0 snap-start sm:w-64 md:w-auto">
            <Star className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-[var(--color-ink)] md:mt-3 md:text-lg">
              收藏题
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)] md:mt-2">
              {summary.favoriteQuestions.length} 题已收藏。
            </p>
            <SoftButton
              className="mt-3 w-full md:mt-4"
              onClick={() => actions.startReview(favoriteIds, 'analysis')}
              disabled={!favoriteIds.length}
            >
              看解析
            </SoftButton>
          </GlassCard>

          <GlassCard className="w-[72vw] shrink-0 snap-start sm:w-64 md:w-auto">
            <Clock3 className="text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-[var(--color-ink)] md:mt-3 md:text-lg">
              考前速刷
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)] md:mt-2">
              {frequentWrongIds.length || wrongIds.length || suggestedIds.length} 题优先抽查。
            </p>
            <SoftButton
              className="mt-3 w-full md:mt-4"
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
          <div className="mt-3 space-y-2 md:mt-4 md:space-y-3">
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

      {/* 手机端：参考信息改为横向滚动 */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        <GlassCard className="w-[75vw] shrink-0 snap-start sm:w-72 md:w-auto">
          <h2 className="text-base font-bold text-[var(--color-ink)] md:text-lg">使用方法</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)] md:mt-2">
            先导入题库，确认后回到工作台，选择开始复习、快速抽查或错题重练。
          </p>
        </GlassCard>
        <GlassCard className="w-[75vw] shrink-0 snap-start sm:w-72 md:w-auto">
          <h2 className="text-base font-bold text-[var(--color-ink)] md:text-lg">常见问题</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)] md:mt-2">
            数据保存在浏览器本地。更换设备前可在设置里导出 JSON 备份。
          </p>
        </GlassCard>
        <GlassCard className="w-[75vw] shrink-0 snap-start sm:w-72 md:w-auto">
          <h2 className="text-base font-bold text-[var(--color-ink)] md:text-lg">相关入口</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)] md:mt-2">
            题库页搜索编辑，错题页集中重练，设置页导出备份。
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
