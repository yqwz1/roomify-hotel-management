import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoomsManagement from './RoomsManagement';

const mockNavigate = vi.fn();
const fetchRooms = vi.fn();
const fetchRoomTypes = vi.fn();
const addRoom = vi.fn();
const editRoom = vi.fn();
const removeRoom = vi.fn();

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
          id: 1,
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
    addRoom,
    editRoom,
    removeRoom,
    clearError: vi.fn(),
  }),
}));

vi.mock('../hooks/useRoomTypes', () => ({
  useRoomTypes: () => ({
    roomTypes: [
      { id: 1, name: 'Deluxe' },
      { id: 2, name: 'Suite' },
    ],
    fetchRoomTypes,
  }),
}));

describe('RoomsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addRoom.mockResolvedValue({ success: true });
    editRoom.mockResolvedValue({ success: true });
    removeRoom.mockResolvedValue({ success: true });
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

  it('lets managers edit a room directly from the inventory table', async () => {
    const user = userEvent.setup();

    const { container } = render(<RoomsManagement />);

    await user.click(screen.getByRole('button', { name: /Edit/i }));

    const roomNumberInput = container.querySelector('#room-number');
    const floorInput = container.querySelector('#room-floor');
    const roomTypeSelect = container.querySelector('#room-type');

    expect(roomNumberInput).not.toBeNull();
    expect(floorInput).not.toBeNull();
    expect(roomTypeSelect).not.toBeNull();

    await user.clear(roomNumberInput);
    await user.type(roomNumberInput, '202');
    await user.clear(floorInput);
    await user.type(floorInput, '4');
    await user.selectOptions(roomTypeSelect, '2');
    await user.click(screen.getByRole('button', { name: /Save Room/i }));

    expect(editRoom).toHaveBeenCalledWith(7, {
      roomNumber: '202',
      roomTypeId: 2,
      floor: 4,
      status: 'OCCUPIED',
    });
    expect(fetchRooms).toHaveBeenCalled();
  });
});
