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
  const [expanded, setExpanded] = useState(false);
  const questionSummary =
    question.question.length > 112 ? `${question.question.slice(0, 112).trim()}...` : question.question;

  return (
    <GlassCard className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
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
            {meta.lastWrongAt ? (
              <span className="rounded-full bg-[color:rgb(255_255_255_/_0.65)] px-3 py-1 text-xs text-[var(--color-muted)]">
                最近错于 {new Date(meta.lastWrongAt).toLocaleDateString()}
              </span>
            ) : null}
            {question.chapter ? (
              <span className="rounded-full bg-[color:rgb(255_255_255_/_0.65)] px-3 py-1 text-xs text-[var(--color-muted)]">
                {question.chapter}
              </span>
            ) : null}
          </div>
          <h3 className="whitespace-pre-wrap break-words text-base font-bold leading-7 text-[var(--color-ink)] md:text-lg">
            <span className="md:hidden">{expanded ? question.question : questionSummary}</span>
            <span className="hidden md:inline">{question.question}</span>
          </h3>
          <p className="mt-2 break-words text-xs text-[var(--color-muted)]">{question.sourceFile}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SoftButton className="md:hidden" onClick={() => setExpanded((value) => !value)}>
            {expanded ? '收起' : '展开'}
          </SoftButton>
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
        <div className="min-w-0 rounded-2xl bg-[var(--color-primary-soft)] p-4 text-sm">
          <p>
            <span className="font-semibold text-[var(--color-primary)]">答案：</span>
            <span className="break-words">
              {Array.isArray(question.answer)
              ? question.answer.join(', ')
              : (question.answer ?? '未填写')}
            </span>
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-[var(--color-muted)]">
            {question.explanation || '暂无解析'}
          </p>
        </div>
      ) : null}
    </GlassCard>
  );
}
