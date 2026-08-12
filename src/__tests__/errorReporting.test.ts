import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => ({
  loaded: false,
  init: vi.fn(),
  close: vi.fn(() => Promise.resolve(true)),
  captureException: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
}));

vi.mock('@sentry/react', () => {
  sentryMocks.loaded = true;
  return sentryMocks;
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.invalid/1');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  sentryMocks.loaded = false;
  sentryMocks.init.mockClear();
  sentryMocks.close.mockClear();
  sentryMocks.captureException.mockClear();
  sentryMocks.browserTracingIntegration.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('consent-gated error reporting', () => {
  it('does not load or initialise Sentry before explicit analytics consent', async () => {
    await import('../lib/errorReporting');
    expect(sentryMocks.loaded).toBe(false);
    expect(sentryMocks.init).not.toHaveBeenCalled();
  });

  it('loads Sentry only after consent and configures privacy-safe defaults', async () => {
    const reporting = await import('../lib/errorReporting');

    await reporting.setAnalyticsConsent(true);

    expect(sentryMocks.init).toHaveBeenCalledTimes(1);
    expect(sentryMocks.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@example.invalid/1',
        sendDefaultPii: false,
        beforeSend: expect.any(Function),
      }),
    );
  });

  it('closes Sentry and clears the reporter when consent is withdrawn', async () => {
    const reporting = await import('../lib/errorReporting');
    const error = new Error('private failure');

    await reporting.setAnalyticsConsent(true);
    reporting.reportError(error);
    expect(sentryMocks.captureException).toHaveBeenCalledTimes(1);

    await reporting.setAnalyticsConsent(false);
    reporting.reportError(error);

    expect(sentryMocks.close).toHaveBeenCalled();
    expect(sentryMocks.captureException).toHaveBeenCalledTimes(1);
  });

  it('checks current consent again in beforeSend', async () => {
    const reporting = await import('../lib/errorReporting');
    await reporting.setAnalyticsConsent(true);
    const options = sentryMocks.init.mock.calls[0]?.[0] as {
      beforeSend: (event: object) => object | null;
    };
    const event = { event_id: 'event-1' };

    expect(options.beforeSend(event)).toBe(event);
    await reporting.setAnalyticsConsent(false);
    expect(options.beforeSend(event)).toBeNull();
  });
});
