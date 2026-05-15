import { Eye, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { createReviewMeta } from '../../lib/utils/normalize';
import { getQuestionTypeLabel, useQuestionBankStore } from '../../store/questionBankStore';
import type { Question } from '../../types/question';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';

export function WrongQuestionCard({ question }: { question: Question }) {
  const meta = useQuestionBankStore(
    (state) => state.reviewMeta[question.id] ?? createReviewMeta(question.id),
  );
  const actions = useQuestionBankStore((state) => state.actions);
  const [visible, setVisible] = useState(false);

  return (
    <GlassCard className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--color-error-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-error)]">
              错 {meta.wrongCount} 次
            </span>
            <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              {getQuestionTypeLabel(question.type)}
            </span>
            <span className="rounded-full bg-[color:rgb(255_255_255_/_0.65)] px-3 py-1 text-xs text-[var(--color-muted)]">
              掌握度 {meta.masteryLevel}
            </span>
          </div>
          <h3 className="whitespace-pre-wrap text-lg font-bold text-[var(--color-ink)]">
            {question.question}
          </h3>
          <p className="mt-2 text-xs text-[var(--color-muted)]">{question.sourceFile}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SoftButton
            icon={<Play size={16} aria-hidden="true" />}
            onClick={() => actions.startReview([question.id])}
          >
            重新练习
          </SoftButton>
          <SoftButton
            icon={<RotateCcw size={16} aria-hidden="true" />}
            onClick={() => actions.removeWrong(question.id)}
          >
            移出错题本
          </SoftButton>
        </div>
      </div>

      <SoftButton
        icon={<Eye size={16} aria-hidden="true" />}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? '收起答案' : '查看答案和解析'}
      </SoftButton>

      {visible ? (
        <div className="rounded-2xl bg-[var(--color-primary-soft)] p-4 text-sm">
          <p>
            <span className="font-semibold text-[var(--color-primary)]">答案：</span>
            {Array.isArray(question.answer)
              ? question.answer.join(', ')
              : (question.answer ?? '未填写')}
          </p>
          <p className="mt-2 text-[var(--color-muted)]">{question.explanation || '暂无解析'}</p>
        </div>
      ) : null}
    </GlassCard>
  );
}
