import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// ── Sentry bootstrap (opt-in) ──────────────────────────────────────────────
// Sentry is only initialised when a DSN is configured at build time. Init is
// passive — actual error forwarding to Sentry is gated by user consent (see
// `setAnalyticsConsent` in errorReporting.ts); without consent the reporter
// remains a no-op even though Sentry is loaded. We keep init happening here so
// `<App/>`'s providers can wire consent gating on top.
async function bootstrapSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // No DSN configured — silently skip; reportError stays local.

  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
      integrations: [Sentry.browserTracingIntegration()],
      // Tracing can generate a fair amount of data and cost — keep it modest.
      tracesSampleRate: 0.4,
      // Respect reduced-motion / do-not-track at the source as a baseline, in
      // addition to the consent wall configured in errorReporting.ts.
      sendDefaultPii: false,
    });

    // Wire our reporter facade to Sentry.captureException.
    const { configureErrorReporter } = await import('./lib/errorReporting');
    configureErrorReporter((error, context) => {
      Sentry.captureException(error, {
        extra: context ?? {},
        tags: context?.source ? { source: context.source } : undefined,
      });
    });
  } catch {
    // If Sentry fails to load we degrade to console-only reporting.
  }
}

void bootstrapSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);