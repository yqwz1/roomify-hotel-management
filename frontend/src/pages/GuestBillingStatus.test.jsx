import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GuestBillingStatus from './GuestBillingStatus';
import {
  extractGuestReservationError,
  getGuestReservations,
} from '../services/guestReservationService';

vi.mock('../services/guestReservationService', () => ({
  getGuestReservations: vi.fn(),
  extractGuestReservationError: vi.fn((err) => err?.message ?? 'Unable to load billing'),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <GuestBillingStatus />
    </MemoryRouter>
  );

describe('GuestBillingStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders live billing details from guest reservations', async () => {
    getGuestReservations.mockResolvedValue([
      {
        confirmationNumber: 'RSV-2001',
        checkInDate: '2026-04-20',
        checkOutDate: '2026-04-23',
        paymentStatus: 'PARTIALLY_PAID',
        invoiceNumber: 'INV-2001',
        invoiceFinalized: true,
        totalPaid: 120,
        outstandingBalance: 45,
      },
    ]);

    renderPage();

    expect(await screen.findByText('RSV-2001')).toBeInTheDocument();
    expect(screen.getByText('INV-2001')).toBeInTheDocument();
    expect(screen.getAllByText('$120.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$45.00').length).toBeGreaterThan(0);
    expect(screen.getByText(/Partially paid/i)).toBeInTheDocument();
  });

  it('shows an empty state when the guest has no billing data yet', async () => {
    getGuestReservations.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Billing details are not available yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Get Help/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /My Stay/i })).toBeInTheDocument();
  });

  it('shows a retryable error state when the guest billing request fails', async () => {
    getGuestReservations.mockRejectedValue(new Error('Billing unavailable'));

    renderPage();

    expect(await screen.findByText('Billing details unavailable')).toBeInTheDocument();
    expect(extractGuestReservationError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Billing unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
