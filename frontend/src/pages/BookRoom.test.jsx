import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BookRoom from './BookRoom';

vi.mock('../services/reservationService', () => ({
  createReservation: vi.fn(),
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
  it('shows a recovery state when opened without a selected room', () => {
    renderBookRoom();

    expect(screen.getByRole('heading', { name: /no room selected/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to room search/i })).toBeInTheDocument();
  });

  it('renders the booking form when a room is selected from search', () => {
    renderBookRoom({
      search: '?roomId=12',
      state: {
        room: selectedRoom,
        checkIn: '2026-05-05',
        checkOut: '2026-05-07',
      },
    });

    expect(screen.getByRole('heading', { name: /book a room/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm booking/i })).toBeInTheDocument();
  });
});
