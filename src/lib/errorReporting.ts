/**
 * Error reporting facade — a single seam between the app and the underlying
 * telemetry provider (Sentry today). Sentry is initialised lazily and only
 * when (a) a DSN has been provided via `VITE_SENTRY_DSN` and (b) the user has
 * accepted analytics cookies via ConsentContext (see `setAnalyticsConsent`).
 *
 * Until those gates are satisfied, `reportError` is a safe console-only no-op.
 * Callers (ErrorBoundary, services) never need to conditionally import anything.
 */

export interface ErrorContext {
  componentStack?: string;
  source?: string;
  [key: string]: unknown;
}

type Reporter = (error: Error, context?: ErrorContext) => void;

let analyticsEnabled = false;
let configuredReporter: Reporter | null = null;

/**
 * Gates whether non-console reporting is active. Called by ConsentContext
 * once the user accepts analytics cookies. Safe to call multiple times.
 */
export function setAnalyticsConsent(enabled: boolean): void {
  analyticsEnabled = enabled;
}

/**
 * Plug a concrete reporter (e.g. a thin `Sentry.captureException` wrapper).
 * Installed during app bootstrap when the DSN is present.
 */
export function configureErrorReporter(reporter: Reporter): void {
  configuredReporter = reporter;
}

export function reportError(error: Error, context?: ErrorContext): void {
  // Always log locally — useful in every environment.
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error('[reportError]', error, context ?? '');
  }

  // Only forward off-device when the user has opted in and a reporter exists.
  if (!analyticsEnabled || !configuredReporter) return;

  try {
    configuredReporter(error, context);
  } catch {
    // Never let the reporter itself throw — it would shadow the original error.
  }
}