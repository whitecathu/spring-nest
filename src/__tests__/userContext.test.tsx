import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';

const mocks = vi.hoisted(() => {
  const cloudUser = {
    id: 'cloud-user',
    email: 'user@example.com',
    username: 'tester',
    bio: '',
    createdAt: '2026-07-29T00:00:00.000Z',
  };
  return {
    cloudUser,
    getCurrentUser: vi.fn(() => cloudUser),
    ensureSupabaseProfile: vi.fn(async () => cloudUser),
    supabaseGetCurrentUser: vi.fn(async () => null),
    mergeGuestData: vi.fn(),
    syncSettingsFromCloud: vi.fn(),
    syncSettingsToCloud: vi.fn(),
    loadFavoritesFromCloud: vi.fn(),
    loadBookkeepingFromCloud: vi.fn(),
    loadBudgetsFromCloud: vi.fn(),
    loadCategoriesFromCloud: vi.fn(),
    loadRecurringFromCloud: vi.fn(),
    loadLedgersFromCloud: vi.fn(),
    logout: vi.fn(),
    supabaseSignOut: vi.fn(async () => undefined),
  };
});

vi.mock('../services/authService', () => ({
  getCurrentUser: mocks.getCurrentUser,
  login: vi.fn(),
  register: vi.fn(),
  logout: mocks.logout,
  updateProfile: vi.fn(),
  isUsingSupabase: () => true,
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  supabaseGetCurrentUser: mocks.supabaseGetCurrentUser,
  supabaseSignOut: mocks.supabaseSignOut,
  ensureSupabaseProfile: mocks.ensureSupabaseProfile,
}));

vi.mock('../services/cloudSyncService', () => ({
  mergeGuestData: mocks.mergeGuestData,
  syncSettingsFromCloud: mocks.syncSettingsFromCloud,
  syncSettingsToCloud: mocks.syncSettingsToCloud,
}));

vi.mock('../services/favoriteService', () => ({
  loadFavoritesFromCloud: mocks.loadFavoritesFromCloud,
}));

vi.mock('../services/bookkeepingSyncService', () => ({
  loadBookkeepingFromCloud: mocks.loadBookkeepingFromCloud,
  loadBudgetsFromCloud: mocks.loadBudgetsFromCloud,
  loadCategoriesFromCloud: mocks.loadCategoriesFromCloud,
  loadRecurringFromCloud: mocks.loadRecurringFromCloud,
  loadLedgersFromCloud: mocks.loadLedgersFromCloud,
}));

import { UserProvider, useUser } from '../contexts/UserContext';

let latestContext: ReturnType<typeof useUser> | undefined;

function Probe() {
  const context = useUser();
  useEffect(() => {
    latestContext = context;
  }, [context]);
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  latestContext = undefined;
  mocks.getCurrentUser.mockReturnValue(mocks.cloudUser);
  mocks.supabaseGetCurrentUser.mockResolvedValue(null);
  const success = { ok: true as const, data: null };
  mocks.mergeGuestData.mockResolvedValue(success);
  mocks.syncSettingsFromCloud.mockResolvedValue(success);
  mocks.syncSettingsToCloud.mockResolvedValue(success);
  mocks.loadFavoritesFromCloud.mockResolvedValue(success);
  mocks.loadBookkeepingFromCloud.mockResolvedValue(success);
  mocks.loadBudgetsFromCloud.mockResolvedValue(success);
  mocks.loadCategoriesFromCloud.mockResolvedValue(success);
  mocks.loadRecurringFromCloud.mockResolvedValue(success);
  mocks.loadLedgersFromCloud.mockResolvedValue(success);
});

describe('UserContext cloud synchronization state', () => {
  it('surfaces retryable sync failures and clears them after a successful retry', async () => {
    render(
      <UserProvider>
        <Probe />
      </UserProvider>,
    );
    await waitFor(() => expect(latestContext).toBeDefined());
    mocks.supabaseGetCurrentUser.mockResolvedValue({
      id: 'cloud-user',
    } as never);
    mocks.mergeGuestData.mockResolvedValueOnce({
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'network unavailable',
      retryable: true,
    });

    await act(async () => {
      await latestContext?.retrySync();
    });

    expect(latestContext?.syncStatus).toBe('error');
    expect(latestContext?.lastSyncError).toContain('network unavailable');

    await act(async () => {
      await latestContext?.retrySync();
    });

    expect(latestContext?.syncStatus).toBe('synced');
    expect(latestContext?.lastSyncError).toBeNull();
  });

  it('clears user and synchronization state immediately on logout', async () => {
    render(
      <UserProvider>
        <Probe />
      </UserProvider>,
    );
    await waitFor(() => expect(latestContext).toBeDefined());

    act(() => {
      latestContext?.logout();
    });

    expect(latestContext?.user).toBeNull();
    expect(latestContext?.syncStatus).toBe('idle');
    expect(latestContext?.lastSyncError).toBeNull();
    expect(mocks.logout).toHaveBeenCalled();
  });
});
