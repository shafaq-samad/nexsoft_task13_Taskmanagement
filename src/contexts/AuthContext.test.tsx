import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ActivityProvider } from './ActivityContext';
import { AuthProvider, useAuth } from './AuthContext';
import { api, getStoredAccessToken } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      me: vi.fn(),
      logout: vi.fn(),
    },
    users: { list: vi.fn() },
    projects: { list: vi.fn() },
    tasks: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  },
  getStoredAccessToken: vi.fn(),
  setStoredAccessToken: vi.fn(),
}));

function Harness() {
  const { user, login, isLoading, authError } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{authError}</span>
      <span data-testid="user">{user?.name ?? 'none'}</span>
      <button onClick={() => login({ email: 'admin@enterprise.com', password: 'admin123' })}>Login</button>
    </div>
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.mocked(getStoredAccessToken).mockReturnValue('token-123');
    vi.mocked(api.auth.me).mockResolvedValue({
      id: 'user-admin',
      email: 'admin@enterprise.com',
      name: 'Sarah Connor',
      role: 'Admin',
      avatarUrl: '/avatars/admin.svg',
    });
    vi.mocked(api.auth.login).mockResolvedValue({
      token: 'token-123',
      user: {
        id: 'user-admin',
        email: 'admin@enterprise.com',
        name: 'Sarah Connor',
        role: 'Admin',
        avatarUrl: '/avatars/admin.svg',
      },
    });
    vi.mocked(api.auth.register).mockResolvedValue({
      token: 'token-456',
      user: {
        id: 'user-member',
        email: 'member@enterprise.com',
        name: 'New Member',
        role: 'Team Member',
      },
    });
  });

  it('restores a saved session on boot', async () => {
    render(
      <ActivityProvider>
        <AuthProvider>
          <Harness />
        </AuthProvider>
      </ActivityProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Sarah Connor'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('logs in and updates the current user', async () => {
    const user = userEvent.setup();
    vi.mocked(getStoredAccessToken).mockReturnValue(null);

    render(
      <ActivityProvider>
        <AuthProvider>
          <Harness />
        </AuthProvider>
      </ActivityProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Sarah Connor'));
    expect(vi.mocked(api.auth.login)).toHaveBeenCalledWith({ email: 'admin@enterprise.com', password: 'admin123' });
  });
});
