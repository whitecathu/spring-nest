export type BackgroundIntent = 'none' | 'search' | 'empty';

export const BACKGROUND_INTENT_EVENT = 'spring-nest-background-intent';

export function setBackgroundIntent(intent: BackgroundIntent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<BackgroundIntent>(BACKGROUND_INTENT_EVENT, { detail: intent }),
  );
}
