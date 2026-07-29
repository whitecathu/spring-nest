import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { setAnalyticsConsent } from '../lib/errorReporting';

export type ConsentCategory = 'necessary' | 'analytics';
export interface ConsentState {
  /** Necessary cookies are always on — runtime cookie / store of truth. */
  necessary: true;
  analytics: boolean;
  /** When undefined, consent has not been recorded yet → show banner. */
  given: boolean;
}

interface ConsentContextValue {
  analytics: boolean;
  hasDecided: boolean;
  /** Accept all non-essential categories (analytics). */
  acceptAll: () => void;
  /** Keep only necessary cookies — disable analytics. */
  rejectAll: () => void;
  /** Persist an explicit "customised" choice. */
  setAnalytics: (enabled: boolean) => void;
}

const CONSENT_KEY = 'spring_nest_consent_v1';
const defaultState: ConsentState = { necessary: true, analytics: false, given: false };

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

function loadConsent(): ConsentState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed && typeof parsed.analytics === 'boolean' && typeof parsed.given === 'boolean') {
      return { necessary: true, analytics: parsed.analytics, given: parsed.given };
    }
    return defaultState;
  } catch {
    return defaultState;
  }
}

function persist(analytics: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ necessary: true, analytics, given: true }));
  } catch {
    /* localStorage may be unavailable — banner still flows in-memory this session */
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(loadConsent);

  // Whenever the user's decision changes, sync to the error reporter so
  // off-device error forwarding (Sentry) respects consent.
  useEffect(() => {
    setAnalyticsConsent(consent.analytics && consent.given);
  }, [consent.analytics, consent.given]);

  const acceptAll = useCallback(() => {
    persist(true);
    setConsent({ necessary: true, analytics: true, given: true });
  }, []);

  const rejectAll = useCallback(() => {
    persist(false);
    setConsent({ necessary: true, analytics: false, given: true });
  }, []);

  const setAnalytics = useCallback((enabled: boolean) => {
    persist(enabled);
    setConsent({ necessary: true, analytics: enabled, given: true });
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      analytics: consent.analytics,
      hasDecided: consent.given,
      acceptAll,
      rejectAll,
      setAnalytics,
    }),
    [consent.analytics, consent.given, acceptAll, rejectAll, setAnalytics],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (ctx === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return ctx;
}