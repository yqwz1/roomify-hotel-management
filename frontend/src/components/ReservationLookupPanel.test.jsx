import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReservationLookupPanel from './ReservationLookupPanel';
import { searchReservations } from '../services/reservationService';

const reservation = {
  id: 15,
  confirmationNumber: 'RSV-LOOK-123456',
  status: 'CHECKED_IN',
  guestName: 'Jane Doe',
  guestEmail: 'jane@example.com',
  roomNumber: '401',
  roomTypeName: 'Deluxe Room',
  checkInDate: '2026-03-10',
  checkOutDate: '2026-03-12',
  totalPrice: 420,
  outstandingBalance: 80,
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

  it('auto-searches explicit confirmation filters for non-RSV action-hub handoffs', async () => {
    const onSelect = vi.fn();

    searchReservations.mockResolvedValue([
      {
        ...reservation,
        confirmationNumber: 'DEMO-CHECKIN-READY',
      },
    ]);

    render(
      <ReservationLookupPanel
        onSelect={onSelect}
        initialFilters={{ confirmation: 'DEMO-CHECKIN-READY' }}
      />
    );

    expect(searchReservations).toHaveBeenCalledWith({
      confirmation: 'DEMO-CHECKIN-READY',
      guestName: '',
      status: '',
      checkInDate: '',
      checkOutDate: '',
    });
    expect(await screen.findByText('DEMO-CHECKIN-READY')).toBeInTheDocument();
  });

  it('sends backend filter params and renders the filtered reservation response', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    searchReservations.mockResolvedValue([reservation]);

    render(<ReservationLookupPanel onSelect={onSelect} autoSearch={false} />);

    await user.type(screen.getByLabelText(/Confirmation Number/i), 'RSV-LOOK-123456');
    await user.selectOptions(screen.getByLabelText(/^Status$/i), 'CHECKED_IN');
    await user.type(screen.getByLabelText(/Check-in Date/i), '2026-03-10');
    await user.click(screen.getByRole('button', { name: /Search Reservation/i }));

    expect(searchReservations).toHaveBeenCalledWith({
      confirmation: 'RSV-LOOK-123456',
      guestName: '',
      status: 'CHECKED_IN',
      checkInDate: '2026-03-10',
      checkOutDate: '',
    });
    expect(await screen.findByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('RSV-LOOK-123456').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SAR\s*420\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SAR\s*80\.00/).length).toBeGreaterThan(0);
  });

  it('shows selectable guest-name matches from the filtered backend response', async () => {
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
        totalPrice: 400,
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
        totalPrice: 500,
      },
    ]);

    render(<ReservationLookupPanel onSelect={onSelect} autoSearch={false} />);

    await user.type(screen.getByLabelText(/Guest Name/i), 'Jane');
    await user.click(screen.getByRole('button', { name: /Search Reservation/i }));

    expect(searchReservations).toHaveBeenCalledWith({
      confirmation: '',
      guestName: 'Jane',
      status: '',
      checkInDate: '',
      checkOutDate: '',
    });
    expect(await screen.findByText(/2 reservations ready for selection/i)).toBeInTheDocument();
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

  it('makes confirmation precedence explicit and resets back to the default lookup state', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    searchReservations
      .mockResolvedValueOnce([
        {
          ...reservation,
          confirmationNumber: 'DEMO-CHECKIN-READY',
        },
      ])
      .mockResolvedValueOnce([
        {
          ...reservation,
          confirmationNumber: 'DEMO-CHECKIN-READY',
        },
      ]);

    render(
      <ReservationLookupPanel
        onSelect={onSelect}
        initialFilters={{ confirmation: 'DEMO-CHECKIN-READY' }}
      />
    );

    expect(await screen.findByText('DEMO-CHECKIN-READY')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Guest Name/i), 'Jane');

    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes(
          'Confirmation number takes precedence. Guest name, status, and stay dates remain visible'
        ) ?? false
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Clear Filters/i }));

    await waitFor(() =>
      expect(searchReservations).toHaveBeenNthCalledWith(2, {
        confirmation: 'DEMO-CHECKIN-READY',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: '',
      })
    );
    expect(screen.getAllByText('DEMO-CHECKIN-READY').length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Guest Name/i)).toHaveValue('');
  });
});
