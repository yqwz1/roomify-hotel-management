import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ModifyReservation from './ModifyReservation';

const reservation = {
  id: 91,
  confirmationNumber: 'RSV-MOD-123456',
  status: 'CONFIRMED',
  roomId: 5,
  roomNumber: '305',
  roomTypeName: 'Deluxe',
  roomRate: 200,
  guestName: 'Jane Doe',
  guestCapacity: 2,
  checkInDate: '2026-05-10',
  checkOutDate: '2026-05-12',
  nights: 2,
  subtotal: 400,
  taxes: 60,
  totalPrice: 460,
};

vi.mock('../components/ConfirmationToast', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock('../components/ReservationLookupPanel', () => ({
  default: ({ onSelect }) => (
    <button type="button" onClick={() => onSelect(reservation)}>
      Select Reservation
    </button>
  ),
}));

vi.mock('../components/StatusPill', () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock('../components/DateRangePicker', () => ({
  default: () => <div>Date Range Picker</div>,
}));

vi.mock('../components/ErrorBanner', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
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

vi.mock('../services/searchService', () => ({
  searchRooms: vi.fn(async () => ({
    rooms: [
      {
        id: 5,
        roomNumber: '305',
        roomType: {
          name: 'Deluxe',
          basePrice: 200,
          maxGuests: 2,
        },
      },
    ],
  })),
}));

vi.mock('../services/reservationService', () => ({
  modifyReservation: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Request failed',
}));

describe('ModifyReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a single save CTA entry point and shows a 15% VAT preview in the modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ModifyReservation />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Select Reservation' }));

    const openModifyButton = await screen.findByRole('button', {
      name: /Save Reservation Changes/i,
    });

    expect(screen.getAllByRole('button', { name: /Save Reservation Changes/i })).toHaveLength(1);

    await user.click(openModifyButton);

    expect(await screen.findByText(/VAT \(15%\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Taxes \(10%\)/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/SAR\s*460\.00/).length).toBeGreaterThan(0);
  });
});
