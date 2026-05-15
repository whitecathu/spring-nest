import type { ReactNode } from 'react';
import { SpringBackground } from './SpringBackground';
import { ToolHeader } from './ToolHeader';
import type { AppView } from '../../store/questionBankStore';

interface AppShellProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  questionCount: number;
  toast?: { kind: 'success' | 'warning' | 'error'; message: string };
  onDismissToast: () => void;
  children: ReactNode;
}

const toastColor = {
  success:
    'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[color:rgb(76_140_110_/_0.22)]',
  warning:
    'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[color:rgb(158_102_16_/_0.22)]',
  error:
    'bg-[var(--color-error-soft)] text-[var(--color-error)] border-[color:rgb(186_26_26_/_0.22)]',
};

export function AppShell({
  activeView,
  onViewChange,
  questionCount,
  toast,
  onDismissToast,
  children,
}: AppShellProps) {
  return (
    <SpringBackground>
      <ToolHeader
        activeView={activeView}
        onViewChange={onViewChange}
        questionCount={questionCount}
      />
      <div className="animate-soft-in mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </div>
      {toast ? (
        <div
          role="status"
          className={`fixed bottom-4 left-4 right-4 z-30 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-soft md:left-auto md:right-8 md:w-[420px] ${toastColor[toast.kind]}`}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{toast.message}</span>
            <button type="button" className="min-h-8 rounded-full px-2" onClick={onDismissToast}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </SpringBackground>
  );
}
