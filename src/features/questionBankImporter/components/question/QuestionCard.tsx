import { Copy, Edit3, Heart, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { getDifficultyLabel, useQuestionBankStore } from '../../store/questionBankStore';
import type { Question, ReviewMeta } from '../../types/question';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';
import { QuestionTypeBadge } from './QuestionTypeBadge';
import { QuestionEditor } from './QuestionEditor';

interface QuestionCardProps {
  question: Question;
  meta: ReviewMeta;
}

export function QuestionCard({ question, meta }: QuestionCardProps) {
  const [editing, setEditing] = useState(false);
  const actions = useQuestionBankStore((state) => state.actions);

  function copyJson() {
    navigator.clipboard
      ?.writeText(JSON.stringify(question, null, 2))
      .then(() => undefined)
      .catch(() => undefined);
  }

  return (
    <GlassCard className="animate-soft-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <QuestionTypeBadge type={question.type} />
            <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              {getDifficultyLabel(question.difficulty)}
            </span>
            {meta.favorite ? (
              <span className="rounded-full bg-[var(--color-accent-peach)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                已收藏
              </span>
            ) : null}
            {meta.wrongCount > 0 ? (
              <span className="rounded-full bg-[var(--color-error-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-error)]">
                错 {meta.wrongCount}
              </span>
            ) : null}
          </div>
          <h3 className="whitespace-pre-wrap text-lg font-bold leading-7 text-[var(--color-ink)]">
            {question.question}
          </h3>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {question.sourceFile}
            {question.sourcePath ? ` / ${question.sourcePath}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SoftButton
            aria-label="收藏题目"
            icon={<Heart size={16} aria-hidden="true" />}
            onClick={() => actions.toggleFavorite(question.id)}
          >
            {meta.favorite ? '取消收藏' : '收藏'}
          </SoftButton>
          <SoftButton
            icon={<TriangleAlert size={16} aria-hidden="true" />}
            onClick={() => actions.markWrong(question.id)}
          >
            加入错题
          </SoftButton>
        </div>
      </div>

      {question.options?.length ? (
        <ol className="mt-4 grid gap-2 md:grid-cols-2">
          {question.options.map((option, index) => (
            <li
              key={`${index}-${option}`}
              className="rounded-2xl bg-[color:rgb(255_255_255_/_0.6)] px-3 py-2 text-sm text-[var(--color-ink)]"
            >
              {option}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-[var(--color-primary-soft)] p-3 text-sm">
          <span className="font-semibold text-[var(--color-primary)]">答案：</span>
          <span className="text-[var(--color-ink)]">
            {Array.isArray(question.answer)
              ? question.answer.join(', ')
              : (question.answer ?? '未填写')}
          </span>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface)] p-3 text-sm text-[var(--color-muted)]">
          {question.explanation || '暂无解析'}
        </div>
      </div>

      {question.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.tags.map((tag, index) => (
            <span
              key={`${index}-${tag}`}
              className="rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs text-[var(--color-ink)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-outline-soft)] pt-4">
        <SoftButton icon={<Edit3 size={16} aria-hidden="true" />} onClick={() => setEditing(true)}>
          编辑
        </SoftButton>
        <SoftButton icon={<Copy size={16} aria-hidden="true" />} onClick={copyJson}>
          复制 JSON
        </SoftButton>
        <SoftButton
          variant="danger"
          icon={<Trash2 size={16} aria-hidden="true" />}
          onClick={() => actions.deleteQuestion(question.id)}
        >
          删除
        </SoftButton>
      </div>

      {editing ? (
        <QuestionEditor
          question={question}
          onSave={(next) => {
            actions.updateQuestion(next);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : null}
    </GlassCard>
  );
}
