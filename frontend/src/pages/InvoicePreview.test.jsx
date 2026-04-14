import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InvoicePreview from './InvoicePreview';
import {
  getBill,
  getReservationByConfirmationNumber,
} from '../services/reservationService';
import {
  generateInvoice,
  getInvoiceDeliveryStatus,
  getInvoicePdf,
  sendInvoiceEmail,
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

const renderPage = (initialEntries = ['/invoice-preview']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <InvoicePreview />
    </MemoryRouter>
  );

vi.mock('../components/ConfirmationToast', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock('../components/ReservationLookupPanel', () => ({
  default: ({ onSelect, initialQuery }) => {
    useEffect(() => {
      if (initialQuery === reservation.confirmationNumber) {
        onSelect(reservation);
      }
      // Mirror the real panel's one-time auto-search behavior for routed confirmation numbers.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialQuery]);

    return (
      <button type="button" onClick={() => onSelect(reservation)}>
        Load Invoice Reservation
      </button>
    );
  },
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
  sendInvoiceEmail: vi.fn(),
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

  it('loads invoice preview directly from checkout handoff state without another search', async () => {
    getReservationByConfirmationNumber.mockResolvedValue(reservation);
    getBill.mockResolvedValue({
      balanceDue: 250,
      invoiceFinalized: true,
      lineItems: [{ label: 'Room charge', amount: 250, credit: false }],
    });
    getInvoiceDeliveryStatus.mockResolvedValue({
      status: 'SENT',
      errorMessage: null,
      sentAt: '2026-03-12T10:00:00Z',
    });
    getInvoicePdf.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));

    renderPage([
      {
        pathname: '/invoice-preview',
        state: { confirmationNumber: reservation.confirmationNumber },
      },
    ]);

    await waitFor(() => {
      expect(getReservationByConfirmationNumber).toHaveBeenCalledWith(reservation.confirmationNumber);
    });

    expect(await screen.findByTitle(/Invoice PDF preview/i)).toBeInTheDocument();
    expect(screen.getByText(reservation.confirmationNumber)).toBeInTheDocument();
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

  it('generates the invoice and refreshes into preview mode', async () => {
    const user = userEvent.setup();

    getReservationByConfirmationNumber
      .mockResolvedValueOnce(reservation)
      .mockResolvedValueOnce(reservation);
    getBill
      .mockResolvedValueOnce({
        balanceDue: 250,
        invoiceFinalized: false,
        lineItems: [],
      })
      .mockResolvedValueOnce({
        balanceDue: 250,
        invoiceFinalized: true,
        lineItems: [{ label: 'Room charge', amount: 250, credit: false }],
      });
    generateInvoice.mockResolvedValue({ message: 'Invoice generated successfully' });
    getInvoiceDeliveryStatus.mockResolvedValue({
      status: 'SENT',
      errorMessage: null,
      sentAt: '2026-03-12T10:00:00Z',
    });
    getInvoicePdf.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load Invoice Reservation' }));
    await user.click(await screen.findByRole('button', { name: /Generate Invoice/i }));

    await waitFor(() => {
      expect(generateInvoice).toHaveBeenCalledWith(reservation.id);
    });

    expect(await screen.findByTitle(/Invoice PDF preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Invoice generated successfully/i)).toBeInTheDocument();
  });

  it('sends the invoice email from the finalized preview and updates delivery state', async () => {
    const user = userEvent.setup();

    getReservationByConfirmationNumber.mockResolvedValue(reservation);
    getBill.mockResolvedValue({
      balanceDue: 250,
      invoiceFinalized: true,
      lineItems: [{ label: 'Room charge', amount: 250, credit: false }],
    });
    getInvoiceDeliveryStatus.mockResolvedValue({
      status: 'UNKNOWN',
      errorMessage: null,
      sentAt: null,
    });
    getInvoicePdf.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    sendInvoiceEmail.mockResolvedValue({
      status: 'SENT',
      errorMessage: null,
      sentAt: '2026-03-12T10:00:00Z',
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load Invoice Reservation' }));
    await screen.findByTitle(/Invoice PDF preview/i);
    await user.click(screen.getByRole('button', { name: /Email Invoice/i }));

    await waitFor(() => {
      expect(sendInvoiceEmail).toHaveBeenCalledWith(reservation.id);
    });

    expect(await screen.findByText(/Invoice email sent successfully/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sent/i).length).toBeGreaterThan(0);
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

  it('prints from the current screen instead of opening a new tab for the print action', async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    const originalAppendChild = document.body.appendChild.bind(document.body);

    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => {
        const appended = originalAppendChild(node);

        if (node instanceof HTMLIFrameElement && node.getAttribute('title') === 'invoice-print-frame') {
          Object.defineProperty(node, 'contentWindow', {
            configurable: true,
            value: {
              focus: vi.fn(),
              print: printSpy,
            },
          });

          node.onload?.();
        }

        return appended;
      });

    getReservationByConfirmationNumber.mockResolvedValue(reservation);
    getBill.mockResolvedValue({
      balanceDue: 250,
      invoiceFinalized: true,
      lineItems: [{ label: 'Room charge', amount: 250, credit: false }],
    });
    getInvoiceDeliveryStatus.mockResolvedValue({
      status: 'SENT',
      errorMessage: null,
      sentAt: '2026-03-12T10:00:00Z',
    });
    getInvoicePdf.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load Invoice Reservation' }));
    await screen.findByTitle(/Invoice PDF preview/i);

    await user.click(screen.getAllByRole('button', { name: /Print Invoice/i })[0]);

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalledTimes(1);
    });
    expect(window.open).not.toHaveBeenCalled();

    appendChildSpy.mockRestore();
  });

  it('downloads the prepared invoice pdf from the current screen', async () => {
    const user = userEvent.setup();
    const originalCreateElement = document.createElement.bind(document);
    let createdLink = null;

    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);

      if (String(tagName).toLowerCase() === 'a') {
        createdLink = element;
        element.click = vi.fn();
      }

      return element;
    });

    getReservationByConfirmationNumber.mockResolvedValue(reservation);
    getBill.mockResolvedValue({
      balanceDue: 250,
      invoiceFinalized: true,
      lineItems: [{ label: 'Room charge', amount: 250, credit: false }],
    });
    getInvoiceDeliveryStatus.mockResolvedValue({
      status: 'SENT',
      errorMessage: null,
      sentAt: '2026-03-12T10:00:00Z',
    });
    getInvoicePdf.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load Invoice Reservation' }));
    await screen.findByTitle(/Invoice PDF preview/i);
    await user.click(screen.getAllByRole('button', { name: /Download PDF/i })[0]);

    expect(createdLink).not.toBeNull();
    expect(createdLink.download).toBe(`invoice-${reservation.confirmationNumber}.pdf`);
    expect(createdLink.click).toHaveBeenCalledTimes(1);

    createElementSpy.mockRestore();
  });
});
