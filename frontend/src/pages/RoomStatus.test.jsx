import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RoomStatus from './RoomStatus';
import {
  getRooms,
  getValidNextStatuses,
  updateRoomStatus,
} from '../services/roomService';

vi.mock('../components/ConfirmationToast', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
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
  default: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock('../services/roomService', async () => {
  const actual = await vi.importActual('../services/roomService');
  return {
    ...actual,
    getRooms: vi.fn(),
    getValidNextStatuses: vi.fn(),
    updateRoomStatus: vi.fn(),
  };
});

describe('RoomStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <RoomStatus />
      </MemoryRouter>
    );

  it('shows only backend-provided next statuses and reports update success', async () => {
    const user = userEvent.setup();

    getRooms.mockResolvedValue([
      {
        id: 1,
        roomNumber: '101',
        floor: 1,
        status: 'AVAILABLE',
        roomType: { name: 'Standard Room', basePrice: 100 },
      },
      {
        id: 2,
        roomNumber: '102',
        floor: 1,
        status: 'OCCUPIED',
        roomType: { name: 'Deluxe Room', basePrice: 160 },
      },
    ]);

    getValidNextStatuses
      .mockResolvedValueOnce(['UNDER_MAINTENANCE'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['AVAILABLE']);

    updateRoomStatus.mockResolvedValue({
      id: 1,
      roomNumber: '101',
      floor: 1,
      status: 'UNDER_MAINTENANCE',
      roomType: { name: 'Standard Room', basePrice: 100 },
    });

    renderPage();

    const roomNumber = await screen.findByText('101');
    const roomCard = roomNumber.closest('article');

    expect(roomCard).not.toBeNull();
    expect(within(roomCard).getByRole('button', { name: /Under Maintenance/i })).toBeInTheDocument();
    expect(within(roomCard).queryByRole('button', { name: /Needs Cleaning/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Occupied rooms remain locked until checkout completes/i)).toBeInTheDocument();

    await user.click(within(roomCard).getByRole('button', { name: /Under Maintenance/i }));

    await waitFor(() => {
      expect(updateRoomStatus).toHaveBeenCalledWith(1, 'UNDER_MAINTENANCE');
    });

    await screen.findByText(/Room 101 moved to Under Maintenance/i);
  });

  it('shows a retryable error state when room loading fails', async () => {
    const user = userEvent.setup();

    getRooms
      .mockRejectedValueOnce(new Error('Forbidden'))
      .mockResolvedValueOnce([]);

    renderPage();

    expect(await screen.findByText(/Unable to load room status/i)).toBeInTheDocument();
    await screen.findAllByText('Forbidden');
    await user.click(screen.getByRole('button', { name: /Try again/i }));

    await waitFor(() => {
      expect(getRooms).toHaveBeenCalledTimes(2);
    });
  });

  it('shows an unavailable-actions state when valid next statuses cannot be loaded', async () => {
    getRooms.mockResolvedValue([
      {
        id: 3,
        roomNumber: '103',
        floor: 1,
        status: 'AVAILABLE',
        roomType: { name: 'Standard Room', basePrice: 100 },
      },
    ]);

    getValidNextStatuses.mockRejectedValue(new Error('Network error'));

    renderPage();

    const roomNumber = await screen.findByText('103');
    const roomCard = roomNumber.closest('article');

    expect(roomCard).not.toBeNull();
    expect(within(roomCard).getByText(/Allowed actions unavailable/i)).toBeInTheDocument();
    expect(within(roomCard).getByText(/could not load valid next statuses for this room right now/i)).toBeInTheDocument();
    expect(within(roomCard).queryByText(/Managed automatically/i)).not.toBeInTheDocument();
    expect(within(roomCard).queryByRole('button', { name: /Under Maintenance/i })).not.toBeInTheDocument();
  });

  it('shows an actionable message when a room-status update times out', async () => {
    const user = userEvent.setup();

    getRooms.mockResolvedValue([
      {
        id: 4,
        roomNumber: '104',
        floor: 1,
        status: 'AVAILABLE',
        roomType: { name: 'Standard Room', basePrice: 100 },
      },
    ]);

    getValidNextStatuses.mockResolvedValue(['UNDER_MAINTENANCE']);
    updateRoomStatus.mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded',
    });

    renderPage();

    const roomNumber = await screen.findByText('104');
    const roomCard = roomNumber.closest('article');

    expect(roomCard).not.toBeNull();
    await user.click(within(roomCard).getByRole('button', { name: /Under Maintenance/i }));

    expect(
      await screen.findByText(
        /The server took too long to respond. Confirm the backend is running, then try again./i
      )
    ).toBeInTheDocument();
  });
});
