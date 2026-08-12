import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import {
  getCurrentUser,
  login,
  register,
  logout,
  updateProfile,
  isUsingSupabase,
  onAuthStateChange,
  supabaseGetCurrentUser,
  supabaseSignOut,
  ensureSupabaseProfile,
  type ProfileUpdateResult,
} from '../services/authService';
import {
  mergeGuestData,
  syncSettingsFromCloud,
  syncSettingsToCloud,
} from '../services/cloudSyncService';
import { loadFavoritesFromCloud } from '../services/favoriteService';
import {
  loadBookkeepingFromCloud,
  loadBudgetsFromCloud,
  loadCategoriesFromCloud,
  loadRecurringFromCloud,
  loadLedgersFromCloud,
} from '../services/bookkeepingSyncService';
import type { LoginResult, RegisterResult } from '../types/user';
import { SYNC_ERROR_EVENT } from '../services/syncResult';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  bio: string;
  createdAt: string;
}

interface UserContextType {
  user: UserProfile | null;
  isGuest: boolean;
  isSupabaseEnabled: boolean;
  language: 'zh' | 'en';
  setLanguage: (lang: 'zh' | 'en') => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, username?: string) => Promise<RegisterResult>;
  logout: () => void;
  updateProfile: (
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>,
  ) => Promise<ProfileUpdateResult>;
  refreshUser: () => UserProfile | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncError: string | null;
  retrySync: () => Promise<void>;
  t: (zh: string, en: string) => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function unwrapSyncResult<T>(result: unknown): T {
  if (!result || typeof result !== 'object' || !('ok' in result)) {
    throw new Error('云端返回了无效的同步结果');
  }
  const syncResult = result as { ok: true; data: T } | { ok: false; message: string };
  if (syncResult.ok === false) throw new Error(syncResult.message);
  return syncResult.data;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const syncGenerationRef = useRef(0);
  const [language, setLanguage] = useState<'zh' | 'en'>(() => {
    try {
      return (localStorage.getItem('spring_nest_lang') as 'zh' | 'en') || 'zh';
    } catch {
      // localStorage may be unavailable; default to Chinese
      return 'zh';
    }
  });

  const supabaseEnabled = isUsingSupabase();

  useEffect(() => {
    const handleSyncError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setSyncStatus('error');
      setLastSyncError(detail?.message || '云同步失败，请稍后重试');
    };
    window.addEventListener(SYNC_ERROR_EVENT, handleSyncError);
    return () => window.removeEventListener(SYNC_ERROR_EVENT, handleSyncError);
  }, []);

  const refreshUserFromStorage = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    return current;
  }, []);

  const syncSignedInSupabaseUser = useCallback(async (supaUser: SupabaseAuthUser) => {
    const generation = ++syncGenerationRef.current;
    setSyncStatus('syncing');
    setLastSyncError(null);

    try {
      const profile = await ensureSupabaseProfile(supaUser);
      if (generation !== syncGenerationRef.current) return;
      setUser(profile);

      unwrapSyncResult(await mergeGuestData(supaUser.id));

      const [
        bookkeepingResult,
        favoritesResult,
        settingsResult,
        budgetsResult,
        categoriesResult,
        recurringResult,
        ledgersResult,
      ] = await Promise.all([
        loadBookkeepingFromCloud(supaUser.id),
        loadFavoritesFromCloud(supaUser.id),
        syncSettingsFromCloud(supaUser.id),
        loadBudgetsFromCloud(supaUser.id),
        loadCategoriesFromCloud(supaUser.id),
        loadRecurringFromCloud(supaUser.id),
        loadLedgersFromCloud(supaUser.id),
      ]);

      unwrapSyncResult(bookkeepingResult);
      unwrapSyncResult(favoritesResult);
      const cloudSettings = unwrapSyncResult<{
        theme: string;
        language: string;
      } | null>(settingsResult);
      unwrapSyncResult(budgetsResult);
      unwrapSyncResult(categoriesResult);
      unwrapSyncResult(recurringResult);
      unwrapSyncResult(ledgersResult);

      if (cloudSettings?.theme) {
        localStorage.setItem('spring_nest_theme', cloudSettings.theme);
      }
      if (cloudSettings?.language === 'en' || cloudSettings?.language === 'zh') {
        setLanguage(cloudSettings.language);
      }
      if (generation !== syncGenerationRef.current) return;
      setSyncStatus('synced');
      setLastSyncError(null);
    } catch (error) {
      if (generation !== syncGenerationRef.current) return;
      setSyncStatus('error');
      setLastSyncError(error instanceof Error ? error.message : '云同步失败，请稍后重试');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('spring_nest_lang', language);
    // Keep <html lang> in sync so screen readers pronounce content correctly
    // and search engines index the right language. Falls back to attribute
    // clear if DOM is unavailable (SSR / non-browser).
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    }
    // Sync language to cloud if logged in
    if (supabaseEnabled && user) {
      const theme = localStorage.getItem('spring_nest_theme') || 'system';
      void syncSettingsToCloud(user.id, { theme, language }).then((result) => {
        try {
          unwrapSyncResult(result);
        } catch (error) {
          setSyncStatus('error');
          setLastSyncError(error instanceof Error ? error.message : '设置同步失败');
        }
      });
    }
  }, [language, supabaseEnabled, user]);

  // Supabase auth state listener
  useEffect(() => {
    if (!supabaseEnabled) return;

    const {
      data: { subscription },
    } = onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        window.setTimeout(() => {
          void syncSignedInSupabaseUser(session.user);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        // Keep local data, just clear the current signed-in user.
        syncGenerationRef.current += 1;
        logout();
        setUser(null);
        setSyncStatus('idle');
        setLastSyncError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseEnabled, syncSignedInSupabaseUser]);

  // On mount: if Supabase is configured, check for existing session
  useEffect(() => {
    if (!supabaseEnabled) return;

    supabaseGetCurrentUser()
      .then((supaUser) => {
        if (supaUser) {
          void syncSignedInSupabaseUser(supaUser);
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, [supabaseEnabled, syncSignedInSupabaseUser]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const handleRegister = useCallback(
    async (email: string, password: string, username?: string): Promise<RegisterResult> => {
      const result = await register(email, password, username);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    },
    [],
  );

  const handleLogout = useCallback(() => {
    syncGenerationRef.current += 1;
    if (supabaseEnabled) {
      supabaseSignOut().catch(() => {});
    }
    logout();
    setUser(null);
    setSyncStatus('idle');
    setLastSyncError(null);
  }, [supabaseEnabled]);

  const handleUpdateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => {
      const generation = syncGenerationRef.current;
      const result = await updateProfile(updates);
      if (generation === syncGenerationRef.current && result.success && result.user) {
        setUser(result.user);
      }
      return result;
    },
    [],
  );

  const retrySync = useCallback(async () => {
    if (!supabaseEnabled) {
      setSyncStatus('idle');
      setLastSyncError(null);
      return;
    }
    const supaUser = await supabaseGetCurrentUser();
    if (!supaUser) {
      setSyncStatus('error');
      setLastSyncError('登录会话已失效，请重新登录');
      return;
    }
    await syncSignedInSupabaseUser(supaUser);
  }, [supabaseEnabled, syncSignedInSupabaseUser]);

  const t = useCallback((zh: string, en: string) => (language === 'en' ? en : zh), [language]);

  const value = useMemo(
    () => ({
      user,
      isGuest: !user,
      isSupabaseEnabled: supabaseEnabled,
      language,
      setLanguage,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      updateProfile: handleUpdateProfile,
      refreshUser: refreshUserFromStorage,
      syncStatus,
      lastSyncError,
      retrySync,
      t,
    }),
    [
      user,
      supabaseEnabled,
      language,
      handleLogin,
      handleRegister,
      handleLogout,
      handleUpdateProfile,
      refreshUserFromStorage,
      syncStatus,
      lastSyncError,
      retrySync,
      t,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
