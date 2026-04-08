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
});
