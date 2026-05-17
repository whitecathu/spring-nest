import { AlertTriangle, Brain, Clock3, History, Play, Target, Upload } from 'lucide-react';
import { useMemo } from 'react';
import { getReviewWorkbenchSummary } from '../../lib/reviewQueues';
import { useQuestionBankStore } from '../../store/questionBankStore';
import { SoftButton } from '../common/SoftButton';

function metricTone(tone: 'primary' | 'warning' | 'error' | 'plain') {
  if (tone === 'primary') return 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]';
  if (tone === 'warning') return 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]';
  if (tone === 'error') return 'bg-[var(--color-error-soft)] text-[var(--color-error)]';
  return 'bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)]';
}

export function StudyCommandCenter() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const reviewPlan = useQuestionBankStore((state) => state.reviewPlan);
  const lastReviewSession = useQuestionBankStore((state) => state.lastReviewSession);
  const actions = useQuestionBankStore((state) => state.actions);
  const summary = useMemo(
    () => getReviewWorkbenchSummary(questions, reviewMeta, reviewPlan),
    [questions, reviewMeta, reviewPlan],
  );
  const canResume = Boolean(
    lastReviewSession?.questionIds.some((id) => questions.some((question) => question.id === id)),
  );
  const suggestedIds = summary.suggestedQuestions.length
    ? summary.suggestedQuestions.map((question) => question.id)
    : questions.map((question) => question.id);
  const weakIds = summary.weakQuestions.map((question) => question.id);
  const wrongIds = summary.wrongQuestions.map((question) => question.id);
  const title = summary.actionLabel;

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-outline-soft)] bg-[linear-gradient(135deg,rgb(255_255_255_/_0.88),rgb(230_244_236_/_0.86)_52%,rgb(255_246_226_/_0.74))] p-5 shadow-soft md:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
        <div className="min-w-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:rgb(20_66_45_/_0.16)] bg-[color:rgb(255_255_255_/_0.62)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            <Target size={14} aria-hidden="true" />
            建议队列
          </div>
          <h1 className="text-2xl font-black leading-tight text-[var(--color-ink)] md:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)] md:text-base">
            优先安排未复习、错过和掌握度偏低的题目。完成这一轮后，可以继续导入或整理题库。
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--color-muted)]">
              <span>
                已记录 {reviewPlan.todayAnswered} / {reviewPlan.dailyTarget}
              </span>
              <span>{summary.completionRate}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[color:rgb(20_66_45_/_0.1)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
                style={{ width: `${summary.completionRate}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <SoftButton
              variant="primary"
              icon={<Play size={17} aria-hidden="true" />}
              onClick={() => actions.startReview(suggestedIds, 'quiz')}
              disabled={!questions.length}
            >
              开始复习
            </SoftButton>
            <SoftButton
              icon={<History size={17} aria-hidden="true" />}
              onClick={actions.resumeReview}
              disabled={!canResume}
            >
              继续上次
            </SoftButton>
            <SoftButton
              icon={<AlertTriangle size={17} aria-hidden="true" />}
              onClick={() => actions.startReview(wrongIds, 'quiz')}
              disabled={!wrongIds.length}
            >
              错题重练
            </SoftButton>
            <SoftButton
              icon={<Upload size={17} aria-hidden="true" />}
              onClick={() =>
                document
                  .getElementById('question-bank-upload-entry')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              导入新题
            </SoftButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-[1.25rem] p-4 ${metricTone('primary')}`}>
            <Clock3 size={18} aria-hidden="true" />
            <p className="mt-3 text-2xl font-black">{summary.dueQuestions.length}</p>
            <p className="text-xs font-semibold opacity-80">本次推荐</p>
          </div>
          <div className={`rounded-[1.25rem] p-4 ${metricTone('plain')}`}>
            <Brain size={18} aria-hidden="true" />
            <p className="mt-3 text-2xl font-black">{summary.estimatedMinutes}</p>
            <p className="text-xs font-semibold opacity-80">预计分钟</p>
          </div>
          <button
            type="button"
            className={`rounded-[1.25rem] p-4 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${metricTone('warning')}`}
            onClick={() => actions.startReview(weakIds, 'memorize')}
            disabled={!weakIds.length}
          >
            <Target size={18} aria-hidden="true" />
            <p className="mt-3 text-2xl font-black">{summary.weakQuestions.length}</p>
            <p className="text-xs font-semibold opacity-80">薄弱题</p>
          </button>
          <button
            type="button"
            className={`rounded-[1.25rem] p-4 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${metricTone('error')}`}
            onClick={() => actions.startReview(wrongIds, 'quiz')}
            disabled={!wrongIds.length}
          >
            <AlertTriangle size={18} aria-hidden="true" />
            <p className="mt-3 text-2xl font-black">{summary.wrongQuestions.length}</p>
            <p className="text-xs font-semibold opacity-80">错题</p>
          </button>
        </div>
      </div>
    </section>
  );
}
