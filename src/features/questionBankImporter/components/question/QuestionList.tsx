import {
  AlertTriangle,
  Brain,
  Eye,
  Heart,
  History,
  ListChecks,
  Play,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { selectFilteredQuestions, useQuestionBankStore } from '../../store/questionBankStore';
import { createReviewMeta } from '../../lib/utils/normalize';
import { EmptyState } from '../common/EmptyState';
import { MobileBottomSheet } from '../common/MobileBottomSheet';
import { SoftButton } from '../common/SoftButton';
import { QuestionCard } from './QuestionCard';
import { QuestionFilters } from './QuestionFilters';

export function QuestionList() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const filters = useQuestionBankStore((state) => state.activeFilters);
  const searchQuery = useQuestionBankStore((state) => state.searchQuery);
  const sortMode = useQuestionBankStore((state) => state.sortMode);
  const lastReviewSession = useQuestionBankStore((state) => state.lastReviewSession);
  const filtered = useMemo(
    () =>
      selectFilteredQuestions({
        questions,
        reviewMeta,
        activeFilters: filters,
        searchQuery,
        sortMode,
      }),
    [filters, questions, reviewMeta, searchQuery, sortMode],
  );
  const favoriteQuestions = filtered.filter((question) => reviewMeta[question.id]?.favorite);
  const wrongQuestions = filtered.filter(
    (question) => (reviewMeta[question.id]?.wrongCount ?? 0) > 0,
  );
  const frequentWrongQuestions = wrongQuestions.filter(
    (question) => (reviewMeta[question.id]?.wrongCount ?? 0) >= 2,
  );
  const preExamQuestions = filtered
    .filter((question) => (reviewMeta[question.id]?.masteryLevel ?? 0) < 80)
    .slice(0, 30);
  const actions = useQuestionBankStore((state) => state.actions);
  const [mobileSheet, setMobileSheet] = useState<'filters' | 'actions' | null>(null);
  const canResume = Boolean(
    lastReviewSession?.questionIds.some((id) => questions.some((question) => question.id === id)),
  );

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
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">题库管理</p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--color-ink)]">
            可搜索、可编辑、可复习
          </h1>
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
            icon={<History size={17} aria-hidden="true" />}
            onClick={actions.resumeReview}
            disabled={!canResume}
          >
            继续上次复习
          </SoftButton>
          <SoftButton
            variant="primary"
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
            variant="primary"
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
          {filtered.map((question) => (
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
    </div>
  );
}
