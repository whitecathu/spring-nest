import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
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
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => UserProfile | null;
  refreshUser: () => UserProfile | null;
  t: (zh: string, en: string) => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [language, setLanguage] = useState<'zh' | 'en'>(() => {
    try {
      return (localStorage.getItem('spring_nest_lang') as 'zh' | 'en') || 'zh';
    } catch {
      // localStorage may be unavailable; default to Chinese
      return 'zh';
    }
  });

  const supabaseEnabled = isUsingSupabase();

  const refreshUserFromStorage = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    return current;
  }, []);

  const syncSignedInSupabaseUser = useCallback(async (supaUser: SupabaseAuthUser) => {
    const profile = await ensureSupabaseProfile(supaUser);
    setUser(profile);

    // Merge guest data to cloud
    await mergeGuestData(supaUser.id);

    // Load bookkeeping from cloud
    await loadBookkeepingFromCloud(supaUser.id);

    // Load favorites from cloud
    await loadFavoritesFromCloud(supaUser.id);

    // Load settings from cloud
    const cloudSettings = await syncSettingsFromCloud(supaUser.id);
    if (cloudSettings) {
      if (cloudSettings.theme) {
        localStorage.setItem('spring_nest_theme', cloudSettings.theme);
      }
      if (cloudSettings.language === 'en' || cloudSettings.language === 'zh') {
        setLanguage(cloudSettings.language);
      }
    }

    // Load bookkeeping budgets from cloud
    await loadBudgetsFromCloud(supaUser.id);

    // Load bookkeeping categories from cloud
    await loadCategoriesFromCloud(supaUser.id);

    // Load bookkeeping recurring rules from cloud
    await loadRecurringFromCloud(supaUser.id);

    // Load bookkeeping ledgers from cloud
    await loadLedgersFromCloud(supaUser.id);
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
      syncSettingsToCloud(user.id, { theme, language }).catch(() => {});
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
        logout();
        setUser(null);
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
    if (supabaseEnabled) {
      supabaseSignOut().catch(() => {});
    }
    logout();
    setUser(null);
  }, [supabaseEnabled]);

  const handleUpdateProfile = useCallback(
    (updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => {
      const updated = updateProfile(updates);
      if (updated) {
        setUser(updated);
      }
      return updated;
    },
    [],
  );

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
