/**
 * Web Vitals reporting — `LCP / CLS / INP / TTFB / FCP`.
 *
 * Forwards metrics as Sentry breadcrumbs (when initialised) and to the app's
 * analytics tracker. Breadcrumbs are passive: they only ship if a later
 * consent-gated error report is sent, so perf observation stays anonymous.
 */
import type { Metric } from 'web-vitals/attribution';
import { trackPageView } from './analytics';

let started = false;

function handleMetric(metric: Metric) {
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.debug(`[web-vitals] ${metric.name}`, {
      id: metric.id,
      value: metric.value,
      rating: metric.rating,
    });
  }

  // Sentry breadcrumb for correlating perf with later crashes.
  void import('@sentry/react').then((Sentry) => {
    Sentry.addBreadcrumb({
      category: 'web-vital',
      message: `${metric.name}: ${Number(metric.value.toFixed(2))} (${metric.rating})`,
      level: 'info',
    });
  }).catch(() => {
    /* Sentry not present — ignore */
  });

  // Light touch custom analytics event (no-op in dev).
  trackPageView(`/${metric.name}/${metric.rating}`);
}

export function reportWebVitals() {
  if (started || typeof window === 'undefined') return;
  started = true;

  void import('web-vitals/attribution').then(({ onCLS, onINP, onLCP, onTTFB, onFCP }) => {
    onCLS(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onFCP(handleMetric);
  });
}