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
type SentryModule = typeof import('@sentry/react');

let analyticsEnabled = false;
let configuredReporter: Reporter | null = null;
let sentryModule: SentryModule | null = null;
let consentGeneration = 0;
let initializationPromise: Promise<void> | null = null;

async function initializeSentry(generation: number): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!analyticsEnabled || !dsn) return;
  if (sentryModule) return;

  try {
    const Sentry = await import('@sentry/react');
    if (!analyticsEnabled || generation !== consentGeneration) return;

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
      sendDefaultPii: false,
      beforeSend(event) {
        return analyticsEnabled ? event : null;
      },
    });

    if (!analyticsEnabled || generation !== consentGeneration) {
      await Sentry.close(0);
      return;
    }

    sentryModule = Sentry;
    configuredReporter = (error, context) => {
      if (!analyticsEnabled) return;
      Sentry.captureException(error, {
        extra: context ?? {},
        tags: context?.source ? { source: context.source } : undefined,
      });
    };
  } catch {
    sentryModule = null;
    configuredReporter = null;
  }
}

/**
 * Gates whether non-console reporting is active. Called by ConsentContext
 * once the user accepts analytics cookies. Safe to call multiple times.
 */
export async function setAnalyticsConsent(enabled: boolean): Promise<void> {
  analyticsEnabled = enabled;
  const generation = ++consentGeneration;

  if (!enabled) {
    configuredReporter = null;
    const activeSentry = sentryModule;
    sentryModule = null;
    initializationPromise = null;
    if (activeSentry) {
      try {
        await activeSentry.close(0);
      } catch {
        // Consent revocation must remain reliable even if the SDK shutdown fails.
      }
    }
    return;
  }

  if (!initializationPromise && !sentryModule) {
    const pendingInitialization = initializeSentry(generation);
    initializationPromise = pendingInitialization;
    try {
      await pendingInitialization;
    } finally {
      if (initializationPromise === pendingInitialization) {
        initializationPromise = null;
      }
    }
    return;
  }
  await initializationPromise;
}

/**
 * Plug a concrete reporter (e.g. a thin `Sentry.captureException` wrapper).
 * The consent-gated lazy initializer uses this seam; tests and alternate
 * deployments may also install a reporter explicitly.
 */
export function configureErrorReporter(reporter: Reporter | null): void {
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
