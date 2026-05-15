import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { SoftButton } from './SoftButton';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.52)] px-5 py-10 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        {icon ?? <Inbox size={22} aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-xl text-sm text-[var(--color-muted)]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <SoftButton className="mt-5" variant="primary" onClick={onAction}>
          {actionLabel}
        </SoftButton>
      ) : null}
    </div>
  );
}
