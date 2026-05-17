import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StartupSplash from '../components/animations/StartupSplash';

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ resolved: 'light' }),
}));

vi.mock('../lib/animations', async () => {
  const actual = await vi.importActual<typeof import('../lib/animations')>('../lib/animations');
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

vi.mock('../lib/visualCapability', () => ({
  useVisualCapability: () => ({ mode: 'lightweight', reason: 'narrow-viewport' }),
}));

describe('StartupSplash fallback', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the lightweight spring nest startup for non-3d contexts', () => {
    render(<StartupSplash />);
    expect(screen.getByRole('status', { name: /Spring Nest loading/i })).not.toBeNull();
    expect(screen.getByText('Spring Nest')).not.toBeNull();
    expect(screen.getByText('春日小筑')).not.toBeNull();
  });
});
