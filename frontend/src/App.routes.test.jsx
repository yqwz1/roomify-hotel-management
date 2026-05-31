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

vi.mock('./pages/StaffServiceRequests', () => ({
  default: () => <div>Staff Service Requests Page</div>,
}));

vi.mock('./pages/StaffGuestInbox', () => ({
  default: () => <div>Staff Guest Inbox Page</div>,
}));

vi.mock('./pages/ExpenseTracker', () => ({
  default: () => <div>Expense Tracker Page</div>,
}));

vi.mock('./pages/AdminDashboard', () => ({
  default: () => <div>Admin Dashboard Page</div>,
}));

vi.mock('./pages/Settings', () => ({
  default: () => <div>Settings Page</div>,
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

  it('allows managers to reach /manager/expenses', async () => {
    renderAtRoute('/manager/expenses', ['ROLE_MANAGER']);

    expect(await screen.findByText('Expense Tracker Page')).toBeInTheDocument();
  });

  it('allows staff to reach /staff/service-requests', async () => {
    renderAtRoute('/staff/service-requests', ['ROLE_STAFF']);

    expect(await screen.findByText('Staff Service Requests Page')).toBeInTheDocument();
  });

  it('allows managers to reach /staff/guest-inbox', async () => {
    renderAtRoute('/staff/guest-inbox', ['ROLE_MANAGER']);

    expect(await screen.findByText('Staff Guest Inbox Page')).toBeInTheDocument();
  });

  it('allows admins to reach /admin/dashboard', async () => {
    renderAtRoute('/admin/dashboard', ['ROLE_ADMIN']);

    expect(await screen.findByText('Admin Dashboard Page')).toBeInTheDocument();
  });

  it('allows authenticated users to reach /settings', async () => {
    renderAtRoute('/settings', ['ROLE_GUEST']);

    expect(await screen.findByText('Settings Page')).toBeInTheDocument();
  });

  it('keeps admin-only pages blocked for managers', async () => {
    renderAtRoute('/admin/dashboard', ['ROLE_MANAGER']);

    expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument();
  });
});
