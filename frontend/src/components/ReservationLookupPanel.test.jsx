import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReservationLookupPanel from './ReservationLookupPanel';
import { searchReservations } from '../services/reservationService';

const reservation = {
  confirmationNumber: 'RSV-LOOK-123456',
  status: 'CHECKED_IN',
  guest: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+966500000000',
    idNumber: 'A1234567',
    nationality: 'Saudi Arabian',
  },
  room: {
    roomNumber: '401',
    roomTypeName: 'Deluxe Room',
    maxGuests: 3,
    amenities: 'WiFi, Air Conditioning',
  },
  dates: {
    checkIn: '2026-03-10',
    checkOut: '2026-03-12',
    nights: 2,
  },
  pricing: {
    totalPrice: 420,
  },
};

vi.mock('../components/StatusPill', () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock('./LtrText', () => ({
  LtrText: ({ children }) => <span>{children}</span>,
}));

vi.mock('../services/reservationService', () => ({
  searchReservations: vi.fn(),
}));

describe('ReservationLookupPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders useful guest and room metadata from lookup results', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    searchReservations.mockResolvedValue([reservation]);

    render(<ReservationLookupPanel onSelect={onSelect} autoSearch={false} />);

    await user.type(screen.getByRole('textbox'), 'RSV-LOOK-123456');
    await user.click(screen.getByRole('button', { name: /Search Reservation/i }));

    expect(await screen.findByText('+966500000000')).toBeInTheDocument();
    expect(screen.getByText('Saudi Arabian')).toBeInTheDocument();
    expect(screen.getByText('A1234567')).toBeInTheDocument();
    expect(screen.getByText(/up to 3/i)).toBeInTheDocument();
    expect(screen.getByText(/WiFi/i)).toBeInTheDocument();
    expect(screen.getByText(/Air Conditioning/i)).toBeInTheDocument();
  });

  it('shows selectable guest-name matches instead of collapsing to the first reservation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    searchReservations.mockResolvedValue([
      {
        id: 1,
        confirmationNumber: 'RSV-LOOK-111111',
        status: 'CHECKED_IN',
        guestName: 'Jane Doe',
        guestEmail: 'jane.one@example.com',
        roomNumber: '401',
        checkInDate: '2026-03-10',
        checkOutDate: '2026-03-12',
      },
      {
        id: 2,
        confirmationNumber: 'RSV-LOOK-222222',
        status: 'CONFIRMED',
        guestName: 'Jane Doe',
        guestEmail: 'jane.two@example.com',
        roomNumber: '402',
        checkInDate: '2026-04-10',
        checkOutDate: '2026-04-12',
      },
    ]);

    render(<ReservationLookupPanel onSelect={onSelect} autoSearch={false} />);

    await user.type(screen.getByRole('textbox'), 'Jane');
    await user.click(screen.getByRole('button', { name: /Search Reservation/i }));

    expect(await screen.findByText(/2 reservations matched this guest search/i)).toBeInTheDocument();
    expect(screen.getByText('RSV-LOOK-111111')).toBeInTheDocument();
    expect(screen.getByText('RSV-LOOK-222222')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();

    const selectButtons = screen.getAllByRole('button', { name: /Select Reservation/i });
    await user.click(selectButtons[1]);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 2,
        confirmationNumber: 'RSV-LOOK-222222',
        roomNumber: '402',
      })
    );
  });
});
