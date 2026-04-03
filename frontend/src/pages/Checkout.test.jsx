import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';
import { getBill } from '../services/reservationService';

const mockReservation = {
  confirmationNumber: 'RSV-123456789012',
  guestName: 'Jane Doe',
  guestEmail: 'jane@example.com',
  checkInDate: '2026-03-10',
  checkOutDate: '2026-03-12',
  roomNumber: '201',
  roomTypeName: 'Deluxe Room',
  status: 'CHECKED_IN',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <Checkout />
    </MemoryRouter>
  );

vi.mock('../components/ConfirmationToast', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock('../components/ReservationLookupPanel', () => ({
  default: ({ onSelect }) => (
    <button type="button" onClick={() => onSelect(mockReservation)}>
      Select Reservation
    </button>
  ),
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

vi.mock('../components/dashboard/DashboardPanel', () => ({
  default: ({ title, description, action, children }) => (
    <section>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action}
      {children}
    </section>
  ),
}));

vi.mock('../services/reservationService', () => ({
  getBill: vi.fn(),
  checkOutReservation: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Request failed',
}));

describe('Checkout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockReservation.status = 'CHECKED_IN';
  });

  it('blocks checkout when the bill fails to load and allows retry', async () => {
    const user = userEvent.setup();

    getBill
      .mockRejectedValueOnce(new Error('Bill service unavailable'))
      .mockResolvedValueOnce({
        nights: 2,
        roomRate: 120,
        roomCharge: 240,
        serviceCharges: 0,
        vatRate: 0.15,
        vatAmount: 36,
        discountAmount: 0,
        balanceDue: 276,
        totalPaid: 276,
        outstandingBalance: 0,
        invoiceFinalized: true,
        paymentStatus: 'PAID',
        lineItems: [],
      });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));

    await screen.findAllByText('Bill service unavailable');
    expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Try again/i }));

    await waitFor(() => {
      expect(getBill).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeEnabled();
    });
  });

  it('renders payment status and blocks unpaid checkout', async () => {
    const user = userEvent.setup();

    getBill.mockResolvedValue({
      nights: 2,
      roomRate: 120,
      roomCharge: 240,
      serviceCharges: 30,
      vatRate: 0.15,
      vatAmount: 40.5,
      discountAmount: 0,
      balanceDue: 310.5,
      totalPaid: 100,
      outstandingBalance: 210.5,
      invoiceFinalized: true,
      paymentStatus: 'PARTIALLY_PAID',
      lineItems: [{ label: 'Room charge', amount: 240, credit: false }],
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));

    await screen.findAllByTestId('payment-status');
    expect(screen.getAllByText(/Partially paid/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeDisabled();
    expect(screen.getAllByText(/Outstanding balance remains on this reservation/i).length).toBeGreaterThan(0);
  });

  it('blocks checkout for an invalid reservation state', async () => {
    const user = userEvent.setup();

    getBill.mockResolvedValue({
      nights: 1,
      roomRate: 80,
      roomCharge: 80,
      serviceCharges: 0,
      vatRate: 0.15,
      vatAmount: 12,
      discountAmount: 0,
      balanceDue: 92,
      totalPaid: 92,
      outstandingBalance: 0,
      invoiceFinalized: true,
      paymentStatus: 'PAID',
      lineItems: [],
    });

    mockReservation.status = 'CONFIRMED';

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));

    await screen.findAllByText(/cannot be checked out because its current status is Confirmed/i);
    expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeDisabled();
  });
});
