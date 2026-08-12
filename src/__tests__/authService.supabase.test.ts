import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => {
  const profileEq = vi.fn();
  const profileUpdate = vi.fn(() => ({ eq: profileEq }));
  const profileUpsert = vi.fn();
  const settingsUpsert = vi.fn();
  const maybeSingle = vi.fn();
  const selectEq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq: selectEq }));

  const auth = {
    verifyOtp: vi.fn(),
    updateUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOtp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  };

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return { select, upsert: profileUpsert, update: profileUpdate };
    }
    return { upsert: settingsUpsert };
  });

  return {
    auth,
    from,
    profileEq,
    profileUpdate,
    profileUpsert,
    settingsUpsert,
    maybeSingle,
  };
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: supabaseMocks.auth,
    from: supabaseMocks.from,
  },
  isSupabaseConfigured: () => true,
}));

import { supabaseSignIn, updateProfile, verifyRegisterOtp } from '../services/authService';

const store: Record<string, string> = {};

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(store).forEach((key) => delete store[key]);
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  } as Storage;

  supabaseMocks.profileEq.mockResolvedValue({ error: null });
  supabaseMocks.profileUpsert.mockResolvedValue({ error: null });
  supabaseMocks.settingsUpsert.mockResolvedValue({ error: null });
  supabaseMocks.maybeSingle.mockResolvedValue({ data: null, error: null });
});

describe('Supabase authentication regressions', () => {
  it('does not report registration success when setting the OTP password fails', async () => {
    supabaseMocks.auth.verifyOtp.mockResolvedValue({
      data: {
        user: {
          id: 'cloud-user',
          email: 'user@example.com',
          created_at: '2026-07-29T00:00:00.000Z',
          user_metadata: {},
        },
      },
      error: null,
    });
    supabaseMocks.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Password update rejected' },
    });

    const result = await verifyRegisterOtp(' USER@EXAMPLE.COM ', '123456', 'password123', 'tester');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Password update rejected');
    expect(supabaseMocks.auth.updateUser).toHaveBeenCalledWith({ password: 'password123' });
    expect(supabaseMocks.profileUpsert).not.toHaveBeenCalled();
  });

  it('normalizes the email sent to Supabase sign in', async () => {
    supabaseMocks.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await supabaseSignIn(' USER@EXAMPLE.COM ', 'password123');

    expect(result.success).toBe(true);
    expect(supabaseMocks.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('updates a cloud profile and reports pending email confirmation', async () => {
    store.spring_nest_current_user = JSON.stringify({
      id: 'cloud-user',
      email: 'old@example.com',
      username: 'old-name',
      bio: '',
      createdAt: '2026-07-29T00:00:00.000Z',
    });
    supabaseMocks.auth.updateUser.mockResolvedValue({
      data: {
        user: {
          id: 'cloud-user',
          email: 'old@example.com',
        },
      },
      error: null,
    });

    const result = await updateProfile({
      email: ' NEW@EXAMPLE.COM ',
      username: 'new-name',
      bio: 'new bio',
    });

    expect(result.success).toBe(true);
    expect(result.emailConfirmationPending).toBe(true);
    expect(result.user?.email).toBe('old@example.com');
    expect(result.user?.username).toBe('new-name');
    expect(supabaseMocks.profileUpdate).toHaveBeenCalledWith({
      username: 'new-name',
      display_name: 'new-name',
      bio: 'new bio',
    });
    expect(supabaseMocks.profileEq).toHaveBeenCalledWith('id', 'cloud-user');
    expect(supabaseMocks.auth.updateUser).toHaveBeenCalledWith({
      email: 'new@example.com',
    });
  });
});
