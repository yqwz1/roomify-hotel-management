import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ReservationsWorkspace from './ReservationsWorkspace';
import { searchReservations } from '../services/reservationService';

const reservation = {
  id: 17,
  confirmationNumber: 'RSV-QUEUE-123456',
  status: 'CONFIRMED',
  roomNumber: '305',
  roomTypeName: 'Deluxe Room',
  guestName: 'John Smith',
  guestEmail: 'john@example.com',
  checkInDate: '2026-04-20',
  checkOutDate: '2026-04-22',
  totalPrice: 276,
  outstandingBalance: 76,
};

function DetailRouteProbe() {
  const location = useLocation();

  return (
    <div>
      <p>Reservation Details Route</p>
      <p>{location.pathname}</p>
      <p>{location.search}</p>
    </div>
  );
}

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      username: 'Agent',
      roles: ['ROLE_STAFF'],
    },
  }),
}));

vi.mock('../components/StatusPill', () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock('../components/LtrText', () => ({
  LtrText: ({ children }) => <span>{children}</span>,
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
  default: ({ label, value, hint }) => (
    <section>
      <p>{label}</p>
      <p>{value}</p>
      <p>{hint}</p>
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

vi.mock('../components/reservations/ReservationDetailContent', () => ({
  ReservationDetailLoader: ({ confirmationNumber }) => (
    <div>Inline Detail: {confirmationNumber}</div>
  ),
}));

vi.mock('../services/reservationService', () => ({
  searchReservations: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Request failed',
}));

let isDesktop = true;

const installMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: isDesktop,
      media: '(min-width: 1280px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('ReservationsWorkspace', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isDesktop = true;
    installMatchMedia();
  });

  it('loads the default arrivals queue and maps queue tabs to backend filters', async () => {
    const user = userEvent.setup();
    searchReservations
      .mockResolvedValueOnce([reservation])
      .mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={['/reservations']}>
        <Routes>
          <Route path="/reservations" element={<ReservationsWorkspace />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(searchReservations).toHaveBeenNthCalledWith(1, {
        queueTab: 'arrivals',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: expect.any(String),
        checkOutDate: '',
      })
    );

    await user.click(screen.getByRole('button', { name: /Departures/i }));

    await waitFor(() =>
      expect(searchReservations).toHaveBeenNthCalledWith(2, {
        queueTab: 'departures',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: expect.any(String),
      })
    );
  });

  it('updates the selected query param and renders inline details on desktop', async () => {
    const user = userEvent.setup();
    searchReservations.mockResolvedValue([reservation]);

    render(
      <MemoryRouter initialEntries={['/reservations?queueTab=arrivals&guestName=John']}>
        <Routes>
          <Route
            path="/reservations"
            element={
              <>
                <ReservationsWorkspace />
                <DetailRouteProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('RSV-QUEUE-123456')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Select Reservation/i }));

    expect(await screen.findByText('Inline Detail: RSV-QUEUE-123456')).toBeInTheDocument();
    expect(screen.getByText(/\?queueTab=arrivals&guestName=John&checkInDate=\d{4}-\d{2}-\d{2}&selected=RSV-QUEUE-123456/)).toBeInTheDocument();
  });

  it('opens the standalone reservation page on mobile while preserving filters', async () => {
    isDesktop = false;
    installMatchMedia();
    const user = userEvent.setup();
    searchReservations.mockResolvedValue([reservation]);

    render(
      <MemoryRouter initialEntries={['/reservations?queueTab=arrivals&guestName=John']}>
        <Routes>
          <Route path="/reservations" element={<ReservationsWorkspace />} />
          <Route path="/reservations/:confirmationNumber" element={<DetailRouteProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('RSV-QUEUE-123456')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Open Reservation/i }));

    expect(await screen.findByText('Reservation Details Route')).toBeInTheDocument();
    expect(screen.getByText('/reservations/RSV-QUEUE-123456')).toBeInTheDocument();
    expect(
      screen.getByText(/\?queueTab=arrivals&guestName=John&checkInDate=\d{4}-\d{2}-\d{2}/)
    ).toBeInTheDocument();
  });

  it('submits explicit queue filters and clears back to the active queue defaults', async () => {
    const user = userEvent.setup();
    searchReservations.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/reservations?queueTab=all&guestName=John']}>
        <Routes>
          <Route path="/reservations" element={<ReservationsWorkspace />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(searchReservations).toHaveBeenNthCalledWith(1, {
        queueTab: 'all',
        confirmation: '',
        guestName: 'John',
        status: '',
        checkInDate: '',
        checkOutDate: '',
      })
    );

    await user.type(screen.getByLabelText(/Confirmation Number/i), 'RSV-9');
    await user.selectOptions(screen.getByLabelText(/^Status$/i), 'CHECKED_IN');
    fireEvent.change(screen.getByLabelText(/Check-Out/i), {
      target: { value: '2026-04-22' },
    });
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes(
          'Confirmation number takes precedence. Guest name, status, and stay dates remain visible'
        ) ?? false
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Apply filters to refresh the queue/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Apply Filters/i }));

    await waitFor(() =>
      expect(searchReservations).toHaveBeenNthCalledWith(2, {
        queueTab: 'all',
        confirmation: 'RSV-9',
        guestName: 'John',
        status: 'CHECKED_IN',
        checkInDate: '',
        checkOutDate: '2026-04-22',
      })
    );

    await user.click(screen.getAllByRole('button', { name: /Clear Filters/i })[0]);

    await waitFor(() =>
      expect(searchReservations).toHaveBeenNthCalledWith(3, {
        queueTab: 'all',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: '',
      })
    );
  });
});
