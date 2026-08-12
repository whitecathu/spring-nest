import type { UserAccount, LoginResult, PublicUserAccount, RegisterResult } from '../types/user';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_USERS_KEY = 'spring_nest_users';
const STORAGE_CURRENT_USER_KEY = 'spring_nest_current_user';
/** Legacy FNV-1a (insecure) — accepted only to migrate on next login. */
const PASSWORD_HASH_PREFIX_V1 = 'local-v1:';
/** PBKDF2-SHA256 with per-user salt. */
const PASSWORD_HASH_PREFIX_V2 = 'local-v2:';
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BITS = 256;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 50;
const BIO_MAX_LENGTH = 500;

export interface ProfileUpdateResult {
  success: boolean;
  user?: PublicUserAccount;
  error?: string;
  emailConfirmationPending: boolean;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Insecure legacy hash kept only for one-time migration of old local accounts. */
function legacyHashPasswordV1(email: string, password: string): string {
  const input = `${email.trim().toLowerCase()}:${password}:spring-nest-local-auth`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${PASSWORD_HASH_PREFIX_V1}${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

async function hashPasswordV2(email: string, password: string, salt?: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(`${email.trim().toLowerCase()}:${password}`),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    PBKDF2_KEY_BITS,
  );
  return `${PASSWORD_HASH_PREFIX_V2}${bytesToBase64(saltBytes)}:${bytesToBase64(new Uint8Array(bits))}`;
}

async function verifyAndUpgradePassword(
  user: UserAccount,
  email: string,
  password: string,
): Promise<boolean> {
  if (user.passwordHash?.startsWith(PASSWORD_HASH_PREFIX_V2)) {
    const payload = user.passwordHash.slice(PASSWORD_HASH_PREFIX_V2.length);
    const [saltB64, hashB64] = payload.split(':');
    if (!saltB64 || !hashB64) return false;
    const next = await hashPasswordV2(email, password, base64ToBytes(saltB64));
    return timingSafeEqual(next, user.passwordHash);
  }

  let matched = false;
  if (user.passwordHash?.startsWith(PASSWORD_HASH_PREFIX_V1)) {
    matched = timingSafeEqual(user.passwordHash, legacyHashPasswordV1(email, password));
  } else if (typeof user.password === 'string') {
    // One-time migration for ancient plaintext local records.
    matched = user.password === password;
  }

  if (!matched) return false;

  user.passwordHash = await hashPasswordV2(email, password);
  delete user.password;
  return true;
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function defaultUsernameForEmail(email: string): string {
  const prefix = email.split('@')[0]?.slice(0, USERNAME_MAX_LENGTH) ?? '';
  return prefix.length >= USERNAME_MIN_LENGTH ? prefix : 'spring-user';
}

function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

function validateUsername(username: string | undefined): string | null {
  if (username === undefined || username.trim() === '') return null;
  const normalized = username.trim();
  if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
    return `昵称长度需为 ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} 个字符`;
  }
  return null;
}

function validateBio(bio: string | undefined): string | null {
  if (bio !== undefined && bio.length > BIO_MAX_LENGTH) {
    return `个人简介不能超过 ${BIO_MAX_LENGTH} 个字符`;
  }
  return null;
}

function validateCredentials(email: string, password: string): { email: string; error?: string } {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { email: normalizedEmail, error: '邮箱格式不正确' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      email: normalizedEmail,
      error: `密码至少需要 ${PASSWORD_MIN_LENGTH} 位`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      email: normalizedEmail,
      error: `密码不能超过 ${PASSWORD_MAX_LENGTH} 位`,
    };
  }
  return { email: normalizedEmail };
}

export async function register(
  email: string,
  password: string,
  username?: string,
): Promise<RegisterResult> {
  const credentials = validateCredentials(email, password);
  if (credentials.error) return { success: false, error: credentials.error };
  const normalizedEmail = credentials.email;
  const usernameError = validateUsername(username);
  if (usernameError) return { success: false, error: usernameError };
  const normalizedUsername = username?.trim();

  const users = getUsers();
  if (users.find((u) => normalizeEmail(u.email) === normalizedEmail)) {
    return { success: false, error: '该邮箱已注册' };
  }

  const newUser: UserAccount = {
    id: generateId(),
    email: normalizedEmail,
    username: normalizedUsername || defaultUsernameForEmail(normalizedEmail),
    passwordHash: await hashPasswordV2(normalizedEmail, password),
    bio: '',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const safeUser = toPublicUser(newUser);
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const credentials = validateCredentials(email, password);
  if (credentials.error) return { success: false, error: credentials.error };
  const normalizedEmail = credentials.email;

  const users = getUsers();
  const idx = users.findIndex((u) => normalizeEmail(u.email) === normalizedEmail);
  if (idx === -1) {
    return { success: false, error: '邮箱或密码错误' };
  }

  const user = users[idx]!;
  const ok = await verifyAndUpgradePassword(user, normalizedEmail, password);
  if (!ok) {
    return { success: false, error: '邮箱或密码错误' };
  }

  user.email = normalizedEmail;
  users[idx] = user;
  saveUsers(users);

  const safeUser = toPublicUser(user);
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

export function logout(): void {
  setCurrentUser(null);
}

export async function updateProfile(
  updates: Partial<Omit<UserAccount, 'id' | 'createdAt' | 'password' | 'passwordHash'>>,
): Promise<ProfileUpdateResult> {
  const current = getCurrentUser();
  if (!current) {
    return {
      success: false,
      error: '请先登录',
      emailConfirmationPending: false,
    };
  }

  const users = getUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  const normalizedEmail =
    updates.email === undefined ? current.email : normalizeEmail(updates.email);
  if (!isValidEmail(normalizedEmail)) {
    return {
      success: false,
      error: '邮箱格式不正确',
      emailConfirmationPending: false,
    };
  }
  const usernameError = validateUsername(updates.username);
  if (usernameError) {
    return {
      success: false,
      error: usernameError,
      emailConfirmationPending: false,
    };
  }
  const bioError = validateBio(updates.bio);
  if (bioError) {
    return {
      success: false,
      error: bioError,
      emailConfirmationPending: false,
    };
  }
  const normalizedUsername = updates.username?.trim();

  if (idx !== -1) {
    const duplicateEmail = users.some(
      (candidate, candidateIndex) =>
        candidateIndex !== idx && normalizeEmail(candidate.email) === normalizedEmail,
    );
    if (duplicateEmail) {
      return {
        success: false,
        error: '该邮箱已注册',
        emailConfirmationPending: false,
      };
    }

    users[idx] = {
      ...users[idx],
      ...updates,
      email: normalizedEmail,
      ...(normalizedUsername !== undefined ? { username: normalizedUsername } : {}),
    };
    saveUsers(users);
    const safeUser = toPublicUser(users[idx]);
    setCurrentUser(safeUser);
    return {
      success: true,
      user: safeUser,
      emailConfirmationPending: false,
    };
  }

  if (!supabase || current.id === 'guest') {
    return {
      success: false,
      error: '未找到当前账号',
      emailConfirmationPending: false,
    };
  }

  try {
    const profileUpdates: Record<string, string> = {};
    if (normalizedUsername !== undefined) {
      profileUpdates.username = normalizedUsername;
      profileUpdates.display_name = normalizedUsername;
    }
    if (updates.bio !== undefined) profileUpdates.bio = updates.bio;

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', current.id);
      if (error) {
        return {
          success: false,
          error: `资料更新失败：${error.message}`,
          emailConfirmationPending: false,
        };
      }
    }

    let emailConfirmationPending = false;
    let effectiveEmail = current.email;
    if (normalizedEmail !== normalizeEmail(current.email)) {
      const { data, error } = await supabase.auth.updateUser({ email: normalizedEmail });
      if (error) {
        return {
          success: false,
          error: `邮箱更新失败：${error.message}`,
          emailConfirmationPending: false,
        };
      }
      const returnedEmail = normalizeEmail(data.user?.email || current.email);
      emailConfirmationPending = returnedEmail !== normalizedEmail;
      effectiveEmail = emailConfirmationPending ? current.email : normalizedEmail;
    }

    const safeUser: PublicUserAccount = {
      ...current,
      ...updates,
      email: effectiveEmail,
      ...(normalizedUsername !== undefined ? { username: normalizedUsername } : {}),
    };
    setCurrentUser(safeUser);
    return {
      success: true,
      user: safeUser,
      emailConfirmationPending,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '资料更新失败',
      emailConfirmationPending: false,
    };
  }
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
    const { data, error: profileReadError } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, bio, created_at')
      .eq('id', user.id)
      .maybeSingle();
    if (profileReadError) throw profileReadError;
    profileRow = data;

    const username = profileRow?.username || fallbackName;
    const displayName = profileRow?.display_name || username;
    const bio = profileRow?.bio ?? metadataBio;

    const { error: profileWriteError } = await supabase.from('profiles').upsert({
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
    if (profileWriteError) throw profileWriteError;

    const { error: settingsWriteError } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      theme: localStorage.getItem('spring_nest_theme') || 'system',
      language: localStorage.getItem('spring_nest_lang') || 'zh',
      settings: { source: 'web' },
      updated_at: new Date().toISOString(),
    });
    if (settingsWriteError) throw settingsWriteError;
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
  const credentials = validateCredentials(email, password);
  if (credentials.error) return { success: false, error: credentials.error };
  const usernameError = validateUsername(username);
  if (usernameError) return { success: false, error: usernameError };
  const normalizedEmail = credentials.email;
  const normalizedUsername = username?.trim();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { username: normalizedUsername || defaultUsernameForEmail(normalizedEmail) },
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
      if (msg.includes('rate limit')) return { success: false, error: '请求过于频繁，请稍后再试' };
      return { success: false, error: `注册失败：${msg}` };
    }
    if (data.user) {
      await ensureSupabaseProfile(
        data.user,
        normalizedUsername || defaultUsernameForEmail(normalizedEmail),
      );
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
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { success: false, error: '邮箱格式不正确' };
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    if (error) {
      const msg = error.message;
      if (msg.includes('rate limit')) return { success: false, error: '请求过于频繁，请稍后再试' };
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
  const credentials = validateCredentials(email, password);
  if (credentials.error) return { success: false, error: credentials.error };
  const usernameError = validateUsername(username);
  if (usernameError) return { success: false, error: usernameError };
  if (!token || token.length !== 6) return { success: false, error: '请输入 6 位验证码' };
  const normalizedEmail = credentials.email;
  const normalizedUsername = username?.trim();
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
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
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) {
        return {
          success: false,
          error: `密码设置失败：${passwordError.message}`,
        };
      }
    }

    await ensureSupabaseProfile(
      data.user,
      normalizedUsername || defaultUsernameForEmail(normalizedEmail),
    );
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
  const credentials = validateCredentials(email, password);
  if (credentials.error) return { success: false, error: credentials.error };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password,
    });
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
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { success: false, error: '邮箱格式不正确' };
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/`,
    });
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
  if (!isValidPassword(newPassword)) {
    return {
      success: false,
      error: `密码长度需为 ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} 位`,
    };
  }
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
