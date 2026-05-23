import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookRoom from './BookRoom';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockGetPublicRoomDetails = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../services/searchService', () => ({
  getPublicRoomDetails: (...args) => mockGetPublicRoomDetails(...args),
  extractSearchError: vi.fn(() => 'Unable to load room details'),
}));

vi.mock('../services/reservationService', () => ({
  createReservation: vi.fn(),
  createGuestReservation: vi.fn(),
  extractReservationError: vi.fn((error) => error?.message ?? 'Reservation failed'),
  isConflictError: vi.fn(() => false),
}));

const selectedRoom = {
  id: 12,
  roomNumber: '305',
  floor: 3,
  roomType: {
    name: 'Deluxe Room',
    basePrice: 180,
    maxGuests: 2,
    amenities: 'WiFi,Breakfast',
  },
};

const quotedRoom = {
  ...selectedRoom,
  availableForRequestedStay: true,
  availabilityMessage: 'Available for selected stay',
  pricing: {
    nights: 2,
    pricePerNight: 180,
    subtotal: 360,
    vatAmount: 54,
    total: 414,
  },
};

const renderBookRoom = ({ state, search = '' } = {}) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/book',
          search,
          state,
        },
      ]}
    >
      <Routes>
        <Route path="/book" element={<BookRoom />} />
      </Routes>
    </MemoryRouter>
  );

describe('BookRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      hasRole: vi.fn(() => false),
    });
    mockGetPublicRoomDetails.mockResolvedValue(quotedRoom);
  });

  it('shows a recovery state when opened without a selected room', () => {
    renderBookRoom();

    expect(screen.getByRole('heading', { name: /no room selected/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to room search/i })).toBeInTheDocument();
  });

  it('shows the sign-in checkpoint for unauthenticated users after a room is selected', async () => {
    renderBookRoom({
      search: '?roomId=12',
      state: {
        room: selectedRoom,
        checkIn: '2026-05-05',
        checkOut: '2026-05-07',
      },
    });

    expect(await screen.findByRole('heading', { name: /book a room/i })).toBeInTheDocument();
    expect(
      screen.getByText(/sign in to finalize the reservation/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it('renders the authenticated guest form and locks the email field', async () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'Guest User', email: 'guest@roomify.com', roles: ['ROLE_GUEST'] },
      isAuthenticated: true,
      hasRole: vi.fn((role) => role === 'ROLE_GUEST'),
    });

    renderBookRoom({
      search: '?roomId=12',
      state: {
        room: selectedRoom,
        checkIn: '2026-05-05',
        checkOut: '2026-05-07',
      },
    });

    expect(await screen.findByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toHaveValue('guest@roomify.com');
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /create reservation/i })).toBeInTheDocument();
  });

  it('does not prefill guest profile for staff-managed bookings', async () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'Front Desk', email: 'staff@roomify.com', roles: ['ROLE_STAFF'] },
      isAuthenticated: true,
      hasRole: vi.fn(() => false),
    });

    renderBookRoom({
      search: '?roomId=12',
      state: {
        room: selectedRoom,
        checkIn: '2026-05-05',
        checkOut: '2026-05-07',
      },
    });

    expect(await screen.findByLabelText(/full name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('');
    expect(screen.getByLabelText(/email address/i)).not.toBeDisabled();
  });
});
