import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getQuestionTypeLabel, useQuestionBankStore } from '../../store/questionBankStore';
import type { Difficulty, QuestionType } from '../../types/question';
import { EmptyState } from '../common/EmptyState';
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

export function WrongBook() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const actions = useQuestionBankStore((state) => state.actions);
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all');
  const [chapterFilter, setChapterFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const chapters = useMemo(
    () => [...new Set(questions.map((question) => question.chapter))].filter(Boolean),
    [questions],
  );
  const tags = useMemo(
    () => [...new Set(questions.flatMap((question) => question.tags ?? []))].filter(Boolean),
    [questions],
  );
  const wrongQuestions = useMemo(
    () =>
      questions
        .filter((question) => (reviewMeta[question.id]?.wrongCount ?? 0) > 0)
        .filter((question) => typeFilter === 'all' || question.type === typeFilter)
        .filter(
          (question) => difficultyFilter === 'all' || question.difficulty === difficultyFilter,
        )
        .filter((question) => !chapterFilter || question.chapter === chapterFilter)
        .filter((question) => !tagFilter || (question.tags ?? []).includes(tagFilter))
        .sort((a, b) => (reviewMeta[b.id]?.wrongCount ?? 0) - (reviewMeta[a.id]?.wrongCount ?? 0)),
    [chapterFilter, difficultyFilter, questions, reviewMeta, tagFilter, typeFilter],
  );

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
        <div>
          <p className="text-sm font-semibold text-[var(--color-error)]">错题本</p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--color-ink)]">
            {wrongQuestions.length} 道题需要复盘
          </h1>
        </div>
        <SoftButton
          variant="primary"
          icon={<Play size={17} aria-hidden="true" />}
          onClick={() => actions.startReview(wrongQuestions.map((question) => question.id))}
        >
          练习错题
        </SoftButton>
      </div>
      <div className="grid gap-3 rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.58)] p-4 md:grid-cols-2 xl:grid-cols-4">
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
      <div className="grid gap-4 xl:grid-cols-2">
        {wrongQuestions.map((question) => (
          <WrongQuestionCard key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}
