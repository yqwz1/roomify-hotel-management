import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ReservationDetails from './ReservationDetails';
import CheckIn from './CheckIn';
import { getReservationByConfirmationNumber } from '../services/reservationService';

const reservation = {
  id: 17,
  confirmationNumber: 'RSV-DET-123456',
  status: 'CHECKED_IN',
  roomNumber: '305',
  guestName: 'John Smith',
  guestEmail: 'john@example.com',
  checkInDate: '2026-03-10',
  checkOutDate: '2026-03-12',
  nights: 2,
  roomRate: 120,
  subtotal: 240,
  taxes: 36,
  totalPrice: 276,
  totalPaid: 200,
  outstandingBalance: 76,
  invoiceFinalized: false,
  paymentStatus: 'PARTIALLY_PAID',
};

const defaultEntry = '/reservations/RSV-DET-123456?queueTab=arrivals&guestName=Jane&checkInDate=2026-04-20';

function ActionRouteProbe() {
  const location = useLocation();

  return (
    <div>
      <p>Action Route</p>
      <p>{location.pathname}</p>
      <p>{location.state?.initialFilters?.confirmation ?? 'missing-confirmation'}</p>
      <p>{location.state?.initialQuery ?? 'empty-query'}</p>
      <p>{location.state?.workflowIntent ?? 'missing-intent'}</p>
    </div>
  );
}

const renderPage = ({
  entry = defaultEntry,
  extraRoutes = null,
} = {}) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/reservations/:confirmationNumber"
          element={<ReservationDetails />}
        />
        {extraRoutes}
      </Routes>
    </MemoryRouter>
  );

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => ({
    hasRole: (role) => role === 'ROLE_STAFF',
  }),
}));

vi.mock('../components/StatusPill', () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock('../components/LtrText', () => ({
  LtrText: ({ children }) => <span>{children}</span>,
}));

vi.mock('../components/ConfirmationToast', () => ({
  default: () => null,
}));

vi.mock('../components/ReservationLookupPanel', () => ({
  default: ({ initialFilters, initialQuery }) => (
    <div>
      <p>Lookup Confirmation: {initialFilters?.confirmation || 'empty'}</p>
      <p>Lookup Query: {initialQuery || 'empty'}</p>
    </div>
  ),
}));

vi.mock('../components/dashboard/DashboardHero', () => ({
  default: ({ title, children }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

vi.mock('../components/dashboard/DashboardPanel', () => ({
  default: ({ title, action, children }) => (
    <section>
      <h2>{title}</h2>
      {action}
      {children}
    </section>
  ),
}));

vi.mock('../services/reservationService', () => ({
  getReservationByConfirmationNumber: vi.fn(),
  checkInReservation: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Request failed',
}));

describe('ReservationDetails', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('surfaces financial metadata and operational actions for the reservation', async () => {
    getReservationByConfirmationNumber.mockResolvedValue(reservation);

    renderPage();

    await screen.findByText(/Reservation Details/i);
    expect(screen.getAllByText(/Partially paid/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/SAR\s*200\.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/SAR\s*76\.00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/^No$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Queue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check-In/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^Payment Open billing now and collect payment/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modify Reservation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel Reservation/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^Checkout Review the bill and complete the final departure workflow/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Invoice/i })).toBeInTheDocument();
  });

  it('renders queue context from the workspace filters when present', async () => {
    getReservationByConfirmationNumber.mockResolvedValue(reservation);

    renderPage();

    expect(await screen.findByText(/Queue Context/i)).toBeInTheDocument();
    expect(screen.getByText(/Arrivals/i)).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText(/Apr 20, 2026/i)).toBeInTheDocument();
  });

  it('hands off a non-RSV confirmation to check-in through explicit lookup filters', async () => {
    const user = userEvent.setup();

    getReservationByConfirmationNumber.mockResolvedValue({
      ...reservation,
      confirmationNumber: 'DEMO-CHECKIN-READY',
      status: 'CONFIRMED',
    });

    renderPage({
      entry: '/reservations/DEMO-CHECKIN-READY',
      extraRoutes: <Route path="/check-in" element={<CheckIn />} />,
    });

    await screen.findByText(/Reservation Details/i);
    await user.click(screen.getByRole('button', { name: /Check-In/i }));

    expect(await screen.findByText('Lookup Confirmation: DEMO-CHECKIN-READY')).toBeInTheDocument();
    expect(screen.getByText('Lookup Query: empty')).toBeInTheDocument();
  });

  it.each([
    {
      buttonName: /^Payment Open billing now and collect payment/i,
      path: '/checkout',
      status: 'CONFIRMED',
      workflowIntent: 'payment',
    },
    {
      buttonName: /Modify Reservation/i,
      path: '/reservations/modify',
      status: 'CONFIRMED',
      workflowIntent: 'missing-intent',
    },
    {
      buttonName: /Cancel Reservation/i,
      path: '/reservations/cancel',
      status: 'CONFIRMED',
      workflowIntent: 'missing-intent',
    },
    {
      buttonName: /^Checkout Review the bill and complete the final departure workflow/i,
      path: '/checkout',
      status: 'CHECKED_IN',
      workflowIntent: 'checkout',
    },
    {
      buttonName: /Invoice/i,
      path: '/invoice-preview',
      status: 'CONFIRMED',
      workflowIntent: 'missing-intent',
    },
  ])(
    'routes $path through explicit confirmation filters',
    async ({ buttonName, path, status, workflowIntent }) => {
      const user = userEvent.setup();

      getReservationByConfirmationNumber.mockResolvedValue({
        ...reservation,
        confirmationNumber: 'DEMO-CHECKIN-READY',
        status,
      });

      renderPage({
        entry: '/reservations/DEMO-CHECKIN-READY',
        extraRoutes: <Route path={path} element={<ActionRouteProbe />} />,
      });

      await screen.findByText(/Reservation Details/i);
      await user.click(screen.getByRole('button', { name: buttonName }));

      expect(await screen.findByText('Action Route')).toBeInTheDocument();
      expect(screen.getByText(path)).toBeInTheDocument();
      expect(screen.getByText('DEMO-CHECKIN-READY')).toBeInTheDocument();
      expect(screen.getByText('empty-query')).toBeInTheDocument();
      expect(screen.getByText(workflowIntent)).toBeInTheDocument();
    }
  );
});
