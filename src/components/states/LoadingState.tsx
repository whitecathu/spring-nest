import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useReducedMotion } from '../../lib/animations';

interface LoadingStateProps {
  label?: ReactNode;
  hint?: ReactNode;
  /** Use "page" for route-level full-height fills, "inline" for card slots. */
  variant?: 'page' | 'inline';
  className?: string;
}

/**
 * Unified inline loading indicator. The heavier immersive loader (orbit dots +
 * particle field) remains `GameToolLoading` for game/tool route suspense;
 * this lighter component is for in-card / section loading, button-submit
 * placeholders, and small async regions.
 */
export default function LoadingState({
  label = '加载中… / Loading…',
  hint,
  variant = 'inline',
  className = '',
}: LoadingStateProps) {
  const reducedMotion = useReducedMotion();

  const content = (
    <div className="surface-glass flex flex-col items-center gap-3 rounded-3xl px-8 py-8 text-center">
      <Loader2
        className={`w-8 h-8 text-primary ${reducedMotion ? '' : 'animate-spin'}`}
        aria-hidden="true"
      />
      <div className="text-sm font-medium text-on-surface">{label}</div>
      {hint && <div className="text-xs text-secondary">{hint}</div>}
    </div>
  );

  if (variant === 'page') {
    return (
      <div role="status" aria-live="polite" className={`flex flex-grow items-center justify-center min-h-[50vh] px-4 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className={className}>
      {content}
    </div>
  );
}