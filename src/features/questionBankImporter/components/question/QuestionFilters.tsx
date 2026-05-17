import { Filter, Search } from 'lucide-react';
import {
  getQuestionTypeLabel,
  type QuestionFilters as Filters,
  type SortMode,
} from '../../store/questionBankStore';
import type { Question, QuestionType } from '../../types/question';
import { GlassCard } from '../common/GlassCard';

interface QuestionFiltersProps {
  questions: Question[];
  filters: Filters;
  searchQuery: string;
  sortMode: SortMode;
  onSearch: (query: string) => void;
  onFilters: (filters: Partial<Filters>) => void;
  onSort: (sort: SortMode) => void;
}

const questionTypes: Array<'all' | QuestionType> = [
  'all',
  'single',
  'multiple',
  'judge',
  'blank',
  'short',
  'flashcard',
];

export function QuestionFilters({
  questions,
  filters,
  searchQuery,
  sortMode,
  onSearch,
  onFilters,
  onSort,
}: QuestionFiltersProps) {
  const sourceFiles = [...new Set(questions.map((question) => question.sourceFile))].filter(
    Boolean,
  );
  const chapters = [...new Set(questions.map((question) => question.chapter))].filter(Boolean);
  const tags = [...new Set(questions.flatMap((question) => question.tags ?? []))].filter(Boolean);

  return (
    <GlassCard className="min-w-0 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
        <Filter size={18} aria-hidden="true" />
        题库筛选
      </div>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">搜索</span>
        <span className="flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 focus-within:border-[var(--color-primary)]">
          <Search size={17} className="text-[var(--color-muted)]" aria-hidden="true" />
          <input
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--color-muted)] md:text-sm"
            value={searchQuery}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="题干、答案、解析、章节、标签、来源"
          />
        </span>
      </label>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">题型</span>
          <select
            className="h-11 w-full min-w-0 rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base md:text-sm"
            value={filters.type}
            onChange={(event) => onFilters({ type: event.target.value as Filters['type'] })}
          >
            {questionTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? '全部题型' : getQuestionTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">来源</span>
          <select
            className="h-11 w-full min-w-0 rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base md:text-sm"
            value={filters.sourceFile}
            onChange={(event) => onFilters({ sourceFile: event.target.value })}
          >
            <option value="">全部来源</option>
            {sourceFiles.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">标签</span>
          <select
            className="h-11 w-full min-w-0 rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base md:text-sm"
            value={filters.tag}
            onChange={(event) => onFilters({ tag: event.target.value })}
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
            className="h-11 w-full min-w-0 rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base md:text-sm"
            value={filters.chapter}
            onChange={(event) => onFilters({ chapter: event.target.value })}
          >
            <option value="">全部章节</option>
            {chapters.map((chapter) => (
              <option key={chapter} value={chapter}>
                {chapter}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">排序</span>
          <select
            className="h-11 w-full min-w-0 rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-base md:text-sm"
            value={sortMode}
            onChange={(event) => onSort(event.target.value as SortMode)}
          >
            <option value="recent">最近导入</option>
            <option value="reviewed">最近复习</option>
            <option value="wrong">错误次数</option>
            <option value="mastery">掌握度</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[color:rgb(255_255_255_/_0.64)] px-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            checked={filters.favoriteOnly}
            onChange={(event) => onFilters({ favoriteOnly: event.target.checked })}
          />
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-md border border-[var(--color-outline)] bg-[var(--color-surface)] peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] after:hidden after:text-xs after:font-bold after:text-white after:content-['✓'] peer-checked:after:block"
          />
          收藏
        </label>
        <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[color:rgb(255_255_255_/_0.64)] px-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            checked={filters.wrongOnly}
            onChange={(event) => onFilters({ wrongOnly: event.target.checked })}
          />
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-md border border-[var(--color-outline)] bg-[var(--color-surface)] peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] after:hidden after:text-xs after:font-bold after:text-white after:content-['✓'] peer-checked:after:block"
          />
          错题
        </label>
      </div>
    </GlassCard>
  );
}
