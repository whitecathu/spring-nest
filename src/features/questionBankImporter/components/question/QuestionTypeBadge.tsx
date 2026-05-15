import type { QuestionType } from '../../types/question';
import { getQuestionTypeLabel } from '../../store/questionBankStore';

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
      {getQuestionTypeLabel(type)}
    </span>
  );
}
