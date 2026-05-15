import { useState, type FormEvent } from 'react';
import type { Difficulty, Question, QuestionType } from '../../types/question';
import { SoftButton } from '../common/SoftButton';

interface QuestionEditorProps {
  question: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [draft, setDraft] = useState({
    question: question.question,
    type: question.type,
    options: (question.options ?? []).join('\n'),
    answer: Array.isArray(question.answer) ? question.answer.join(', ') : (question.answer ?? ''),
    explanation: question.explanation ?? '',
    tags: (question.tags ?? []).join(', '),
    chapter: question.chapter ?? '',
    difficulty: question.difficulty ?? '',
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...question,
      question: draft.question.trim(),
      type: draft.type as QuestionType,
      options: draft.options
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      answer:
        draft.type === 'multiple'
          ? draft.answer
              .split(/[，,、]/)
              .map((item) => item.trim())
              .filter(Boolean)
          : draft.answer.trim(),
      explanation: draft.explanation.trim(),
      tags: draft.tags
        .split(/[，,、]/)
        .map((item) => item.trim())
        .filter(Boolean),
      chapter: draft.chapter.trim() || undefined,
      difficulty: (draft.difficulty || undefined) as Difficulty | undefined,
    });
  }

  return (
    <form
      className="mt-4 space-y-4 rounded-[1.25rem] bg-[color:rgb(255_255_255_/_0.64)] p-4"
      onSubmit={submit}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">题干</span>
        <textarea
          className="min-h-28 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          value={draft.question}
          onChange={(event) => setDraft({ ...draft, question: event.target.value })}
          required
          placeholder="输入题干"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">题型</span>
          <select
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
            value={draft.type}
            onChange={(event) => setDraft({ ...draft, type: event.target.value as QuestionType })}
          >
            <option value="single">单选</option>
            <option value="multiple">多选</option>
            <option value="judge">判断</option>
            <option value="blank">填空</option>
            <option value="short">简答</option>
            <option value="flashcard">背诵卡</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">难度</span>
          <select
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
            value={draft.difficulty}
            onChange={(event) => setDraft({ ...draft, difficulty: event.target.value })}
          >
            <option value="">未分级</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">标签</span>
          <input
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
            value={draft.tags}
            onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
            placeholder="标签用逗号分隔"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">章节</span>
          <input
            className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
            value={draft.chapter}
            onChange={(event) => setDraft({ ...draft, chapter: event.target.value })}
            placeholder="例如 第一章"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">选项</span>
        <textarea
          className="min-h-24 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          value={draft.options}
          onChange={(event) => setDraft({ ...draft, options: event.target.value })}
          placeholder="每行一个选项，例如 A. 选项一"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">答案</span>
          <textarea
            className="min-h-20 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            value={draft.answer}
            onChange={(event) => setDraft({ ...draft, answer: event.target.value })}
            placeholder="多选答案用逗号分隔"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">解析</span>
          <textarea
            className="min-h-20 w-full rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            value={draft.explanation}
            onChange={(event) => setDraft({ ...draft, explanation: event.target.value })}
            placeholder="补充解析"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <SoftButton variant="primary" type="submit">
          保存
        </SoftButton>
        <SoftButton onClick={onCancel}>取消</SoftButton>
      </div>
    </form>
  );
}
