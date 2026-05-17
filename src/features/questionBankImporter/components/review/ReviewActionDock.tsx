import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Heart,
  Home,
  RotateCcw,
  TriangleAlert,
  X,
} from 'lucide-react';

interface DockButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  tone?: 'plain' | 'primary' | 'danger';
}

function DockButton({ label, icon, onClick, disabled, active, tone = 'plain' }: DockButtonProps) {
  const toneClass =
    tone === 'primary' || active
      ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
      : tone === 'danger'
        ? 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
        : 'bg-[color:rgb(255_255_255_/_0.72)] text-[var(--color-ink)]';

  return (
    <button
      type="button"
      className={`inline-flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-[1rem] px-2 text-xs font-bold transition active:scale-[0.96] disabled:opacity-40 ${toneClass}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function DockFrame({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="question-bank-importer qb-portal-root qb-mobile-action-dock pointer-events-none fixed inset-x-3 z-40 md:hidden">
      {children}
    </div>,
    document.body,
  );
}

interface ReviewActionDockProps {
  favorite: boolean;
  canPrevious: boolean;
  canNext: boolean;
  answerVisible: boolean;
  submitted: boolean;
  isMemorize: boolean;
  isAnalysis: boolean;
  isMultipleChoice: boolean;
  usesRecallGrading: boolean;
  selectedCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onFavorite: () => void;
  onWrong: () => void;
  onRevealAnswer: () => void;
  onSubmitChoice: () => void;
  onForgot: () => void;
  onVague: () => void;
  onRemember: () => void;
}

export function ReviewActionDock({
  favorite,
  canPrevious,
  canNext,
  answerVisible,
  submitted,
  isMemorize,
  isAnalysis,
  isMultipleChoice,
  usesRecallGrading,
  selectedCount,
  onPrevious,
  onNext,
  onExit,
  onFavorite,
  onWrong,
  onRevealAnswer,
  onSubmitChoice,
  onForgot,
  onVague,
  onRemember,
}: ReviewActionDockProps) {
  if (isAnalysis) {
    return (
      <DockFrame>
        <div className="pointer-events-auto grid grid-cols-[1fr_1fr_1.4fr] gap-2 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.94)] p-2 shadow-soft backdrop-blur">
          <DockButton
            label="上一题"
            icon={<ArrowLeft size={17} aria-hidden="true" />}
            onClick={onPrevious}
            disabled={!canPrevious}
          />
          <DockButton
            label={favorite ? '已收藏' : '收藏'}
            icon={<Heart size={17} aria-hidden="true" />}
            onClick={onFavorite}
            active={favorite}
          />
          <DockButton
            label={canNext ? '下一题' : '退出'}
            icon={
              canNext ? (
                <ArrowRight size={17} aria-hidden="true" />
              ) : (
                <Home size={17} aria-hidden="true" />
              )
            }
            onClick={canNext ? onNext : onExit}
            tone="primary"
          />
        </div>
      </DockFrame>
    );
  }

  if ((isMemorize && answerVisible) || (usesRecallGrading && answerVisible && !submitted)) {
    return (
      <DockFrame>
        <div className="pointer-events-auto grid grid-cols-5 gap-2 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.94)] p-2 shadow-soft backdrop-blur">
          <DockButton
            label="上一题"
            icon={<ArrowLeft size={17} aria-hidden="true" />}
            onClick={onPrevious}
            disabled={!canPrevious}
          />
          <DockButton
            label="答错"
            icon={<RotateCcw size={17} aria-hidden="true" />}
            onClick={onForgot}
            disabled={submitted}
            tone="danger"
          />
          <DockButton
            label="模糊"
            icon={<X size={17} aria-hidden="true" />}
            onClick={onVague}
            disabled={submitted}
          />
          <DockButton
            label="答对"
            icon={<Check size={17} aria-hidden="true" />}
            onClick={onRemember}
            disabled={submitted}
            tone="primary"
          />
          <DockButton
            label={canNext ? '下一题' : '退出'}
            icon={
              canNext ? (
                <ArrowRight size={17} aria-hidden="true" />
              ) : (
                <Home size={17} aria-hidden="true" />
              )
            }
            onClick={canNext ? onNext : onExit}
          />
        </div>
      </DockFrame>
    );
  }

  const primaryLabel =
    isMultipleChoice && !submitted
      ? '提交'
      : answerVisible || submitted
        ? canNext
          ? '下一题'
          : '退出'
        : '答案';
  const primaryAction =
    isMultipleChoice && !submitted
      ? onSubmitChoice
      : answerVisible || submitted
        ? canNext
          ? onNext
          : onExit
        : onRevealAnswer;
  const primaryDisabled = isMultipleChoice && !submitted ? selectedCount === 0 : false;

  return (
    <DockFrame>
      <div
        className={`pointer-events-auto grid gap-2 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.94)] p-2 shadow-soft backdrop-blur ${
          submitted ? 'grid-cols-4' : 'grid-cols-[1fr_1fr_1.4fr]'
        }`}
      >
        <DockButton
          label="上一题"
          icon={<ArrowLeft size={17} aria-hidden="true" />}
          onClick={onPrevious}
          disabled={!canPrevious}
        />
        <DockButton
          label={favorite ? '已收藏' : '收藏'}
          icon={<Heart size={17} aria-hidden="true" />}
          onClick={onFavorite}
          active={favorite}
        />
        <DockButton
          label={primaryLabel}
          icon={
            primaryLabel === '答案' ? (
              <Eye size={17} aria-hidden="true" />
            ) : primaryLabel === '提交' ? (
              <Check size={17} aria-hidden="true" />
            ) : primaryLabel === '退出' ? (
              <Home size={17} aria-hidden="true" />
            ) : (
              <ArrowRight size={17} aria-hidden="true" />
            )
          }
          onClick={primaryAction}
          disabled={primaryDisabled}
          tone="primary"
        />
        {submitted ? (
          <DockButton
            label="错题"
            icon={<TriangleAlert size={17} aria-hidden="true" />}
            onClick={onWrong}
            tone="danger"
          />
        ) : null}
      </div>
    </DockFrame>
  );
}
