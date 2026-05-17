import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Question } from '../../types/question';

export function AnswerPanel({ question, visible }: { question: Question; visible: boolean }) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  if (!visible) return null;
  const hasExplanation = Boolean(question.explanation);
  return (
    <div className="animate-answer-reveal min-w-0 space-y-3 rounded-[1.25rem] border border-[color:rgb(47_111_79_/_0.16)] bg-[var(--color-primary-soft)] p-4 text-sm shadow-[0_12px_28px_rgb(26_51_38_/_0.08)]">
      <div>
        <span className="font-semibold text-[var(--color-primary)]">答案：</span>
        <span className="break-words text-[var(--color-ink)]">
          {Array.isArray(question.answer)
            ? question.answer.join(', ')
            : (question.answer ?? '未填写')}
        </span>
      </div>
      {hasExplanation ? (
        <div className="min-w-0">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl bg-[color:rgb(255_255_255_/_0.5)] px-3 text-left font-semibold text-[var(--color-primary)]"
            aria-expanded={analysisOpen}
            onClick={() => setAnalysisOpen((value) => !value)}
          >
            <span>查看解析</span>
            {analysisOpen ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
          </button>
          {analysisOpen ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-[var(--color-ink)]">
              {question.explanation}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
