import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { getAllReservations, searchReservations } from './reservationService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('reservationService.searchReservations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('keeps confirmation-number lookup on the exact search endpoint', async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          confirmationNumber: 'RSV-123456',
          guestName: 'Jane Doe',
          status: 'CHECKED_IN',
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 77,
          confirmationNumber: 'RSV-123456',
          guestName: 'Jane Doe',
          status: 'CHECKED_IN',
        },
      });

    const results = await searchReservations('RSV-123456');

    expect(api.get).toHaveBeenNthCalledWith(1, '/reservations/search', {
      params: { confirmation: 'RSV-123456' },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/reservations/RSV-123456');
    expect(results).toEqual([
      expect.objectContaining({
        id: 77,
        confirmationNumber: 'RSV-123456',
      }),
    ]);
  });

  it('returns all guest-name matches for explicit selection', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          confirmationNumber: 'RSV-111111',
          guestName: 'Jane Doe',
          roomNumber: '101',
        },
        {
          id: 2,
          confirmationNumber: 'RSV-222222',
          guestName: 'Jane Smith',
          roomNumber: '102',
        },
      ],
    });

    const results = await searchReservations('Jane');

    expect(api.get).toHaveBeenCalledWith('/reservations', {
      params: { guestName: 'Jane' },
    });
    expect(results).toEqual([
      expect.objectContaining({
        id: 1,
        confirmationNumber: 'RSV-111111',
      }),
      expect.objectContaining({
        id: 2,
        confirmationNumber: 'RSV-222222',
      }),
    ]);
  });

  it('forwards supported reservation filters to the list endpoint', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    await getAllReservations({
      guestName: ' Jane Doe ',
      queueTab: 'arrivals',
      checkInDate: '2026-04-20',
    });

    expect(api.get).toHaveBeenCalledWith('/reservations', {
      params: {
        guestName: 'Jane Doe',
        queueTab: 'arrivals',
        checkInDate: '2026-04-20',
      },
    });
  });
});
