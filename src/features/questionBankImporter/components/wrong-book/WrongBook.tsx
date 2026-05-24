import { Play, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getQuestionTypeLabel, useQuestionBankStore } from '../../store/questionBankStore';
import type { Difficulty, QuestionType } from '../../types/question';
import { EmptyState } from '../common/EmptyState';
import { MobileBottomSheet } from '../common/MobileBottomSheet';
import { SoftButton } from '../common/SoftButton';
import { WrongQuestionCard } from './WrongQuestionCard';

const questionTypes: Array<'all' | QuestionType> = [
  'all',
  'single',
  'multiple',
  'judge',
  'blank',
  'short',
  'flashcard',
];

const difficulties: Array<'all' | Difficulty> = ['all', 'easy', 'medium', 'hard'];

const PAGE_SIZE = 20;
type WrongGroup = 'recent' | 'frequent' | 'unmastered';

export function WrongBook() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const actions = useQuestionBankStore((state) => state.actions);
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all');
  const [chapterFilter, setChapterFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [group, setGroup] = useState<WrongGroup>('recent');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const chapters = useMemo(
    () => [...new Set(questions.map((question) => question.chapter))].filter(Boolean),
    [questions],
  );
  const tags = useMemo(
    () => [...new Set(questions.flatMap((question) => question.tags ?? []))].filter(Boolean),
    [questions],
  );
  const wrongQuestions = useMemo(() => {
    const base = questions
      .filter((question) => {
        const meta = reviewMeta[question.id];
        if ((meta?.wrongCount ?? 0) <= 0) return false;
        if (group === 'frequent') return (meta?.wrongCount ?? 0) >= 2;
        if (group === 'unmastered') return (meta?.masteryLevel ?? 0) < 60;
        return true;
      })
      .filter((question) => typeFilter === 'all' || question.type === typeFilter)
      .filter((question) => difficultyFilter === 'all' || question.difficulty === difficultyFilter)
      .filter((question) => !chapterFilter || question.chapter === chapterFilter)
      .filter((question) => !tagFilter || (question.tags ?? []).includes(tagFilter));

    if (group === 'recent') {
      return base.sort(
        (a, b) =>
          Date.parse(reviewMeta[b.id]?.lastWrongAt ?? '0') -
          Date.parse(reviewMeta[a.id]?.lastWrongAt ?? '0'),
      );
    }
    return base.sort(
      (a, b) => (reviewMeta[b.id]?.wrongCount ?? 0) - (reviewMeta[a.id]?.wrongCount ?? 0),
    );
  }, [chapterFilter, difficultyFilter, group, questions, reviewMeta, tagFilter, typeFilter]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [typeFilter, difficultyFilter, chapterFilter, tagFilter, group]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, wrongQuestions.length));
      }
    },
    [wrongQuestions.length],
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

  const visibleQuestions = wrongQuestions.slice(0, visibleCount);

  if (!wrongQuestions.length) {
    return (
      <EmptyState
        title="暂时没有错题，继续保持！"
        description="复习时答错的题会自动进入这里，也可以在题库卡片中手动加入错题。"
        actionLabel="开始复习"
        onAction={() => actions.startReview()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-error)]">错题本</p>
          <h1 className="mt-1 text-2xl font-bold leading-8 text-[var(--color-ink)] md:text-3xl">
            {wrongQuestions.length} 道题需要复盘
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <SoftButton
            className="md:hidden"
            icon={<SlidersHorizontal size={17} aria-hidden="true" />}
            onClick={() => setFiltersOpen(true)}
          >
            筛选
          </SoftButton>
          <SoftButton
            variant="primary"
            icon={<Play size={17} aria-hidden="true" />}
            onClick={() => actions.startReview(wrongQuestions.map((question) => question.id))}
          >
            错题重练
          </SoftButton>
        </div>
      </div>
      <div className="sticky top-[4.35rem] z-10 -mx-4 bg-[color:rgb(249_250_246_/_0.92)] px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-0">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.72)] p-1">
          {[
            ['recent', '最近错题'],
            ['frequent', '高频错题'],
            ['unmastered', '未掌握'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`min-h-11 rounded-xl px-2 text-xs font-bold transition ${
                group === value
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)]'
              }`}
              aria-pressed={group === value}
              onClick={() => setGroup(value as WrongGroup)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="hidden gap-3 rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.58)] p-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">题型</span>
          <select
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-sm"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | QuestionType)}
          >
            {questionTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? '全部题型' : getQuestionTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">难度</span>
          <select
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-sm"
            value={difficultyFilter}
            onChange={(event) => setDifficultyFilter(event.target.value as 'all' | Difficulty)}
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'all'
                  ? '全部难度'
                  : { easy: '简单', medium: '中等', hard: '困难' }[difficulty]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">标签</span>
          <select
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-sm"
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
          >
            <option value="">全部标签</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">章节</span>
          <select
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-sm"
            value={chapterFilter}
            onChange={(event) => setChapterFilter(event.target.value)}
          >
            <option value="">全部章节</option>
            {chapters.map((chapter) => (
              <option key={chapter} value={chapter}>
                {chapter}
              </option>
            ))}
          </select>
        </label>
      </div>
      <MobileBottomSheet open={filtersOpen} title="筛选错题" onClose={() => setFiltersOpen(false)}>
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">题型</span>
            <select
              className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | QuestionType)}
            >
              {questionTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? '全部题型' : getQuestionTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">难度</span>
            <select
              className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as 'all' | Difficulty)}
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all'
                    ? '全部难度'
                    : { easy: '简单', medium: '中等', hard: '困难' }[difficulty]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">标签</span>
            <select
              className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base"
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
            >
              <option value="">全部标签</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">章节</span>
            <select
              className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base"
              value={chapterFilter}
              onChange={(event) => setChapterFilter(event.target.value)}
            >
              <option value="">全部章节</option>
              {chapters.map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </label>
        </div>
      </MobileBottomSheet>
      <div className="grid gap-4 xl:grid-cols-2">
        {visibleQuestions.map((question) => (
          <WrongQuestionCard key={question.id} question={question} />
        ))}
      </div>
      {visibleCount < wrongQuestions.length ? (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <span className="text-sm text-[var(--color-muted)]">
            已显示 {visibleCount} / {wrongQuestions.length} 题，下滑加载更多…
          </span>
        </div>
      ) : null}
    </div>
  );
}
