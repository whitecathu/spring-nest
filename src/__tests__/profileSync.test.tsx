import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  retrySync: vi.fn(),
  logout: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ mode: 'system', setMode: vi.fn() }),
}));

vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({
    user: {
      id: 'cloud-user',
      email: 'old@example.com',
      username: 'tester',
      bio: '',
      createdAt: '2026-07-29T00:00:00.000Z',
    },
    updateProfile: mocks.updateProfile,
    retrySync: mocks.retrySync,
    syncStatus: 'error',
    lastSyncError: 'network unavailable',
    logout: mocks.logout,
    language: 'en',
    setLanguage: vi.fn(),
    t: (_zh: string, en: string) => en,
  }),
}));

import Profile from '../pages/Profile';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateProfile.mockResolvedValue({
    success: true,
    user: {
      id: 'cloud-user',
      email: 'old@example.com',
      username: 'new-name',
      bio: 'updated',
      createdAt: '2026-07-29T00:00:00.000Z',
    },
    emailConfirmationPending: true,
  });
  mocks.retrySync.mockResolvedValue(undefined);
});

describe('Profile synchronization feedback', () => {
  it('uses accessible labels and reports pending email confirmation', async () => {
    render(<Profile />);

    fireEvent.change(screen.getByLabelText('Nickname'), {
      target: { value: 'new-name' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Bio'), {
      target: { value: 'updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        username: 'new-name',
        email: 'new@example.com',
        bio: 'updated',
      });
    });
    expect(
      screen.getByText('Profile saved. Check your inbox to confirm the new email.'),
    ).toBeInTheDocument();
  });

  it('shows the last cloud error and exposes a retry action', () => {
    render(<Profile />);

    expect(screen.getByText('network unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry sync' }));
    expect(mocks.retrySync).toHaveBeenCalled();
  });
});
