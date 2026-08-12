import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { syncSettingsToCloud } from '../services/cloudSyncService';
import { isUsingSupabase, getUserId } from '../services/authService';
import { publishSyncFailure } from '../services/syncResult';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredMode(): ThemeMode {
  try {
    return (localStorage.getItem('spring_nest_theme') as ThemeMode) || 'system';
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
    return 'system';
  }
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    mode === 'system' ? getSystemTheme() : mode,
  );

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem('spring_nest_theme', m);
    } catch {
      // localStorage write may fail; theme still applied to DOM
    }
    applyTheme(m);
    setResolved(m === 'system' ? getSystemTheme() : m);
    // Push theme to cloud if Supabase is configured and user is logged in
    if (isUsingSupabase()) {
      const userId = getUserId();
      if (userId && userId !== 'guest') {
        const language = localStorage.getItem('spring_nest_lang') || 'zh';
        void syncSettingsToCloud(userId, { theme: m, language }).then(publishSyncFailure);
      }
    }
  }, []);

  useEffect(() => {
    applyTheme(mode);
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    setResolved(resolved);

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        const r = e.matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', r === 'dark');
        setResolved(r);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, resolved }), [mode, setMode, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
