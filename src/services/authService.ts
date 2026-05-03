import type { UserAccount, LoginResult, RegisterResult } from '../types/user';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_USERS_KEY = 'spring_nest_users';
const STORAGE_CURRENT_USER_KEY = 'spring_nest_current_user';

function getUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_USERS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Filter out malformed entries (must have id, email, password)
    return parsed.filter(
      (u: unknown) =>
        u !== null &&
        typeof u === 'object' &&
        'id' in (u as Record<string, unknown>) &&
        'email' in (u as Record<string, unknown>) &&
        'password' in (u as Record<string, unknown>)
    ) as UserAccount[];
  } catch {
    return [];
  }
}

function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): Omit<UserAccount, 'password'> | null {
  try {
    const data = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed === null || typeof parsed !== 'object') return null;
    if (!('id' in parsed) || !('email' in parsed)) return null;
    return parsed as Omit<UserAccount, 'password'>;
  } catch {
    return null;
  }
}

function setCurrentUser(user: Omit<UserAccount, 'password'> | null): void {
  if (user) {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  }
}

function generateId(): string {
  return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function register(email: string, password: string, username?: string): RegisterResult {
  if (!isValidEmail(email)) {
    return { success: false, error: '邮箱格式不正确' };
  }
  if (!isValidPassword(password)) {
    return { success: false, error: '密码至少需要 6 位' };
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { success: false, error: '该邮箱已注册' };
  }

  const newUser: UserAccount = {
    id: generateId(),
    email,
    username: username || email.split('@')[0],
    password,
    bio: '',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...safeUser } = newUser;
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

export function login(email: string, password: string): LoginResult {
  if (!isValidEmail(email)) {
    return { success: false, error: '邮箱格式不正确' };
  }
  if (!isValidPassword(password)) {
    return { success: false, error: '密码至少需要 6 位' };
  }

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return { success: false, error: '邮箱或密码错误' };
  }

  const { password: _, ...safeUser } = user;
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

export function logout(): void {
  setCurrentUser(null);
}

export function updateProfile(updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>): Omit<UserAccount, 'password'> | null {
  const current = getCurrentUser();
  if (!current) return null;

  const users = getUsers();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) return null;

  if (updates.email) {
    if (!isValidEmail(updates.email)) return null;
  }

  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);

  const { password: _, ...safeUser } = users[idx];
  setCurrentUser(safeUser);
  return safeUser;
}

// Returns the effective user ID for storage (real user ID or 'guest')
export function getUserId(): string {
  const user = getCurrentUser();
  return user ? user.id : 'guest';
}

// ─── Supabase Auth Functions ────────────────────────────────────────────────

/** Check if Supabase is configured and available */
export function isUsingSupabase(): boolean {
  return isSupabaseConfigured();
}

/** Sign up with Supabase Auth */
export async function supabaseSignUp(
  email: string,
  password: string,
  username?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username || email.split('@')[0] },
      },
    });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      // Create profile in profiles table
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username || email.split('@')[0],
        bio: '',
      });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Sign in with Supabase Auth */
export async function supabaseSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Sign out from Supabase Auth */
export async function supabaseSignOut(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Silently fail - localStorage cleanup happens elsewhere
  }
}

/** Send password reset email */
export async function supabaseResetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Update current user's password */
export async function supabaseUpdatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Get current Supabase user */
export async function supabaseGetCurrentUser() {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** Get current Supabase session */
export async function supabaseGetSession() {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/** Listen for Supabase auth state changes */
export function onAuthStateChange(
  callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void
) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
