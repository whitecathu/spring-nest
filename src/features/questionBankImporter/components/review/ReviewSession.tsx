import { useEffect, useMemo, useState } from 'react';
import { Brain, Check, Eye, RotateCcw, X } from 'lucide-react';
import { createReviewMeta } from '../../lib/utils/normalize';
import { getQuestionTypeLabel, useQuestionBankStore } from '../../store/questionBankStore';
import type { Question } from '../../types/question';
import { EmptyState } from '../common/EmptyState';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';
import { QuestionTypeBadge } from '../question/QuestionTypeBadge';
import { AnswerPanel } from './AnswerPanel';
import { ProgressPill } from './ProgressPill';
import { ReviewControls } from './ReviewControls';

function answerArray(answer: Question['answer']): string[] {
  if (Array.isArray(answer)) return answer.map((item) => item.trim().toUpperCase()).filter(Boolean);
  return String(answer ?? '')
    .split(/[，,、]/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function optionKey(option: string): string {
  return option.match(/^\s*([A-F])[.、)]/i)?.[1].toUpperCase() ?? option.trim();
}

function isCorrect(question: Question, selected: string[]): boolean {
  if (question.type === 'judge') {
    const expectedText = String(question.answer ?? '')
      .trim()
      .toLowerCase();
    const selectedText = selected[0]?.toLowerCase();
    const expectedTruthy = ['正确', '对', 'true', 'yes', '是'].includes(expectedText);
    const expectedFalsy = ['错误', '错', 'false', 'no', '否'].includes(expectedText);
    if (expectedTruthy)
      return selectedText === 'a' || selectedText === '正确' || selectedText === '对';
    if (expectedFalsy)
      return selectedText === 'b' || selectedText === '错误' || selectedText === '错';
  }
  const expected = answerArray(question.answer).sort();
  const actual = selected.map((item) => item.trim().toUpperCase()).sort();
  return (
    expected.length > 0 &&
    expected.length === actual.length &&
    expected.every((item, index) => item === actual[index])
  );
}

export function ReviewSession() {
  const questions = useQuestionBankStore((state) => state.questions);
  const ids = useQuestionBankStore((state) => state.currentReviewQuestionIds);
  const index = useQuestionBankStore((state) => state.currentReviewIndex);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const reviewMode = useQuestionBankStore((state) => state.reviewMode);
  const actions = useQuestionBankStore((state) => state.actions);

  const activeIds = ids.length ? ids : questions.map((question) => question.id);
  const question = useMemo(
    () => questions.find((item) => item.id === activeIds[index]) ?? questions[0],
    [activeIds, index, questions],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | undefined>(undefined);
  const [answerVisible, setAnswerVisible] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelected([]);
    setSubmitted(false);
    setCorrect(undefined);
    setAnswerVisible(false);
  }, [question?.id, reviewMode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!questions.length || !question) {
    return (
      <EmptyState
        title="还没有可复习的题目"
        description="先导入题库或内置题库，再开始复习。"
        actionLabel="去导入"
        onAction={() => actions.setActiveView('import')}
      />
    );
  }

  const meta = reviewMeta[question.id] ?? createReviewMeta(question.id);
  const total = activeIds.length || questions.length;
  const expected = answerArray(question.answer);
  const isChoice =
    question.type === 'single' || question.type === 'multiple' || question.type === 'judge';
  const isMemorize = reviewMode === 'memorize';
  const options = question.options?.length
    ? question.options
    : question.type === 'judge'
      ? ['A. 正确', 'B. 错误']
      : [];

  function toggleSelection(value: string) {
    if (submitted) return;
    if (question.type === 'multiple') {
      setSelected((current) =>
        current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      );
      return;
    }
    setSelected([value]);
  }

  function submitChoice() {
    if (!selected.length || submitted) return;
    const result = isCorrect(question, selected);
    setSubmitted(true);
    setCorrect(result);
    setAnswerVisible(true);
    actions.recordAnswer(question.id, result);
  }

  function recordShortAnswer(result: boolean) {
    if (submitted) return;
    setSubmitted(true);
    setCorrect(result);
    setAnswerVisible(true);
    actions.recordAnswer(question.id, result);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            {isMemorize ? '背答案模式' : '刷题复习'}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--color-ink)]">
            {isMemorize ? '先回忆，再翻开答案' : '一次专注一道题'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-full border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] p-1 shadow-soft"
            aria-label="复习模式"
          >
            <button
              type="button"
              aria-pressed={!isMemorize}
              className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                !isMemorize
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
              }`}
              onClick={() => actions.setReviewMode('quiz')}
            >
              <RotateCcw size={15} aria-hidden="true" />
              刷题
            </button>
            <button
              type="button"
              aria-pressed={isMemorize}
              className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                isMemorize
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
              }`}
              onClick={() => actions.setReviewMode('memorize')}
            >
              <Brain size={15} aria-hidden="true" />
              背答案
            </button>
          </div>
          <ProgressPill current={Math.min(index + 1, total)} total={total} />
        </div>
      </div>

      <GlassCard className="space-y-5 animate-soft-in">
        <div className="flex flex-wrap items-center gap-2">
          <QuestionTypeBadge type={question.type} />
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            {question.sourceFile}
          </span>
          {question.sourcePath ? (
            <span className="rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs text-[var(--color-ink)]">
              {question.sourcePath}
            </span>
          ) : null}
          <span className="rounded-full bg-[color:rgb(255_255_255_/_0.64)] px-3 py-1 text-xs text-[var(--color-muted)]">
            掌握度 {meta.masteryLevel}
          </span>
        </div>

        <h2 className="whitespace-pre-wrap text-2xl font-bold leading-9 text-[var(--color-ink)]">
          {question.question}
        </h2>

        {isMemorize && options.length ? (
          <div className="space-y-3 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.54)] p-4">
            <p className="text-xs font-semibold text-[var(--color-muted)]">选项</p>
            <div className="grid gap-2 md:grid-cols-2">
              {options.map((option, index) => (
                <div
                  key={`${index}-${option}`}
                  className="rounded-2xl bg-[color:rgb(255_255_255_/_0.72)] px-3 py-2 text-sm text-[var(--color-ink)]"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {isMemorize ? (
          <div className="space-y-3">
            <SoftButton
              icon={<Eye size={17} aria-hidden="true" />}
              onClick={() => setAnswerVisible(true)}
              disabled={answerVisible}
            >
              翻开答案
            </SoftButton>
            <div className="flex flex-wrap gap-2">
              <SoftButton
                variant="primary"
                icon={<Check size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer(true)}
                disabled={!answerVisible || submitted}
              >
                记住了
              </SoftButton>
              <SoftButton
                variant="danger"
                icon={<X size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer(false)}
                disabled={!answerVisible || submitted}
              >
                没记住
              </SoftButton>
            </div>
            {submitted ? (
              <p
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  correct
                    ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                    : 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
                }`}
              >
                {correct ? '已记录为记住。' : '已记录为未记住，并写入错题本。'}
              </p>
            ) : null}
          </div>
        ) : isChoice ? (
          <div className="space-y-3">
            <div className="grid gap-3">
              {options.map((option, index) => {
                const key = optionKey(option);
                const picked = selected.includes(key);
                const expectedOption =
                  question.type === 'judge' ? isCorrect(question, [key]) : expected.includes(key);
                const stateClass = submitted
                  ? expectedOption
                    ? 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
                    : picked
                      ? 'border-[var(--color-error)] bg-[var(--color-error-soft)] text-[var(--color-error)]'
                      : 'border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)]'
                  : picked
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                    : 'border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)] hover:border-[var(--color-primary)]';
                return (
                  <button
                    type="button"
                    key={`${index}-${option}`}
                    className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${stateClass}`}
                    onClick={() => toggleSelection(key)}
                  >
                    <span>{option}</span>
                    {submitted && expectedOption ? <Check size={17} aria-hidden="true" /> : null}
                    {submitted && picked && !expectedOption ? (
                      <X size={17} aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SoftButton
                variant="primary"
                onClick={submitChoice}
                disabled={!selected.length || submitted}
              >
                提交答案
              </SoftButton>
              {submitted ? (
                <span
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    correct
                      ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                      : 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
                  }`}
                >
                  {correct ? '回答正确' : '回答错误，已写入错题本'}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <SoftButton
              icon={<Eye size={17} aria-hidden="true" />}
              onClick={() => setAnswerVisible(true)}
              disabled={answerVisible}
            >
              显示答案
            </SoftButton>
            <div className="flex flex-wrap gap-2">
              <SoftButton
                variant="primary"
                icon={<Check size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer(true)}
              >
                我答对了
              </SoftButton>
              <SoftButton
                variant="danger"
                icon={<X size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer(false)}
              >
                我答错了
              </SoftButton>
            </div>
            {submitted && correct === false ? (
              <p className="rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-error)]">
                已写入错题本。
              </p>
            ) : null}
          </div>
        )}

        <AnswerPanel question={question} visible={answerVisible} />

        {question.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag, index) => (
              <span
                key={`${index}-${tag}`}
                className="rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs text-[var(--color-ink)]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </GlassCard>

      <ReviewControls
        favorite={meta.favorite}
        onPrevious={actions.previousQuestion}
        onNext={actions.nextQuestion}
        onRandom={actions.randomQuestion}
        onExit={() => actions.setActiveView('bank')}
        onFavorite={() => actions.toggleFavorite(question.id)}
        onWrong={() => actions.markWrong(question.id)}
      />

      <p className="text-center text-sm text-[var(--color-muted)]">
        当前题型：{getQuestionTypeLabel(question.type)}，{isMemorize ? '背答案记录' : '复习记录'}
        会自动保存到本地。
      </p>
    </div>
  );
}
