import { Play } from 'lucide-react';
import { useMemo } from 'react';
import { useQuestionBankStore } from '../../store/questionBankStore';
import { EmptyState } from '../common/EmptyState';
import { SoftButton } from '../common/SoftButton';
import { WrongQuestionCard } from './WrongQuestionCard';

export function WrongBook() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const actions = useQuestionBankStore((state) => state.actions);
  const wrongQuestions = useMemo(
    () =>
      questions
        .filter((question) => (reviewMeta[question.id]?.wrongCount ?? 0) > 0)
        .sort((a, b) => (reviewMeta[b.id]?.wrongCount ?? 0) - (reviewMeta[a.id]?.wrongCount ?? 0)),
    [questions, reviewMeta],
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
      <div className="grid gap-4 xl:grid-cols-2">
        {wrongQuestions.map((question) => (
          <WrongQuestionCard key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}
