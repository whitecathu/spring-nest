import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function MobileBottomSheet({ open, title, onClose, children }: MobileBottomSheetProps) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-[color:rgb(22_31_26_/_0.42)]"
        aria-label={`关闭${title}`}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[1.75rem] border border-[var(--color-outline-soft)] bg-[var(--color-bg)] p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--color-ink)]">{title}</h2>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-[color:rgb(255_255_255_/_0.72)] text-[var(--color-ink)]"
            aria-label={`关闭${title}`}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
