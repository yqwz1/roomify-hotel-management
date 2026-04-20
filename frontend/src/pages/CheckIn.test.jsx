import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CheckIn from './CheckIn';
import { checkInReservation } from '../services/reservationService';

const selectedReservation = {
  confirmationNumber: 'RSV-B9D977F788',
  status: 'CONFIRMED',
  guestName: 'Lpl',
  guestEmail: 'MOHMMADFAHAD1919@GMAIL.COM',
  roomNumber: 'D102777',
  roomTypeName: 'Deluxe Room',
  floor: 2,
  checkInDate: '2026-04-20',
  checkOutDate: '2026-04-21',
  nights: 1,
  totalPrice: 494.5,
};

vi.mock('../components/ReservationLookupPanel', () => ({
  default: ({ onSelect }) => (
    <button type="button" onClick={() => onSelect(selectedReservation)}>
      Load Reservation
    </button>
  ),
}));

vi.mock('../components/StatusPill', () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock('../components/ConfirmationToast', () => ({
  default: () => null,
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
  checkInReservation: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Reservation request failed',
}));

vi.mock('../utils/reservationLookup', () => ({
  readReservationLookupNavigationState: () => ({
    initialFilters: {},
    initialQuery: '',
  }),
}));

describe('CheckIn', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    checkInReservation.mockResolvedValue({});
  });

  it('renders guest, stay, and financial facts with stable LTR containers', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CheckIn />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Load Reservation/i }));

    expect(screen.getByText(/Arrival Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Check-in Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Check[- ]Out/i)).toBeInTheDocument();

    expect(screen.getAllByText('RSV-B9D977F788').every((node) => node.closest('[dir="ltr"]'))).toBe(true);
    expect(screen.getByText('MOHMMADFAHAD1919@GMAIL.COM').closest('[dir="ltr"]')).not.toBeNull();
    expect(screen.getByText('D102777').closest('[dir="ltr"]')).not.toBeNull();
    expect(screen.getByText('$494.50').closest('[dir="ltr"]')).not.toBeNull();

    const roomHeading = screen.getByText(/^Room$/i);
    const roomCard = roomHeading.closest('div');
    expect(roomCard).not.toBeNull();
    expect(within(roomCard).getByText(/Deluxe Room/i)).toBeInTheDocument();
    expect(within(roomCard).getByText(/Floor 2/i)).toBeInTheDocument();
  });
});
