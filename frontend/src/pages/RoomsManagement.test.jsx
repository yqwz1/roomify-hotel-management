import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoomsManagement from './RoomsManagement';

const mockNavigate = vi.fn();
const fetchRooms = vi.fn();
const fetchRoomTypes = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../components/common/ModalFrame', () => ({
  default: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
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
  default: ({ title, description, children }) => (
    <section>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  ),
}));

vi.mock('../hooks/useRooms', () => ({
  useRooms: () => ({
    rooms: [
      {
        id: 7,
        roomNumber: '201',
        floor: 2,
        status: 'OCCUPIED',
        roomType: {
          name: 'Deluxe',
          basePrice: 200,
          maxGuests: 2,
          amenities: 'WiFi, TV',
        },
      },
    ],
    loading: false,
    error: null,
    fetchRooms,
    addRoom: vi.fn(),
    removeRoom: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../hooks/useRoomTypes', () => ({
  useRoomTypes: () => ({
    roomTypes: [{ id: 1, name: 'Deluxe' }],
    fetchRoomTypes,
  }),
}));

describe('RoomsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes price filters and routes room status changes to the dedicated status board', async () => {
    const user = userEvent.setup();

    render(<RoomsManagement />);

    expect(screen.queryByLabelText(/Min Price/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Max Price/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Open Status Board/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/room-status', {
      state: {
        initialFilter: 'OCCUPIED',
        initialQuery: '201',
      },
    });
  });
});
