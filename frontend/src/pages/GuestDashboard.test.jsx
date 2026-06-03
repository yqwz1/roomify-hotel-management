import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GuestDashboard from './GuestDashboard';
import {
  extractGuestReservationError,
  getGuestReservations,
} from '../services/guestReservationService';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      username: 'Guest User',
      email: 'guest@roomify.com',
      roles: ['ROLE_GUEST'],
    },
  }),
}));

vi.mock('../services/guestReservationService', () => ({
  getGuestReservations: vi.fn(),
  extractGuestReservationError: vi.fn((err) => err?.message ?? 'Unable to load stay'),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <GuestDashboard />
    </MemoryRouter>
  );

describe('GuestDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders live guest reservation cards from the guest reservations endpoint', async () => {
    getGuestReservations.mockResolvedValue([
      {
        confirmation: 'RSV-1001',
        roomType: 'Deluxe Room',
        roomNumber: '204',
        checkInDate: '2026-04-20',
        checkOutDate: '2026-04-23',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 540,
      },
    ]);

    renderPage();

    expect(await screen.findByText('RSV-1001')).toBeInTheDocument();
    expect(getGuestReservations).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Deluxe Room')).toBeInTheDocument();
    expect(screen.getAllByText('Room 204').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SAR\s*540\.00/).length).toBeGreaterThan(0);
  });

  it('routes guest dashboard actions to support-safe help and search destinations', async () => {
    const user = userEvent.setup();

    getGuestReservations.mockResolvedValue([
      {
        confirmation: 'RSV-1001',
        roomType: 'Deluxe Room',
        roomNumber: '204',
        checkInDate: '2026-04-20',
        checkOutDate: '2026-04-23',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 540,
      },
    ]);

    renderPage();

    expect(await screen.findByText('RSV-1001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Get Help/i }));
    await user.click(screen.getByRole('button', { name: /Book room/i }));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, '/bookings');
    expect(mockNavigate).toHaveBeenNthCalledWith(2, '/search');
  });

  it('shows an empty-state help path when the guest has no reservations', async () => {
    getGuestReservations.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('No reservations found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Rooms' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Get Help' }).length).toBeGreaterThan(0);
  });

  it('keeps the dashboard support email overflow-safe', async () => {
    getGuestReservations.mockResolvedValue([]);

    renderPage();

    await screen.findByText('No reservations found');

    const supportEmailNodes = screen.getAllByText('info@roomify.com');
    expect(
      supportEmailNodes.some((node) => node.className.includes('break-all'))
    ).toBe(true);
  });

  it('shows a retryable error state when the guest reservations request fails', async () => {
    getGuestReservations.mockRejectedValue(new Error('Guest stays unavailable'));

    renderPage();

    expect(await screen.findByText('Stay details unavailable')).toBeInTheDocument();
    expect(extractGuestReservationError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Guest stays unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
