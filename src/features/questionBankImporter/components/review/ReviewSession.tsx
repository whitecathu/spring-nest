import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import {
  BarChart3,
  Brain,
  Check,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings2,
  Text,
  X,
} from 'lucide-react';
import { createReviewMeta } from '../../lib/utils/normalize';
import { getQuestionTypeLabel, useQuestionBankStore } from '../../store/questionBankStore';
import type { Question } from '../../types/question';
import { EmptyState } from '../common/EmptyState';
import { GlassCard } from '../common/GlassCard';
import { MobileBottomSheet } from '../common/MobileBottomSheet';
import { SoftButton } from '../common/SoftButton';
import { QuestionTypeBadge } from '../question/QuestionTypeBadge';
import { AnswerPanel } from './AnswerPanel';
import { ProgressPill } from './ProgressPill';
import { ReviewActionDock } from './ReviewActionDock';
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
  const activeIdsKey = activeIds.join('|');
  const question = useMemo(
    () => questions.find((item) => item.id === activeIds[index]) ?? questions[0],
    [activeIds, index, questions],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | undefined>(undefined);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'settings' | 'stats' | null>(null);
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0, wrong: 0 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelected([]);
    setSubmitted(false);
    setCorrect(undefined);
    setAnswerVisible(reviewMode === 'analysis');
  }, [question?.id, reviewMode]);

  useEffect(() => {
    setSessionStats({ answered: 0, correct: 0, wrong: 0 });
  }, [activeIdsKey, reviewMode]);

  const total = activeIds.length || questions.length;

  // Keyboard navigation: ArrowLeft / ArrowRight
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        actions.previousQuestion();
      } else if (event.key === 'ArrowRight' && index < total - 1) {
        event.preventDefault();
        actions.nextQuestion();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, index, total]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!questions.length || !question) {
    return (
      <EmptyState
        title="还没有可复习的题目"
        description="先导入自己的题库文件，再开始复习。"
        actionLabel="去导入"
        onAction={() => actions.setActiveView('import')}
      />
    );
  }

  const meta = reviewMeta[question.id] ?? createReviewMeta(question.id);
  const expected = answerArray(question.answer);
  const isChoice =
    question.type === 'single' || question.type === 'multiple' || question.type === 'judge';
  const isMemorize = reviewMode === 'memorize';
  const isAnalysis = reviewMode === 'analysis';
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
    // Single/judge: auto-submit on click
    const result = isCorrect(question, [value]);
    setSubmitted(true);
    setCorrect(result);
    setAnswerVisible(true);
    setSessionStats((stats) => ({
      answered: stats.answered + 1,
      correct: stats.correct + (result ? 1 : 0),
      wrong: stats.wrong + (result ? 0 : 1),
    }));
    actions.recordAnswer(question.id, result);
  }

  function submitChoice() {
    if (!selected.length || submitted) return;
    const result = isCorrect(question, selected);
    setSubmitted(true);
    setCorrect(result);
    setAnswerVisible(true);
    setSessionStats((stats) => ({
      answered: stats.answered + 1,
      correct: stats.correct + (result ? 1 : 0),
      wrong: stats.wrong + (result ? 0 : 1),
    }));
    actions.recordAnswer(question.id, result);
  }

  function recordShortAnswer(result: 'remember' | 'vague' | 'forgot') {
    if (submitted) return;
    const remembered = result === 'remember';
    setSubmitted(true);
    setCorrect(remembered);
    setAnswerVisible(true);
    setSessionStats((stats) => ({
      answered: stats.answered + 1,
      correct: stats.correct + (remembered ? 1 : 0),
      wrong: stats.wrong + (remembered ? 0 : 1),
    }));
    actions.recordRecall(question.id, result);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!touchStart.current) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < 52 || Math.abs(deltaY) > Math.abs(deltaX) * 0.72) return;
    if (deltaX < 0 && index < total - 1) actions.nextQuestion();
    if (deltaX > 0 && index > 0) actions.previousQuestion();
  }

  const accuracy = sessionStats.answered
    ? Math.round((sessionStats.correct / sessionStats.answered) * 100)
    : 0;
  const remaining = Math.max(total - index - 1, 0);
  const isRoundComplete = submitted && index >= total - 1;

  return (
    <div
      className="no-swipe mx-auto max-w-4xl space-y-4 md:space-y-5"
      data-swipe-ignore="true"
      onTouchStart={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('button, input, textarea, select, a')) return;
        touchStart.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            {isAnalysis ? '只看解析' : isMemorize ? '背答案模式' : '刷题复习'}
          </p>
          {!immersive ? (
            <h1 className="mt-1 text-2xl font-bold leading-8 text-[var(--color-ink)] md:text-3xl">
              {isAnalysis
                ? '先过思路，再决定是否重练'
                : isMemorize
                  ? '先回忆，再翻开答案'
                  : '一次专注一道题'}
            </h1>
          ) : null}
        </div>
        <div className="hidden flex-wrap items-center gap-3 md:flex">
          <div
            className="inline-flex rounded-full border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] p-1 shadow-soft"
            aria-label="复习模式"
          >
            <button
              type="button"
              aria-pressed={!isMemorize && !isAnalysis}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                !isMemorize && !isAnalysis
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
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                isMemorize
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
              }`}
              onClick={() => actions.setReviewMode('memorize')}
            >
              <Brain size={15} aria-hidden="true" />
              背答案
            </button>
            <button
              type="button"
              aria-pressed={isAnalysis}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                isAnalysis
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
              }`}
              onClick={() => actions.setReviewMode('analysis')}
            >
              <Eye size={15} aria-hidden="true" />
              解析
            </button>
          </div>
          <div
            className="inline-flex rounded-full border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] p-1 shadow-soft"
            aria-label="阅读设置"
          >
            <button
              type="button"
              aria-pressed={largeText}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                largeText
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
              }`}
              onClick={() => setLargeText((value) => !value)}
            >
              <Text size={15} aria-hidden="true" />
              {largeText ? '大字' : '标准字'}
            </button>
            <button
              type="button"
              aria-pressed={immersive}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                immersive
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
              }`}
              onClick={() => setImmersive((value) => !value)}
            >
              {immersive ? (
                <Minimize2 size={15} aria-hidden="true" />
              ) : (
                <Maximize2 size={15} aria-hidden="true" />
              )}
              {immersive ? '退出沉浸' : '沉浸'}
            </button>
          </div>
          <ProgressPill current={Math.min(index + 1, total)} total={total} />
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 md:hidden">
          <SoftButton
            icon={<Settings2 size={17} aria-hidden="true" />}
            onClick={() => setMobileSheet('settings')}
          >
            复习设置
          </SoftButton>
          <SoftButton
            icon={<BarChart3 size={17} aria-hidden="true" />}
            onClick={() => setMobileSheet('stats')}
          >
            本轮统计
          </SoftButton>
          <ProgressPill current={Math.min(index + 1, total)} total={total} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:hidden" aria-label="复习进度">
        <div className="min-w-0 rounded-2xl border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] px-3 py-2 shadow-soft">
          <p className="text-[0.68rem] font-semibold text-[var(--color-muted)]">进度</p>
          <p className="truncate text-sm font-bold text-[var(--color-ink)]">
            第 {Math.min(index + 1, total)} / {total} 题
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] px-3 py-2 shadow-soft">
          <p className="text-[0.68rem] font-semibold text-[var(--color-muted)]">正确率</p>
          <p className="truncate text-sm font-bold text-[var(--color-primary)]">{accuracy}%</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] px-3 py-2 shadow-soft">
          <p className="text-[0.68rem] font-semibold text-[var(--color-muted)]">剩余</p>
          <p className="truncate text-sm font-bold text-[var(--color-ink)]">{remaining} 题</p>
        </div>
      </div>

      <MobileBottomSheet
        open={mobileSheet === 'settings'}
        title="复习设置"
        onClose={() => setMobileSheet(null)}
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--color-muted)]">复习模式</p>
            <div className="grid gap-2">
              <SoftButton
                className="w-full"
                variant={!isMemorize && !isAnalysis ? 'primary' : 'secondary'}
                aria-pressed={!isMemorize && !isAnalysis}
                icon={<RotateCcw size={17} aria-hidden="true" />}
                onClick={() => actions.setReviewMode('quiz')}
              >
                刷题
              </SoftButton>
              <SoftButton
                className="w-full"
                variant={isMemorize ? 'primary' : 'secondary'}
                aria-pressed={isMemorize}
                icon={<Brain size={17} aria-hidden="true" />}
                onClick={() => actions.setReviewMode('memorize')}
              >
                背答案
              </SoftButton>
              <SoftButton
                className="w-full"
                variant={isAnalysis ? 'primary' : 'secondary'}
                aria-pressed={isAnalysis}
                icon={<Eye size={17} aria-hidden="true" />}
                onClick={() => actions.setReviewMode('analysis')}
              >
                只看解析
              </SoftButton>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--color-muted)]">阅读设置</p>
            <div className="grid gap-2">
              <SoftButton
                className="w-full"
                variant={largeText ? 'primary' : 'secondary'}
                aria-pressed={largeText}
                icon={<Text size={17} aria-hidden="true" />}
                onClick={() => setLargeText((value) => !value)}
              >
                {largeText ? '大字模式' : '标准字号'}
              </SoftButton>
              <SoftButton
                className="w-full"
                variant={immersive ? 'primary' : 'secondary'}
                aria-pressed={immersive}
                icon={
                  immersive ? (
                    <Minimize2 size={17} aria-hidden="true" />
                  ) : (
                    <Maximize2 size={17} aria-hidden="true" />
                  )
                }
                onClick={() => setImmersive((value) => !value)}
              >
                {immersive ? '退出沉浸' : '沉浸复习'}
              </SoftButton>
            </div>
          </div>
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        open={mobileSheet === 'stats'}
        title="本轮统计"
        onClose={() => setMobileSheet(null)}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[color:rgb(255_255_255_/_0.68)] p-4">
            <p className="text-xs text-[var(--color-muted)]">本轮已答</p>
            <p className="text-2xl font-bold text-[var(--color-ink)]">{sessionStats.answered}</p>
          </div>
          <div className="rounded-2xl bg-[color:rgb(255_255_255_/_0.68)] p-4">
            <p className="text-xs text-[var(--color-muted)]">正确率</p>
            <p className="text-2xl font-bold text-[var(--color-primary)]">{accuracy}%</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-success-soft)] p-4">
            <p className="text-xs text-[var(--color-success)]">正确</p>
            <p className="text-2xl font-bold text-[var(--color-success)]">{sessionStats.correct}</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-error-soft)] p-4">
            <p className="text-xs text-[var(--color-error)]">错题</p>
            <p className="text-2xl font-bold text-[var(--color-error)]">{sessionStats.wrong}</p>
          </div>
        </div>
      </MobileBottomSheet>

      <GlassCard
        key={question.id}
        className="animate-soft-in min-w-0 space-y-5 rounded-[1.25rem] p-4 md:rounded-[1.6rem] md:p-6"
      >
        {!immersive ? (
          <div className="flex flex-wrap items-center gap-2">
            <QuestionTypeBadge type={question.type} />
            <span className="max-w-full break-words rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              {question.sourceFile}
            </span>
            {question.sourcePath ? (
              <span className="max-w-full break-words rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs text-[var(--color-ink)]">
                {question.sourcePath}
              </span>
            ) : null}
            {question.chapter ? (
              <span className="rounded-full bg-[color:rgb(255_255_255_/_0.64)] px-3 py-1 text-xs text-[var(--color-muted)]">
                {question.chapter}
              </span>
            ) : null}
            <span className="rounded-full bg-[color:rgb(255_255_255_/_0.64)] px-3 py-1 text-xs text-[var(--color-muted)]">
              掌握度 {meta.masteryLevel}
            </span>
          </div>
        ) : null}

        <h2
          className={`whitespace-pre-wrap break-words font-bold text-[var(--color-ink)] ${
            largeText
              ? 'text-[1.7rem] leading-10 md:text-3xl'
              : 'text-xl leading-8 md:text-2xl md:leading-9'
          }`}
        >
          {question.question}
        </h2>

        {isMemorize ? (
          <div className="space-y-3">
            {options.length ? (
              <div className="grid gap-3">
                {options.map((option, index) => {
                  const key = optionKey(option);
                  const isCorrectOption =
                    question.type === 'judge' ? isCorrect(question, [key]) : expected.includes(key);
                  return (
                    <div
                      key={`${index}-${option}`}
                      className={`flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                        answerVisible && isCorrectOption
                          ? 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
                          : 'border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)]'
                      }`}
                    >
                      <span className="min-w-0 break-words">{option}</span>
                      {answerVisible && isCorrectOption ? (
                        <Check size={17} aria-hidden="true" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            <SoftButton
              icon={<Eye size={17} aria-hidden="true" />}
              onClick={() => setAnswerVisible(true)}
              disabled={answerVisible}
              className="w-full"
            >
              翻开答案
            </SoftButton>
            <div className="hidden grid-cols-3 gap-2 md:grid">
              <SoftButton
                variant="danger"
                icon={<RotateCcw size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer('forgot')}
                disabled={!answerVisible || submitted}
              >
                重来
              </SoftButton>
              <SoftButton
                icon={<X size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer('vague')}
                disabled={!answerVisible || submitted}
              >
                模糊
              </SoftButton>
              <SoftButton
                variant="primary"
                icon={<Check size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer('remember')}
                disabled={!answerVisible || submitted}
              >
                掌握
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
        ) : isChoice || isAnalysis ? (
          <div className="space-y-3">
            <div className="grid gap-3">
              {options.map((option, index) => {
                const key = optionKey(option);
                const picked = selected.includes(key);
                const expectedOption =
                  question.type === 'judge' ? isCorrect(question, [key]) : expected.includes(key);
                const stateClass = isAnalysis
                  ? expectedOption
                    ? 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
                    : 'border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)]'
                  : submitted
                    ? expectedOption
                      ? 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
                      : picked
                        ? 'border-[var(--color-error)] bg-[var(--color-error-soft)] text-[var(--color-error)]'
                        : 'border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)]'
                    : picked
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.62)] text-[var(--color-ink)] hover:border-[var(--color-primary)]';
                const Wrapper = isAnalysis ? 'div' : 'button';
                return (
                  <Wrapper
                    key={`${index}-${option}`}
                    className={`flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${stateClass}`}
                    {...(!isAnalysis
                      ? { type: 'button', onClick: () => toggleSelection(key) }
                      : {})}
                  >
                    <span className="min-w-0 break-words">{option}</span>
                    {isAnalysis && expectedOption ? <Check size={17} aria-hidden="true" /> : null}
                    {!isAnalysis && submitted && expectedOption ? (
                      <Check size={17} aria-hidden="true" />
                    ) : null}
                    {!isAnalysis && submitted && picked && !expectedOption ? (
                      <X size={17} aria-hidden="true" />
                    ) : null}
                  </Wrapper>
                );
              })}
            </div>
            {!isAnalysis ? (
              <div className="space-y-2">
                {question.type === 'multiple' ? (
                  <SoftButton
                    variant="primary"
                    onClick={submitChoice}
                    disabled={!selected.length || submitted}
                    className="hidden w-full md:inline-flex"
                  >
                    提交答案
                  </SoftButton>
                ) : null}
                {submitted ? (
                  <p
                    className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${
                      correct
                        ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                        : 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
                    }`}
                  >
                    {correct ? '回答正确' : '回答错误，已写入错题本'}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <SoftButton
              icon={<Eye size={17} aria-hidden="true" />}
              onClick={() => setAnswerVisible(true)}
              disabled={answerVisible}
              className="hidden w-full md:inline-flex"
            >
              显示答案
            </SoftButton>
            <div className="hidden grid-cols-3 gap-2 md:grid">
              <SoftButton
                variant="danger"
                icon={<RotateCcw size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer('forgot')}
                disabled={!answerVisible || submitted}
              >
                重来
              </SoftButton>
              <SoftButton
                icon={<X size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer('vague')}
                disabled={!answerVisible || submitted}
              >
                模糊
              </SoftButton>
              <SoftButton
                variant="primary"
                icon={<Check size={17} aria-hidden="true" />}
                onClick={() => recordShortAnswer('remember')}
                disabled={!answerVisible || submitted}
              >
                掌握
              </SoftButton>
            </div>
            {submitted && correct === false ? (
              <p className="rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-error)]">
                已写入错题本。
              </p>
            ) : null}
          </div>
        )}

        <AnswerPanel question={question} visible={answerVisible && !(isAnalysis && isChoice)} />

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

      <GlassCard className="hidden gap-3 md:grid md:grid-cols-4">
        <div>
          <p className="text-xs text-[var(--color-muted)]">本轮已答</p>
          <p className="text-xl font-bold text-[var(--color-ink)]">{sessionStats.answered}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">正确</p>
          <p className="text-xl font-bold text-[var(--color-success)]">{sessionStats.correct}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">错题</p>
          <p className="text-xl font-bold text-[var(--color-error)]">{sessionStats.wrong}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">正确率</p>
          <p className="text-xl font-bold text-[var(--color-primary)]">{accuracy}%</p>
        </div>
        {isRoundComplete ? (
          <p className="rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] sm:col-span-4">
            本轮总结：完成 {sessionStats.answered} 题，正确 {sessionStats.correct}{' '}
            题，错题已自动进入错题本，可继续重练。
          </p>
        ) : null}
      </GlassCard>

      <ReviewActionDock
        favorite={meta.favorite}
        canPrevious={index > 0}
        canNext={index < total - 1}
        answerVisible={answerVisible}
        submitted={submitted}
        isMemorize={isMemorize}
        isAnalysis={isAnalysis}
        isMultipleChoice={question.type === 'multiple'}
        usesRecallGrading={!isChoice}
        selectedCount={selected.length}
        onPrevious={actions.previousQuestion}
        onNext={actions.nextQuestion}
        onExit={() => actions.setActiveView('workbench')}
        onFavorite={() => actions.toggleFavorite(question.id)}
        onWrong={() => actions.markWrong(question.id)}
        onRevealAnswer={() => setAnswerVisible(true)}
        onSubmitChoice={submitChoice}
        onForgot={() => recordShortAnswer('forgot')}
        onVague={() => recordShortAnswer('vague')}
        onRemember={() => recordShortAnswer('remember')}
      />

      <ReviewControls
        favorite={meta.favorite}
        onPrevious={actions.previousQuestion}
        onNext={actions.nextQuestion}
        onRandom={actions.randomQuestion}
        onExit={() => actions.setActiveView('workbench')}
        onFavorite={() => actions.toggleFavorite(question.id)}
        onWrong={() => actions.markWrong(question.id)}
        canPrevious={index > 0}
        canNext={index < total - 1}
      />

      <p className="text-center text-sm text-[var(--color-muted)]">
        当前题型：{getQuestionTypeLabel(question.type)}，
        {isAnalysis ? '解析浏览不改动记录' : isMemorize ? '背答案记录' : '复习记录'}
        {isAnalysis ? '。' : '会自动保存到本地。'}
      </p>
    </div>
  );
}
