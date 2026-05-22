import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RoomSearch from './RoomSearch';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseSearch = vi.hoisted(() => vi.fn());
const mockUseRoomTypes = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useSearch', () => ({
  useSearch: () => mockUseSearch(),
}));

vi.mock('../hooks/useRoomTypes', () => ({
  useRoomTypes: () => mockUseRoomTypes(),
}));

vi.mock('../components/DateRangePicker', () => ({
  default: () => <div>Date Range Picker</div>,
}));

vi.mock('../components/RoomFilters', () => ({
  default: ({ filters, onFiltersChange }) => (
    <label>
      Room name or number
      <input
        aria-label="Room name or number"
        value={filters.roomName ?? ''}
        onChange={(event) =>
          onFiltersChange({ ...filters, roomName: event.target.value })
        }
      />
    </label>
  ),
}));

const roomSearchState = {
  results: [
    {
      id: 1,
      roomNumber: '204',
      floor: 2,
      status: 'AVAILABLE',
      roomType: {
        name: 'Deluxe Room',
        basePrice: 180,
        maxGuests: 2,
        amenities: 'WiFi, TV',
      },
    },
  ],
  totalResults: 1,
  loading: false,
  error: '',
  hasSearched: true,
  search: vi.fn(),
  clearError: vi.fn(),
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <RoomSearch />
    </MemoryRouter>
  );

describe('RoomSearch CTA behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue(roomSearchState);
    mockUseRoomTypes.mockReturnValue({
      roomTypes: [],
      loading: false,
      error: '',
      fetchRoomTypes: vi.fn(),
    });
  });

  it('keeps public browsing and booking actions available for guest users', () => {
    mockUseAuth.mockReturnValue({
      user: { roles: ['ROLE_GUEST'], email: 'guest@roomify.com' },
    });

    renderPage();

    expect(screen.getByRole('button', { name: 'Book Room' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact Front Desk' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Get Help' })).not.toBeInTheDocument();
  });

  it('keeps the booking CTA for non-guest users', () => {
    mockUseAuth.mockReturnValue({
      user: { roles: ['ROLE_STAFF'], email: 'staff@roomify.com' },
    });

    renderPage();

    expect(screen.getByRole('button', { name: 'Book Room' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Get Help' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Contact Front Desk' })).not.toBeInTheDocument();
  });

  it('submits the room name or number search filter', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { roles: ['ROLE_STAFF'], email: 'staff@roomify.com' },
    });

    renderPage();

    await user.type(screen.getByLabelText('Room name or number'), '305');
    await user.click(screen.getByRole('button', { name: /Search Rooms/i }));

    expect(roomSearchState.search).toHaveBeenCalledWith(
      expect.objectContaining({ roomName: '305' })
    );
  });
});
