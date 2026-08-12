import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { useReducedMotion } from '../../lib/animations';

interface EmptyStateProps {
  icon?: ComponentType<LucideProps>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  /** Visual size preset. Defaults to "default". */
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-8 h-8', wrap: 'w-8 h-8', pad: 'px-6 py-6' },
  default: { icon: 'w-10 h-10', wrap: 'w-14 h-14', pad: 'px-8 py-10' },
  lg: { icon: 'w-12 h-12', wrap: 'w-20 h-20', pad: 'px-10 py-14' },
} as const;

/**
 * Unified empty state for lists, search results, favorites, etc.
 * Accessible: announces to assistive tech via role="status".
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'default',
  className = '',
}: EmptyStateProps) {
  const reducedMotion = useReducedMotion();
  const s = sizeMap[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`surface-glass flex flex-col items-center gap-4 rounded-3xl ${s.pad} max-w-lg mx-auto text-center ${
        reducedMotion ? '' : 'fade-in-up motion-safe:duration-500'
      } ${className}`}
    >
      {Icon && (
        <div
          className={`${s.wrap} rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center`}
        >
          <Icon className={s.icon} aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-on-surface">{title}</h3>
        {description && <p className="text-sm text-secondary leading-relaxed">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
