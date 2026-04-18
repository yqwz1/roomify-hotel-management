import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RoomSearch from './RoomSearch';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseSearch = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useSearch', () => ({
  useSearch: () => mockUseSearch(),
}));

vi.mock('../components/DateRangePicker', () => ({
  default: () => <div>Date Range Picker</div>,
}));

vi.mock('../components/RoomFilters', () => ({
  default: () => <div>Room Filters</div>,
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
  });

  it('shows only safe guest actions on room result cards for guest users', () => {
    mockUseAuth.mockReturnValue({
      user: { roles: ['ROLE_GUEST'], email: 'guest@roomify.com' },
    });

    renderPage();

    expect(screen.queryByRole('button', { name: 'Book Room' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Help' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact Front Desk' })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Guests can browse availability here, but booking and stay changes still go through hotel support\./i
      )
    ).toBeInTheDocument();
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
});
