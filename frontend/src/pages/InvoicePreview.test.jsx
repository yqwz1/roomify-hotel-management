import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InvoicePreview from './InvoicePreview';
import {
  getBill,
  getReservationByConfirmationNumber,
} from '../services/reservationService';
import {
  getInvoiceDeliveryStatus,
  getInvoicePdf,
} from '../services/invoiceService';

const reservation = {
  id: 88,
  confirmationNumber: 'RSV-INV-123456',
  guestName: 'John Smith',
  guestEmail: 'john@example.com',
  roomNumber: '410',
  checkInDate: '2026-03-10',
  checkOutDate: '2026-03-12',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <InvoicePreview />
    </MemoryRouter>
  );

vi.mock('../components/ConfirmationToast', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock('../components/ReservationLookupPanel', () => ({
  default: ({ onSelect }) => (
    <button type="button" onClick={() => onSelect(reservation)}>
      Load Invoice Reservation
    </button>
  ),
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
  getReservationByConfirmationNumber: vi.fn(),
  getBill: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Request failed',
}));

vi.mock('../services/invoiceService', () => ({
  generateInvoice: vi.fn(),
  getInvoiceDeliveryStatus: vi.fn(),
  getInvoicePdf: vi.fn(),
}));

describe('InvoicePreview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.URL.createObjectURL = vi.fn(() => 'blob:invoice-preview');
    window.URL.revokeObjectURL = vi.fn();
    window.open = vi.fn(() => ({ focus: vi.fn() }));
  });

  it('shows invoice preview access and delivery failure details for a finalized invoice', async () => {
    const user = userEvent.setup();

    getReservationByConfirmationNumber.mockResolvedValue(reservation);
    getBill.mockResolvedValue({
      balanceDue: 250,
      invoiceFinalized: true,
      lineItems: [{ label: 'Room charge', amount: 250, credit: false }],
    });
    getInvoiceDeliveryStatus.mockResolvedValue({
      status: 'FAILED',
      errorMessage: 'Mailbox full',
      sentAt: '2026-03-12T10:00:00Z',
    });
    getInvoicePdf.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load Invoice Reservation' }));

    await screen.findByTitle(/Invoice PDF preview/i);
    expect(screen.getByText(/Delivery failed: Mailbox full/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open PDF/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Download PDF/i }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Open PDF/i }));

    expect(window.open).toHaveBeenCalledWith('blob:invoice-preview', '_blank', 'noopener,noreferrer');
    expect(getInvoicePdf).toHaveBeenCalledTimes(1);
  });

  it('shows the generate action before invoice finalization', async () => {
    const user = userEvent.setup();

    getReservationByConfirmationNumber.mockResolvedValue(reservation);
    getBill.mockResolvedValue({
      balanceDue: 250,
      invoiceFinalized: false,
      lineItems: [],
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load Invoice Reservation' }));

    await screen.findByRole('button', { name: /Generate Invoice/i });
    expect(screen.getByText(/Generate the invoice first/i)).toBeInTheDocument();
    expect(getInvoicePdf).not.toHaveBeenCalled();
  });

  it('explicitly surfaces ATTEMPT delivery status and normalizes service charge labels', async () => {
    const user = userEvent.setup();

    getReservationByConfirmationNumber.mockResolvedValue(reservation);
    getBill.mockResolvedValue({
      balanceDue: 250,
      invoiceFinalized: true,
      lineItems: [{ label: 'Additional Service Charges', amount: 35, credit: false }],
    });
    getInvoiceDeliveryStatus.mockResolvedValue({
      status: 'ATTEMPT',
      errorMessage: null,
      sentAt: null,
    });
    getInvoicePdf.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load Invoice Reservation' }));

    await screen.findByTitle(/Invoice PDF preview/i);
    expect(screen.getAllByText(/Attempting/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Service charges/i)).toBeInTheDocument();
  });
});
