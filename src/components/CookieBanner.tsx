import { Cookie } from 'lucide-react';
import { useConsent } from '../contexts/ConsentContext';
import { useUser } from '../contexts/UserContext';
import { useReducedMotion } from '../lib/animations';

/**
 * GDPR-style consent banner shown on first visit (and whenever the user
 * hasn't yet made a choice). Offers the three legal choices: accept all,
 * reject all (necessary-only), or customise (toast drawer here merely toggles
 * analytics on/off via the Manage button). Visual language matches the app:
 * glass surface card, motion-gated by reduced-motion.
 */
export default function CookieBanner() {
  const { hasDecided, acceptAll, rejectAll } = useConsent();
  const { t } = useUser();
  const reducedMotion = useReducedMotion();

  if (hasDecided) return null;

  return (
    <div
      role="region"
      aria-label={t('Cookie 同意', 'Cookie consent')}
      className={`fixed inset-x-0 bottom-4 z-[70] mx-auto w-[calc(100%-2rem)] max-w-2xl ${
        reducedMotion ? '' : 'fade-in-up motion-safe:duration-500'
      }`}
    >
      <div className="surface-glass rounded-3xl border border-primary/10 px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.12)] sm:px-7 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {t(
                '我们使用 Cookie 保证核心功能运行(必要),并在你同意后用分析工具了解使用情况。详见',
                'We use cookies for core functionality (necessary), and only with your consent use analytics to understand usage. See our ',
              )}
              <a
                href="/privacy"
                className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t('隐私政策', 'Privacy Policy')}
              </a>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-full bg-surface-container-high px-5 py-2 text-sm font-semibold text-on-surface transition-colors hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t('仅必要', 'Necessary only')}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition-colors hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t('全部接受', 'Accept all')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}