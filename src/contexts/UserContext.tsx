import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import {
  getCurrentUser,
  login,
  register,
  logout,
  updateProfile,
  isUsingSupabase,
  onAuthStateChange,
  supabaseGetCurrentUser,
} from '../services/authService';
import { mergeGuestData, syncSettingsFromCloud, syncSettingsToCloud } from '../services/cloudSyncService';
import { loadFavoritesFromCloud } from '../services/favoriteService';
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
  login: (email: string, password: string) => LoginResult;
  register: (email: string, password: string, username?: string) => RegisterResult;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => UserProfile | null;
  t: (zh: string, en: string) => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [language, setLanguage] = useState<'zh' | 'en'>(() => {
    try {
      return (localStorage.getItem('spring_nest_lang') as 'zh' | 'en') || 'zh';
    } catch {
      return 'zh';
    }
  });

  const supabaseEnabled = isUsingSupabase();

  useEffect(() => {
    localStorage.setItem('spring_nest_lang', language);
    // Sync language to cloud if logged in
    if (supabaseEnabled && user) {
      const theme = localStorage.getItem('spring_nest_theme') || 'system';
      syncSettingsToCloud(user.id, { theme, language }).catch(() => {});
    }
  }, [language, supabaseEnabled, user]);

  // Supabase auth state listener
  useEffect(() => {
    if (!supabaseEnabled) return;

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const supaUser = session.user;
        const username = (supaUser.user_metadata?.username as string) || supaUser.email?.split('@')[0] || 'User';

        // Create a UserProfile from Supabase user
        const profile: UserProfile = {
          id: supaUser.id,
          email: supaUser.email || '',
          username,
          bio: '',
          createdAt: supaUser.created_at || new Date().toISOString(),
        };

        // Save to localStorage as current user
        localStorage.setItem('spring_nest_current_user', JSON.stringify(profile));
        setUser(profile);

        // Merge guest data to cloud
        await mergeGuestData(supaUser.id);

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
      } else if (event === 'SIGNED_OUT') {
        // Keep localStorage data, just clear current user
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseEnabled]);

  // On mount: if Supabase is configured, check for existing session
  useEffect(() => {
    if (!supabaseEnabled) return;

    supabaseGetCurrentUser().then(supaUser => {
      if (supaUser) {
        const username = (supaUser.user_metadata?.username as string) || supaUser.email?.split('@')[0] || 'User';
        const profile: UserProfile = {
          id: supaUser.id,
          email: supaUser.email || '',
          username,
          bio: '',
          createdAt: supaUser.created_at || new Date().toISOString(),
        };
        localStorage.setItem('spring_nest_current_user', JSON.stringify(profile));
        setUser(profile);
      }
    }).catch(() => {
      // Silently fail
    });
  }, [supabaseEnabled]);

  const handleLogin = useCallback((email: string, password: string): LoginResult => {
    const result = login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const handleRegister = useCallback((email: string, password: string, username?: string): RegisterResult => {
    const result = register(email, password, username);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  const handleUpdateProfile = useCallback((updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => {
    const updated = updateProfile(updates);
    if (updated) {
      setUser(updated);
    }
    return updated;
  }, []);

  const t = useCallback((zh: string, en: string) => language === 'en' ? en : zh, [language]);

  const value = useMemo(() => ({
    user,
    isGuest: !user,
    isSupabaseEnabled: supabaseEnabled,
    language,
    setLanguage,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    t
  }), [user, supabaseEnabled, language, handleLogin, handleRegister, handleLogout, handleUpdateProfile, t]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
