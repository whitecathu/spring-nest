const INTERACTIVE_SELECTOR = [
  '[data-forest-ui]',
  'a',
  'button',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[role="link"]',
  '.catalog-card-shell',
  'nav',
  'label',
].join(',');

/** True when the element (or an ancestor) is a forest-blocking interactive target. */
export function isInteractiveForestTarget(el: Element | null): boolean {
  if (!el || typeof el.closest !== 'function') return false;
  return Boolean(el.closest(INTERACTIVE_SELECTOR));
}

/**
 * True when the hit stack has no interactive targets.
 * Nodes under `[data-forest-decor]` are ignored unless they also match interactive selectors.
 */
export function isDecorativeHit(clientX: number, clientY: number): boolean {
  if (typeof document === 'undefined') return true;
  if (typeof document.elementsFromPoint !== 'function') return true;

  const stack = document.elementsFromPoint(clientX, clientY);
  for (const node of stack) {
    if (!(node instanceof Element)) continue;

    const decorRoot = node.closest('[data-forest-decor]');
    if (decorRoot && !isInteractiveForestTarget(node)) {
      continue;
    }

    if (isInteractiveForestTarget(node)) return false;
  }

  return true;
}
