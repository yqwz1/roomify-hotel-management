import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('./context/AuthProvider', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

vi.mock('./components/Layout', () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock('./pages/RoomSearch', () => ({
  default: () => <div>Room Search Page</div>,
}));

vi.mock('./pages/CheckIn', () => ({
  default: () => <div>Check-In Page</div>,
}));

vi.mock('./pages/ManagerDashboard', () => ({
  default: () => <div>Manager Dashboard Page</div>,
}));

vi.mock('./pages/Unauthorized', () => ({
  default: () => <div>Unauthorized Page</div>,
}));

import App from './App.jsx';

const setAuthenticatedUser = (roles) => {
  const hasRole = (role) => roles.includes(role);

  mockUseAuth.mockReturnValue({
    loading: false,
    isAuthenticated: true,
    user: {
      roles,
      email: 'user@roomify.com',
      username: 'Roomify User',
    },
    login: vi.fn(),
    logout: vi.fn(),
    hasRole,
    getPrimaryRole: () => roles[0] ?? null,
  });
};

const renderAtRoute = (path, roles) => {
  window.history.replaceState({}, '', path);
  setAuthenticatedUser(roles);
  render(<App />);
};

describe('App route guards', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('allows guests to reach /search', async () => {
    renderAtRoute('/search', ['ROLE_GUEST']);

    expect(await screen.findByText('Room Search Page')).toBeInTheDocument();
  });

  it('keeps staff-only pages blocked for guests', async () => {
    renderAtRoute('/check-in', ['ROLE_GUEST']);

    expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument();
  });

  it('keeps manager-only pages blocked for staff', async () => {
    renderAtRoute('/manager/dashboard', ['ROLE_STAFF']);

    expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument();
  });
});
