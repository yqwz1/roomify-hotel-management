import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GuestServiceRequests from './GuestServiceRequests';
import {
  extractGuestReservationError,
  getGuestReservations,
} from '../services/guestReservationService';
import {
  createGuestServiceRequest,
  getGuestServiceRequests,
} from '../services/serviceRequestService';

vi.mock('../services/guestReservationService', () => ({
  getGuestReservations: vi.fn(),
  extractGuestReservationError: vi.fn((err) => err?.message ?? 'Unable to load reservations'),
}));

vi.mock('../services/serviceRequestService', () => ({
  getGuestServiceRequests: vi.fn(),
  createGuestServiceRequest: vi.fn(),
  extractGuestServiceRequestError: vi.fn((err) => err?.message ?? 'Unable to load requests'),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <GuestServiceRequests />
    </MemoryRouter>
  );

describe('GuestServiceRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-selects a single active room and submits a service request', async () => {
    const user = userEvent.setup();

    getGuestReservations.mockResolvedValue([
      {
        confirmationNumber: 'RSV-1001',
        roomId: 11,
        roomNumber: '204',
        status: 'CONFIRMED',
        checkInDate: '2026-05-18',
        checkOutDate: '2026-05-20',
      },
    ]);
    getGuestServiceRequests.mockResolvedValue([]);
    createGuestServiceRequest.mockResolvedValue({
      id: 51,
      roomId: 11,
      roomNumber: '204',
      serviceType: 'ROOM_CLEANING',
      description: 'Fresh towels and a quick tidy-up.',
      priority: 'HIGH',
      status: 'PENDING',
      createdAt: '2026-05-18T09:30:00',
    });

    renderPage();

    expect(await screen.findByText('Selected Room')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Select Room/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Service Type/i), 'ROOM_CLEANING');
    await user.type(screen.getByLabelText(/Description/i), 'Fresh towels and a quick tidy-up.');
    await user.selectOptions(screen.getByLabelText(/Priority/i), 'HIGH');
    await user.click(screen.getByRole('button', { name: /Submit request/i }));

    await waitFor(() =>
      expect(createGuestServiceRequest).toHaveBeenCalledWith({
        roomId: 11,
        serviceType: 'ROOM_CLEANING',
        description: 'Fresh towels and a quick tidy-up.',
        priority: 'HIGH',
      })
    );

    expect(
      await screen.findByText('Your service request was submitted successfully.')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Room Cleaning').length).toBeGreaterThan(0);
  });

  it('shows a room selector when the guest has multiple active reservations', async () => {
    getGuestReservations.mockResolvedValue([
      {
        confirmationNumber: 'RSV-1001',
        roomId: 11,
        roomNumber: '204',
        status: 'CONFIRMED',
        checkInDate: '2026-05-18',
        checkOutDate: '2026-05-20',
      },
      {
        confirmationNumber: 'RSV-1002',
        roomId: 12,
        roomNumber: '305',
        status: 'CHECKED_IN',
        checkInDate: '2026-05-18',
        checkOutDate: '2026-05-22',
      },
    ]);
    getGuestServiceRequests.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByLabelText(/Select Room/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Room 204/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Room 305/i })).toBeInTheDocument();
  });

  it('shows a retryable error state when reservations fail to load', async () => {
    getGuestReservations.mockRejectedValue(new Error('Guest stay lookup failed'));
    getGuestServiceRequests.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Unable to load service requests')).toBeInTheDocument();
    expect(extractGuestReservationError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Guest stay lookup failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
