import { render, screen } from '@testing-library/react';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ReservationDetails from './ReservationDetails';
import {
  getAllReservations,
  getReservationByConfirmationNumber,
} from '../services/reservationService';

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

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/reservations/RSV-DET-123456']}>
      <Routes>
        <Route
          path="/reservations/:confirmationNumber"
          element={<ReservationDetails />}
        />
      </Routes>
    </MemoryRouter>
  );

const renderListPage = (entry = '/reservations?queueTab=arrivals&guestName=Jane') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/reservations" element={<ReservationDetails />} />
      </Routes>
    </MemoryRouter>
  );

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
  getAllReservations: vi.fn(),
  getReservationByConfirmationNumber: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Request failed',
}));

describe('ReservationDetails', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('surfaces reservation financial metadata when the API provides it', async () => {
    getReservationByConfirmationNumber.mockResolvedValue(reservation);

    renderPage();

    await screen.findByText(/Reservation Details/i);
    expect(screen.getAllByText(/Partially paid/i).length).toBeGreaterThan(0);
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getAllByText('$76.00').length).toBeGreaterThan(0);
    expect(screen.getByText(/^No$/i)).toBeInTheDocument();
  });

  it('loads reservation lists through backend filters when query params are present', async () => {
    getAllReservations.mockResolvedValue([reservation]);

    renderListPage();

    expect(getAllReservations).toHaveBeenCalledWith({
      confirmation: '',
      confirmationNumber: '',
      guestName: 'Jane',
      status: '',
      queueTab: 'arrivals',
      checkInDate: '',
      checkOutDate: '',
    });
    expect(await screen.findByText('RSV-DET-123456')).toBeInTheDocument();
  });
});
