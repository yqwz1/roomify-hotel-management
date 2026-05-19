import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// jsdom doesn't implement ResizeObserver, which RoomGrid uses to measure
// column width. Stub it so the row effect doesn't throw at mount time.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub;

const authState = { user: { roles: ['ROLE_MANAGER'] } };

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => authState,
}));

vi.mock('../components/ConfirmationToast', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock('../components/common/EmptyState', () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock('../components/common/ErrorState', () => ({
  default: ({ message }) => <div>{message}</div>,
}));

const fetchRoomGrid = vi.fn();

vi.mock('../services/reservationService', () => ({
  fetchRoomGrid: (...args) => fetchRoomGrid(...args),
  modifyReservation: vi.fn(),
  extractReservationError: (err) => err?.message ?? 'Request failed',
  isConflictError: (err) => err?.response?.status === 409,
}));

// Stub localization helper used in toasts (not under test here).
vi.mock('../utils/localization', () => ({
  formatLocalizedDate: (iso) => String(iso ?? ''),
}));

import RoomGrid from './RoomGrid';

const buildGridResponse = () => {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  return {
    startDate: iso(0),
    endDate: iso(13),
    rooms: [
      {
        id: 1,
        roomNumber: '201',
        roomTypeCode: 'STD',
        roomTypeName: 'Standard',
        reservations: [
          {
            id: 42,
            confirmationNumber: 'RX-7K2P',
            guestName: 'Daniel R.',
            checkInDate: iso(1),
            checkOutDate: iso(3),
            status: 'CONFIRMED',
            numberOfGuests: 2,
          },
        ],
      },
      {
        id: 2,
        roomNumber: '202',
        roomTypeCode: 'STD',
        roomTypeName: 'Standard',
        reservations: [],
      },
    ],
  };
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <RoomGrid />
    </MemoryRouter>
  );

describe('RoomGrid', () => {
  beforeEach(() => {
    fetchRoomGrid.mockReset();
    fetchRoomGrid.mockResolvedValue(buildGridResponse());
    authState.user = { roles: ['ROLE_MANAGER'] };
  });

  it('renders without crashing given a mocked grid response', async () => {
    renderPage();
    await waitFor(() => {
      expect(fetchRoomGrid).toHaveBeenCalled();
    });
    expect(await screen.findByText('201')).toBeInTheDocument();
    expect(await screen.findByText('202')).toBeInTheDocument();
    expect(await screen.findByText(/RX-7K2P/)).toBeInTheDocument();
  });

  it('MANAGER role: pills have cursor-grab and resize handles are present', async () => {
    authState.user = { roles: ['ROLE_MANAGER'] };
    renderPage();
    const pill = await screen.findByRole('button', { name: /RX-7K2P/ });
    expect(pill.className).toMatch(/cursor-grab/);
    expect(pill.getAttribute('draggable')).toBe('true');
    // Resize handle is the only ew-resize child.
    const handle = pill.querySelector('.cursor-ew-resize');
    expect(handle).not.toBeNull();
  });

  it('STAFF role: pills have cursor-default and no resize handles', async () => {
    authState.user = { roles: ['ROLE_STAFF'] };
    renderPage();
    const pill = await screen.findByRole('button', { name: /RX-7K2P/ });
    expect(pill.className).toMatch(/cursor-default/);
    expect(pill.getAttribute('draggable')).toBe('false');
    const handle = pill.querySelector('.cursor-ew-resize');
    expect(handle).toBeNull();
  });
});
