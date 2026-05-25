import type { UserAccount, LoginResult, PublicUserAccount, RegisterResult } from '../types/user';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_USERS_KEY = 'spring_nest_users';
const STORAGE_CURRENT_USER_KEY = 'spring_nest_current_user';
const PASSWORD_HASH_PREFIX = 'local-v1:';

function hashPassword(email: string, password: string): string {
  const input = `${email.trim().toLowerCase()}:${password}:spring-nest-local-auth`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${PASSWORD_HASH_PREFIX}${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function toPublicUser(user: UserAccount): PublicUserAccount {
  const { password: _password, passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function getUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_USERS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Filter out malformed entries and accept legacy local records with plaintext passwords.
    return parsed.filter(
      (u: unknown) =>
        u !== null &&
        typeof u === 'object' &&
        'id' in (u as Record<string, unknown>) &&
        'email' in (u as Record<string, unknown>) &&
        ('passwordHash' in (u as Record<string, unknown>) ||
          'password' in (u as Record<string, unknown>)),
    ) as UserAccount[];
  } catch {
    return [];
  }
}

function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): PublicUserAccount | null {
  try {
    const data = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed === null || typeof parsed !== 'object') return null;
    if (!('id' in parsed) || !('email' in parsed)) return null;
    return parsed as PublicUserAccount;
  } catch {
    return null;
  }
}

function setCurrentUser(user: PublicUserAccount | null): void {
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
  if (users.find((u) => u.email === email)) {
    return { success: false, error: '该邮箱已注册' };
  }

  const newUser: UserAccount = {
    id: generateId(),
    email,
    username: username || email.split('@')[0],
    passwordHash: hashPassword(email, password),
    bio: '',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const safeUser = toPublicUser(newUser);
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
  const user = users.find((u) => {
    if (u.email !== email) return false;
    if (u.passwordHash) return u.passwordHash === hashPassword(email, password);
    return u.password === password;
  });

  if (!user) {
    return { success: false, error: '邮箱或密码错误' };
  }

  if (!user.passwordHash) {
    user.passwordHash = hashPassword(email, password);
    delete user.password;
    saveUsers(users);
  }

  const safeUser = toPublicUser(user);
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

export function logout(): void {
  setCurrentUser(null);
}

export function updateProfile(
  updates: Partial<Omit<UserAccount, 'id' | 'createdAt' | 'password' | 'passwordHash'>>,
): PublicUserAccount | null {
  const current = getCurrentUser();
  if (!current) return null;

  const users = getUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx === -1) return null;

  if (updates.email) {
    if (!isValidEmail(updates.email)) return null;
  }

  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);

  const safeUser = toPublicUser(users[idx]);
  setCurrentUser(safeUser);

  if (supabase && current.id !== 'guest') {
    void (async () => {
      try {
        await supabase.from('profiles').upsert({
          id: current.id,
          username: safeUser.username,
          display_name: safeUser.username,
          bio: safeUser.bio,
        });
      } catch {
        // Local profile updates remain the source of truth if cloud sync fails.
      }
    })();
  }

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

function usernameFromSupabaseUser(user: SupabaseUser, fallbackUsername?: string): string {
  const metadata = user.user_metadata ?? {};
  const metadataUsername =
    typeof metadata.username === 'string' && metadata.username.trim()
      ? metadata.username.trim()
      : '';
  const metadataDisplayName =
    typeof metadata.display_name === 'string' && metadata.display_name.trim()
      ? metadata.display_name.trim()
      : '';
  return (
    fallbackUsername?.trim() ||
    metadataUsername ||
    metadataDisplayName ||
    user.email?.split('@')[0] ||
    'spring-user'
  );
}

export async function ensureSupabaseProfile(
  user: SupabaseUser,
  fallbackUsername?: string,
): Promise<PublicUserAccount> {
  const fallbackName = usernameFromSupabaseUser(user, fallbackUsername);
  const metadataBio =
    typeof user.user_metadata?.bio === 'string' ? (user.user_metadata.bio as string) : '';
  let profileRow: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string | null;
  } | null = null;

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, bio, created_at')
      .eq('id', user.id)
      .maybeSingle();
    profileRow = data;

    const username = profileRow?.username || fallbackName;
    const displayName = profileRow?.display_name || username;
    const bio = profileRow?.bio ?? metadataBio;

    await supabase.from('profiles').upsert({
      id: user.id,
      username,
      display_name: displayName,
      avatar_url:
        profileRow?.avatar_url ||
        (typeof user.user_metadata?.avatar_url === 'string'
          ? (user.user_metadata.avatar_url as string)
          : null),
      bio,
    });

    await supabase.from('user_settings').upsert({
      user_id: user.id,
      theme: localStorage.getItem('spring_nest_theme') || 'system',
      language: localStorage.getItem('spring_nest_lang') || 'zh',
      settings: { source: 'web' },
      updated_at: new Date().toISOString(),
    });
  }

  const username = profileRow?.username || fallbackName;
  const bio = profileRow?.bio ?? metadataBio;
  const profile: PublicUserAccount = {
    id: user.id,
    email: user.email || '',
    username,
    bio,
    createdAt: user.created_at || new Date().toISOString(),
  };
  setCurrentUser(profile);
  return profile;
}

/** Sign up with Supabase Auth */
export async function supabaseSignUp(
  email: string,
  password: string,
  username?: string,
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
    if (error) {
      const msg = error.message;
      if (msg.includes('already registered') || msg.includes('User already registered'))
        return { success: false, error: '该邮箱已注册，请直接登录' };
      if (msg.includes('valid email') || msg.includes('Unable to validate'))
        return { success: false, error: '请输入有效邮箱地址' };
      if (msg.includes('Password') || msg.includes('password'))
        return { success: false, error: '密码不符合要求' };
      if (msg.includes('rate limit'))
        return { success: false, error: '请求过于频繁，请稍后再试' };
      return { success: false, error: `注册失败：${msg}` };
    }
    if (data.user) {
      await ensureSupabaseProfile(data.user, username || email.split('@')[0]);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Send OTP verification code for registration */
export async function sendRegisterOtp(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      const msg = error.message;
      if (msg.includes('rate limit'))
        return { success: false, error: '请求过于频繁，请稍后再试' };
      return { success: false, error: `验证码发送失败：${msg}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Verify OTP code and complete registration */
export async function verifyRegisterOtp(
  email: string,
  token: string,
  password: string,
  username?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  if (!token || token.length !== 6)
    return { success: false, error: '请输入 6 位验证码' };
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) {
      const msg = error.message;
      if (msg.includes('invalid') || msg.includes('expired') || msg.includes('Token has expired'))
        return { success: false, error: '验证码无效或已过期，请重新获取' };
      return { success: false, error: `验证失败：${msg}` };
    }
    if (!data.user) return { success: false, error: '验证失败，请稍后重试' };

    // Set password for the newly verified user
    if (password) {
      await supabase.auth.updateUser({ password });
    }

    await ensureSupabaseProfile(data.user, username || email.split('@')[0]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Sign in with Supabase Auth */
export async function supabaseSignIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message;
      if (msg.includes('Invalid login') || msg.includes('invalid credentials'))
        return { success: false, error: '邮箱或密码不正确' };
      if (msg.includes('Email not confirmed') || msg.includes('email not confirmed'))
        return { success: false, error: '请先验证邮箱后再登录' };
      return { success: false, error: `登录失败：${msg}` };
    }
    if (data.user) await ensureSupabaseProfile(data.user);
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
  email: string,
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
  newPassword: string,
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** Get current Supabase session */
export async function supabaseGetSession() {
  if (!supabase) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/** Listen for Supabase auth state changes */
export function onAuthStateChange(
  callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void,
) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
