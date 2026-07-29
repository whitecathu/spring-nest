import { useState } from 'react';

interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

const ZH = '跳到主内容';
const EN = 'Skip to main content';

/**
 * Skip-to-content link, visually hidden until keyboard focus.
 * Meets WCAG 2.1 SC 2.4.1 (Bypass Blocks). On focus, the link slides into
 * view at top-left; clicking it moves focus to the main region so subsequent
 * Tab keystrokes continue from the first focusable element inside main.
 */
export default function SkipLink({
  targetId = 'main-content',
  label,
}: SkipLinkProps) {
  const [forcedLabel] = useState(label);

  return (
    <a
      href={`#${targetId}`}
      // sr-only until focus, then visible — same pattern Tailwind documents.
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-on-primary focus:font-semibold focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      onClick={(e) => {
        // Prevent the default anchor jump to a non-focusable container —
        // we want real focus, which screen readers respect better.
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: false });
          // Clean up after move so it doesn't become tab-stoppable.
          target.addEventListener(
            'blur',
            () => target.removeAttribute('tabindex'),
            { once: true },
          );
        }
      }}
    >
      {forcedLabel ?? `${ZH} / ${EN}`}
    </a>
  );
}