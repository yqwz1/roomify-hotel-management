import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Checkout from './Checkout';
import { checkOutReservation, getBill } from '../services/reservationService';
import { createPayment } from '../services/paymentService';

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

function InvoicePreviewRouteProbe() {
  const location = useLocation();

  return (
    <div>
      <span>Invoice Preview Route</span>
      <span>{location.state?.confirmationNumber}</span>
    </div>
  );
}

const renderPage = (entry = '/') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<Checkout />} />
        <Route path="/invoice-preview" element={<InvoicePreviewRouteProbe />} />
      </Routes>
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

vi.mock('../services/paymentService', () => ({
  createPayment: vi.fn(),
  extractPaymentError: (err) => err?.message ?? 'Payment failed',
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

    await user.click(screen.getAllByRole('button', { name: /Try again/i })[0]);

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

  it('records payment, refreshes the bill, and renders the latest receipt', async () => {
    const user = userEvent.setup();

    getBill
      .mockResolvedValueOnce({
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
        invoiceFinalized: false,
        paymentStatus: 'PARTIALLY_PAID',
        lineItems: [],
      })
      .mockResolvedValueOnce({
        nights: 2,
        roomRate: 120,
        roomCharge: 240,
        serviceCharges: 30,
        vatRate: 0.15,
        vatAmount: 40.5,
        discountAmount: 0,
        balanceDue: 310.5,
        totalPaid: 310.5,
        outstandingBalance: 0,
        invoiceFinalized: true,
        paymentStatus: 'PAID',
        lineItems: [],
      });

    createPayment.mockResolvedValue({
      paymentId: 77,
      confirmationNumber: mockReservation.confirmationNumber,
      amount: 210.5,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      totalPaid: 310.5,
      remainingBalance: 0,
      invoiceFinalized: true,
      gatewayReference: 'CARD-1234',
      message: 'Payment processed successfully',
      createdAt: '2026-04-03T10:00:00',
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));
    await screen.findByRole('button', { name: /Record Payment/i });
    await user.click(screen.getByRole('button', { name: /Record Payment/i }));
    await user.click(screen.getByRole('button', { name: /Submit Payment/i }));

    await waitFor(() => {
      expect(createPayment).toHaveBeenCalledWith({
        confirmationNumber: mockReservation.confirmationNumber,
        amount: '210.50',
        paymentMethod: 'CASH',
      });
    });

    await screen.findByTestId('payment-receipt');
    expect(screen.getByText(/CARD-1234/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeEnabled();
  });

  it('allows recording payment for a confirmed reservation', async () => {
    const user = userEvent.setup();

    mockReservation.status = 'CONFIRMED';

    getBill.mockResolvedValue({
      nights: 2,
      roomRate: 120,
      roomCharge: 240,
      serviceCharges: 30,
      vatRate: 0.15,
      vatAmount: 40.5,
      discountAmount: 0,
      balanceDue: 310.5,
      totalPaid: 0,
      outstandingBalance: 310.5,
      invoiceFinalized: false,
      paymentStatus: 'UNPAID',
      lineItems: [],
    });

    createPayment.mockResolvedValue({
      paymentId: 91,
      confirmationNumber: mockReservation.confirmationNumber,
      amount: 50,
      paymentMethod: 'CASH',
      paymentStatus: 'PARTIALLY_PAID',
      totalPaid: 50,
      remainingBalance: 260.5,
      invoiceFinalized: false,
      gatewayReference: null,
      message: 'Payment processed successfully',
      createdAt: '2026-04-03T10:00:00',
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));
    const recordPaymentButton = await screen.findByRole('button', { name: /Record Payment/i });

    expect(recordPaymentButton).toBeEnabled();

    await user.click(recordPaymentButton);
    await user.clear(screen.getByLabelText(/Payment amount/i));
    await user.type(screen.getByLabelText(/Payment amount/i), '50');
    await user.click(screen.getByRole('button', { name: /Submit Payment/i }));

    await waitFor(() => {
      expect(createPayment).toHaveBeenCalledWith({
        confirmationNumber: mockReservation.confirmationNumber,
        amount: '50.00',
        paymentMethod: 'CASH',
      });
    });
  });

  it('opens directly in payment mode when launched from reservation details', async () => {
    getBill.mockResolvedValue({
      nights: 2,
      roomRate: 120,
      roomCharge: 240,
      serviceCharges: 30,
      vatRate: 0.15,
      vatAmount: 40.5,
      discountAmount: 0,
      balanceDue: 310.5,
      totalPaid: 0,
      outstandingBalance: 310.5,
      invoiceFinalized: false,
      paymentStatus: 'UNPAID',
      lineItems: [],
    });

    renderPage({
      pathname: '/',
      state: {
        initialFilters: { confirmation: mockReservation.confirmationNumber },
        initialReservation: {
          ...mockReservation,
          status: 'CONFIRMED',
        },
        workflowIntent: 'payment',
      },
    });

    expect(await screen.findByRole('heading', { level: 1, name: /^Payment$/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(getBill).toHaveBeenCalledWith(mockReservation.confirmationNumber);
    });

    expect(screen.getByText(mockReservation.guestName)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Record Payment/i })).toBeEnabled();
  });

  it('validates payment amount before submit', async () => {
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
      invoiceFinalized: false,
      paymentStatus: 'PARTIALLY_PAID',
      lineItems: [],
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));
    await user.click(screen.getByRole('button', { name: /Record Payment/i }));

    const amountInput = screen.getByLabelText(/Payment amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '999');
    await user.click(screen.getByRole('button', { name: /Submit Payment/i }));

    expect(await screen.findByText(/cannot exceed the remaining balance/i)).toBeInTheDocument();
    expect(createPayment).not.toHaveBeenCalled();
  });

  it('shows payment error when backend payment capture fails', async () => {
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
      invoiceFinalized: false,
      paymentStatus: 'PARTIALLY_PAID',
      lineItems: [],
    });

    createPayment.mockRejectedValue(new Error('Gateway rejected payment'));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));
    await user.click(screen.getByRole('button', { name: /Record Payment/i }));
    await user.click(screen.getByRole('button', { name: /Submit Payment/i }));

    expect((await screen.findAllByText('Gateway rejected payment')).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('payment-receipt')).not.toBeInTheDocument();
  });

  it('shows the room turnover status after a successful checkout', async () => {
    const user = userEvent.setup();

    getBill.mockResolvedValue({
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

    checkOutReservation.mockResolvedValue({
      action: 'check-out',
      currentStatus: 'CHECKED_OUT',
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));
    await user.click(screen.getByRole('button', { name: /Complete Checkout/i }));

    await waitFor(() => {
      expect(checkOutReservation).toHaveBeenCalledWith(mockReservation.confirmationNumber);
    });

    expect(await screen.findByText(/Room status updated/i)).toBeInTheDocument();
    expect(screen.getByText(/Room 201 is now marked Needs Cleaning/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Invoice Preview/i })).toBeInTheDocument();
  });

  it('hands off directly to invoice preview with the reservation context after checkout', async () => {
    const user = userEvent.setup();

    getBill.mockResolvedValue({
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

    checkOutReservation.mockResolvedValue({
      action: 'check-out',
      currentStatus: 'CHECKED_OUT',
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));
    await user.click(screen.getByRole('button', { name: /Complete Checkout/i }));

    const invoiceButton = await screen.findByRole('button', { name: /Open Invoice Preview/i });
    await user.click(invoiceButton);

    expect(await screen.findByText('Invoice Preview Route')).toBeInTheDocument();
    expect(screen.getByText(mockReservation.confirmationNumber)).toBeInTheDocument();
  });
});
