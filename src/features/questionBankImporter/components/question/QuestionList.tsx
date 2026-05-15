import { Brain, Play } from 'lucide-react';
import { useMemo } from 'react';
import { selectFilteredQuestions, useQuestionBankStore } from '../../store/questionBankStore';
import { createReviewMeta } from '../../lib/utils/normalize';
import { EmptyState } from '../common/EmptyState';
import { SoftButton } from '../common/SoftButton';
import { QuestionCard } from './QuestionCard';
import { QuestionFilters } from './QuestionFilters';

export function QuestionList() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const filters = useQuestionBankStore((state) => state.activeFilters);
  const searchQuery = useQuestionBankStore((state) => state.searchQuery);
  const sortMode = useQuestionBankStore((state) => state.sortMode);
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
  const actions = useQuestionBankStore((state) => state.actions);

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
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <QuestionFilters
        questions={questions}
        filters={filters}
        searchQuery={searchQuery}
        sortMode={sortMode}
        onSearch={actions.setSearchQuery}
        onFilters={actions.setFilters}
        onSort={actions.setSortMode}
      />

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
