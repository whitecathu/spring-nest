import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
}

export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div className="rounded-[1.25rem] border border-[color:rgb(186_26_26_/_0.24)] bg-[var(--color-error-soft)] p-4 text-[var(--color-error)]">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
