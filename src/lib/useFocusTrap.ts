import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(',');

export interface FocusTrapOptions {
  /** Element that should receive initial focus on activation. Defaults to first focusable. */
  initialFocus?: HTMLElement | null;
  /** Called when Escape is pressed (typically closes the modal). */
  onEscape?: () => void;
  /** Whether the trap is active. When false, the hook is a no-op. */
  enabled?: boolean;
}

/**
 * Trap keyboard focus inside `containerRef` while `enabled`. Restores focus to
 * the previously-focused element on cleanup. Cycles Tab/Shift+Tab within the
 * container; Escape triggers `onEscape`.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useFocusTrap(ref, { enabled: isOpen, onEscape: () => setOpen(false) });
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {},
): void {
  const { initialFocus, onEscape, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    // Remember the element that had focus before we opened the trap so we can
    // hand it back on teardown.
    const previouslyFocused =
      typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null;

    // Move focus into the dialog.
    const focusTarget =
      initialFocus ??
      (container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? container);
    // Defer a tick so transition/mount completes before we steal focus.
    const t = window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 0);

    const getFocusable = (): HTMLElement[] =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const candidates = getFocusable();
      if (candidates.length === 0) {
        e.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = candidates[0];
      const last = candidates[candidates.length - 1];
      const activeEl =
        typeof document !== 'undefined'
          ? (document.activeElement as HTMLElement | null)
          : null;

      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (activeEl === last || !container.contains(activeEl)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    // Attach to the container so multiple traps can coexist without leaking.
    container.addEventListener('keydown', handleKey);

    return () => {
      window.clearTimeout(t);
      container.removeEventListener('keydown', handleKey);
      // Restore focus to where the user was before opening.
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [containerRef, enabled, initialFocus, onEscape]);
}