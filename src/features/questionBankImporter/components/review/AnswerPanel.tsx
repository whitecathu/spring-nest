import type { Question } from '../../types/question';

export function AnswerPanel({
  question,
  visible,
  hideAnswer = false,
}: {
  question: Question;
  visible: boolean;
  hideAnswer?: boolean;
}) {
  if (!visible) return null;
  return (
    <div className="animate-answer-reveal space-y-3 rounded-[1.25rem] border border-[color:rgb(47_111_79_/_0.16)] bg-[var(--color-primary-soft)] p-4 text-sm shadow-[0_12px_28px_rgb(26_51_38_/_0.08)]">
      {!hideAnswer ? (
        <div>
          <span className="font-semibold text-[var(--color-primary)]">答案：</span>
          <span className="text-[var(--color-ink)]">
            {Array.isArray(question.answer)
              ? question.answer.join(', ')
              : (question.answer ?? '未填写')}
          </span>
        </div>
      ) : null}
      {question.explanation ? (
        <div>
          <span className="font-semibold text-[var(--color-primary)]">解析：</span>
          <span className="text-[var(--color-ink)]">{question.explanation}</span>
        </div>
      ) : null}
    </div>
  );
}
