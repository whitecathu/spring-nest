import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { useReducedMotion } from '../../lib/animations';

interface ErrorStateProps {
  icon?: ComponentType<LucideProps>;
  title: ReactNode;
  description?: ReactNode;
  /** Pass `error?.message` here to surface a technical detail. */
  detail?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

/**
 * Unified error state — more proactive than a toast for page/route level
 * failures (e.g. failed async load, Supabase unavailable without a graceful
 * fallback). Announces via role="alert" so screen readers interrupt.
 */
export default function ErrorState({
  icon: Icon = AlertTriangle,
  title,
  description,
  detail,
  action,
  secondaryAction,
  className = '',
}: ErrorStateProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`surface-glass flex flex-col items-center gap-4 rounded-3xl px-8 py-10 max-w-lg mx-auto text-center ${
        reducedMotion ? '' : 'fade-in-up motion-safe:duration-500'
      } ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">
        <Icon className="w-10 h-10" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-on-surface">{title}</h3>
        {description && (
          <p className="text-sm text-secondary leading-relaxed">{description}</p>
        )}
        {detail && (
          <p className="text-xs text-secondary/80 break-words font-mono mt-2">{detail}</p>
        )}
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