import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StaffDashboard from './StaffDashboard';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      username: 'Agent',
      roles: ['ROLE_STAFF'],
    },
  }),
}));

vi.mock('../hooks/useReservationQueue', () => ({
  useReservationQueue: () => ({
    reservations: [],
    loading: false,
    error: '',
    today: '2026-05-23',
    reload: vi.fn(),
    metrics: {
      visibleCount: 0,
      arrivalsReady: 0,
      departuresToday: 0,
      balancesDue: 0,
    },
  }),
}));

vi.mock('../components/LtrText', () => ({
  LtrText: ({ children }) => <span>{children}</span>,
}));

vi.mock('../components/common/EmptyState', () => ({
  default: ({ title, message }) => (
    <section>
      <p>{title}</p>
      <p>{message}</p>
    </section>
  ),
}));

vi.mock('../components/common/ErrorState', () => ({
  default: ({ title, message }) => (
    <section>
      <p>{title}</p>
      <p>{message}</p>
    </section>
  ),
}));

vi.mock('../components/common/LoadingState', () => ({
  default: ({ message }) => <p>{message}</p>,
}));

vi.mock('../components/dashboard/DashboardHero', () => ({
  default: ({ title, children }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

vi.mock('../components/dashboard/DashboardMetricCard', () => ({
  default: ({ label, value }) => (
    <section>
      <p>{label}</p>
      <p>{value}</p>
    </section>
  ),
}));

vi.mock('../components/dashboard/DashboardPanel', () => ({
  default: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock('../components/dashboard/DashboardQuickAction', () => ({
  default: ({ title, onClick }) => (
    <button type="button" onClick={onClick}>
      {title}
    </button>
  ),
}));

describe('StaffDashboard navigation', () => {
  it('starts the staff booking flow from room search', async () => {
    const user = userEvent.setup();
    navigate.mockReset();

    render(<StaffDashboard />);

    await user.click(screen.getByRole('button', { name: 'Book Room' }));

    expect(navigate).toHaveBeenCalledWith('/search');
  });
});
