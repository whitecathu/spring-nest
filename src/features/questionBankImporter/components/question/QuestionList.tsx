import {
  AlertTriangle,
  Brain,
  Clock3,
  Eye,
  Heart,
  History,
  ListChecks,
  Play,
  Search,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { selectFilteredQuestions, useQuestionBankStore } from '../../store/questionBankStore';
import { createReviewMeta } from '../../lib/utils/normalize';
import { getReviewQueueSummary } from '../../lib/reviewQueues';
import { EmptyState } from '../common/EmptyState';
import { MobileBottomSheet } from '../common/MobileBottomSheet';
import { SoftButton } from '../common/SoftButton';
import { QuestionCard } from './QuestionCard';
import { QuestionFilters } from './QuestionFilters';

const PAGE_SIZE = 20;

export function QuestionList() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const reviewPlan = useQuestionBankStore((state) => state.reviewPlan);
  const filters = useQuestionBankStore((state) => state.activeFilters);
  const searchQuery = useQuestionBankStore((state) => state.searchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const sortMode = useQuestionBankStore((state) => state.sortMode);
  const lastReviewSession = useQuestionBankStore((state) => state.lastReviewSession);
  const filtered = useMemo(
    () =>
      selectFilteredQuestions({
        questions,
        reviewMeta,
        activeFilters: filters,
        searchQuery: deferredSearchQuery,
        sortMode,
      }),
    [deferredSearchQuery, filters, questions, reviewMeta, sortMode],
  );
  const favoriteQuestions = useMemo(
    () => filtered.filter((question) => reviewMeta[question.id]?.favorite),
    [filtered, reviewMeta],
  );
  const wrongQuestions = useMemo(
    () => filtered.filter((question) => (reviewMeta[question.id]?.wrongCount ?? 0) > 0),
    [filtered, reviewMeta],
  );
  const frequentWrongQuestions = useMemo(
    () => wrongQuestions.filter((question) => (reviewMeta[question.id]?.wrongCount ?? 0) >= 2),
    [reviewMeta, wrongQuestions],
  );
  const preExamQuestions = useMemo(
    () =>
      filtered.filter((question) => (reviewMeta[question.id]?.masteryLevel ?? 0) < 80).slice(0, 30),
    [filtered, reviewMeta],
  );
  const reviewSummary = useMemo(
    () => getReviewQueueSummary(questions, reviewMeta, reviewPlan),
    [questions, reviewMeta, reviewPlan],
  );
  const todayQuestions = reviewSummary.dueQuestions.length
    ? reviewSummary.dueQuestions
    : filtered.slice(0, reviewPlan.dailyTarget);
  const actions = useQuestionBankStore((state) => state.actions);
  const [mobileSheet, setMobileSheet] = useState<'filters' | 'actions' | null>(null);
  const canResume = Boolean(
    lastReviewSession?.questionIds.some((id) => questions.some((question) => question.id === id)),
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredSearchQuery, filters, sortMode]);

  // IntersectionObserver for infinite scroll
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
      }
    },
    [filtered.length],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const visibleQuestions = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const visibleTotal = Math.min(visibleCount, filtered.length);

  if (!questions.length) {
    return (
      <EmptyState
        title="题库还是空的"
        description="先导入自己的题库文件，再回来管理、搜索和复习。"
        actionLabel="去导入"
        onAction={() => actions.setActiveView('import')}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-primary)]">题库管理</p>
          <h1 className="mt-1 text-2xl font-bold leading-8 text-[var(--color-ink)] md:text-3xl">
            可搜索、可编辑、可复习
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            当前结果 {filtered.length} / {questions.length} 题，已分批显示 {visibleTotal} 题
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:hidden">
          <SoftButton
            icon={<SlidersHorizontal size={17} aria-hidden="true" />}
            onClick={() => setMobileSheet('filters')}
          >
            筛选
          </SoftButton>
          <SoftButton
            variant="primary"
            icon={<ListChecks size={17} aria-hidden="true" />}
            onClick={() => setMobileSheet('actions')}
          >
            复习入口
          </SoftButton>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          <SoftButton
            variant="primary"
            icon={<Clock3 size={17} aria-hidden="true" />}
            onClick={() =>
              actions.startReview(
                todayQuestions.map((question) => question.id),
                'quiz',
              )
            }
            disabled={!todayQuestions.length}
          >
            本次建议
          </SoftButton>
          <SoftButton
            icon={<History size={17} aria-hidden="true" />}
            onClick={actions.resumeReview}
            disabled={!canResume}
          >
            继续上次复习
          </SoftButton>
          <SoftButton
            icon={<Play size={17} aria-hidden="true" />}
            onClick={() =>
              actions.startReview(
                filtered.map((question) => question.id),
                'quiz',
              )
            }
            disabled={!filtered.length}
          >
            复习当前结果
          </SoftButton>
          <SoftButton
            icon={<Brain size={17} aria-hidden="true" />}
            onClick={() =>
              actions.startReview(
                filtered.map((question) => question.id),
                'memorize',
              )
            }
            disabled={!filtered.length}
          >
            背答案
          </SoftButton>
          <SoftButton
            icon={<Eye size={17} aria-hidden="true" />}
            onClick={() =>
              actions.startReview(
                filtered.map((question) => question.id),
                'analysis',
              )
            }
            disabled={!filtered.length}
          >
            只看解析
          </SoftButton>
          <SoftButton
            icon={<AlertTriangle size={17} aria-hidden="true" />}
            onClick={() => actions.startReview(wrongQuestions.map((question) => question.id))}
            disabled={!wrongQuestions.length}
          >
            错题重练
          </SoftButton>
          <SoftButton
            icon={<Heart size={17} aria-hidden="true" />}
            onClick={() => actions.startReview(favoriteQuestions.map((question) => question.id))}
            disabled={!favoriteQuestions.length}
          >
            收藏复习
          </SoftButton>
          <SoftButton
            icon={<Target size={17} aria-hidden="true" />}
            onClick={() =>
              actions.startReview(
                (frequentWrongQuestions.length ? frequentWrongQuestions : preExamQuestions).map(
                  (question) => question.id,
                ),
              )
            }
            disabled={!frequentWrongQuestions.length && !preExamQuestions.length}
          >
            考前速刷
          </SoftButton>
        </div>
      </div>

      <div className="sticky top-[4.35rem] z-10 -mx-4 bg-[color:rgb(249_250_246_/_0.92)] px-4 py-2 backdrop-blur md:hidden">
        <label className="block">
          <span className="sr-only">搜索题库</span>
          <span className="flex min-h-12 items-center gap-2 rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.82)] px-3 shadow-soft focus-within:border-[var(--color-primary)]">
            <Search size={17} className="shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
            <input
              className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--color-muted)]"
              value={searchQuery}
              onChange={(event) => actions.setSearchQuery(event.target.value)}
              placeholder="搜索题干、答案、解析"
            />
          </span>
        </label>
      </div>

      <div className="hidden md:block">
        <QuestionFilters
          questions={questions}
          filters={filters}
          searchQuery={searchQuery}
          sortMode={sortMode}
          onSearch={actions.setSearchQuery}
          onFilters={actions.setFilters}
          onSort={actions.setSortMode}
        />
      </div>

      <MobileBottomSheet
        open={mobileSheet === 'filters'}
        title="筛选题库"
        onClose={() => setMobileSheet(null)}
      >
        <QuestionFilters
          questions={questions}
          filters={filters}
          searchQuery={searchQuery}
          sortMode={sortMode}
          onSearch={actions.setSearchQuery}
          onFilters={actions.setFilters}
          onSort={actions.setSortMode}
        />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={mobileSheet === 'actions'}
        title="复习入口"
        onClose={() => setMobileSheet(null)}
      >
        <div className="grid gap-2">
          <SoftButton
            className="w-full"
            variant="primary"
            icon={<Clock3 size={17} aria-hidden="true" />}
            onClick={() => {
              actions.startReview(
                todayQuestions.map((question) => question.id),
                'quiz',
              );
              setMobileSheet(null);
            }}
            disabled={!todayQuestions.length}
          >
            本次建议
          </SoftButton>
          <SoftButton
            className="w-full"
            icon={<History size={17} aria-hidden="true" />}
            onClick={() => {
              actions.resumeReview();
              setMobileSheet(null);
            }}
            disabled={!canResume}
          >
            继续上次复习
          </SoftButton>
          <SoftButton
            className="w-full"
            icon={<Play size={17} aria-hidden="true" />}
            onClick={() => {
              actions.startReview(
                filtered.map((question) => question.id),
                'quiz',
              );
              setMobileSheet(null);
            }}
            disabled={!filtered.length}
          >
            复习当前结果
          </SoftButton>
          <SoftButton
            className="w-full"
            icon={<Brain size={17} aria-hidden="true" />}
            onClick={() => {
              actions.startReview(
                filtered.map((question) => question.id),
                'memorize',
              );
              setMobileSheet(null);
            }}
            disabled={!filtered.length}
          >
            背答案
          </SoftButton>
          <SoftButton
            className="w-full"
            icon={<Eye size={17} aria-hidden="true" />}
            onClick={() => {
              actions.startReview(
                filtered.map((question) => question.id),
                'analysis',
              );
              setMobileSheet(null);
            }}
            disabled={!filtered.length}
          >
            只看解析
          </SoftButton>
          <SoftButton
            className="w-full"
            icon={<AlertTriangle size={17} aria-hidden="true" />}
            onClick={() => {
              actions.startReview(wrongQuestions.map((question) => question.id));
              setMobileSheet(null);
            }}
            disabled={!wrongQuestions.length}
          >
            错题重练
          </SoftButton>
          <SoftButton
            className="w-full"
            icon={<Heart size={17} aria-hidden="true" />}
            onClick={() => {
              actions.startReview(favoriteQuestions.map((question) => question.id));
              setMobileSheet(null);
            }}
            disabled={!favoriteQuestions.length}
          >
            收藏复习
          </SoftButton>
          <SoftButton
            className="w-full"
            icon={<Target size={17} aria-hidden="true" />}
            onClick={() => {
              actions.startReview(
                (frequentWrongQuestions.length ? frequentWrongQuestions : preExamQuestions).map(
                  (question) => question.id,
                ),
              );
              setMobileSheet(null);
            }}
            disabled={!frequentWrongQuestions.length && !preExamQuestions.length}
          >
            考前速刷
          </SoftButton>
        </div>
      </MobileBottomSheet>

      {filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              meta={reviewMeta[question.id] ?? createReviewMeta(question.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="没有找到匹配题目"
          description="换一个关键词，或清除收藏、错题、题型筛选后再试。"
        />
      )}
      {visibleCount < filtered.length ? (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <span className="text-sm text-[var(--color-muted)]">
            已显示 {visibleCount} / {filtered.length} 题，下滑加载更多…
          </span>
        </div>
      ) : null}
    </div>
  );
}
