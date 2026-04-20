import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import {
  getAllReservations,
  modifyReservation,
  searchReservations,
} from './reservationService';

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

  it('routes confirmation lookups through the backend filtered reservations endpoint', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          id: 77,
          confirmationNumber: 'RSV-123456',
          guestName: 'Jane Doe',
          status: 'CHECKED_IN',
        },
      ],
    });

    const results = await searchReservations('RSV-123456');

    expect(api.get).toHaveBeenCalledWith('/reservations', {
      params: { confirmation: 'RSV-123456' },
    });
    expect(results).toEqual([
      expect.objectContaining({
        id: 77,
        confirmationNumber: 'RSV-123456',
      }),
    ]);
  });

  it('treats non-RSV identifiers as confirmation filters when used as direct lookups', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          id: 91,
          confirmationNumber: 'DEMO-CHECKIN-READY',
          guestName: 'Demo Guest',
          status: 'CONFIRMED',
        },
      ],
    });

    await searchReservations('DEMO-CHECKIN-READY');

    expect(api.get).toHaveBeenCalledWith('/reservations', {
      params: { confirmation: 'DEMO-CHECKIN-READY' },
    });
  });

  it('forwards combined backend filters for staff queue searches', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    await searchReservations({
      guestName: ' Jane Doe ',
      status: 'CHECKED_IN',
      checkOutDate: '2026-04-20',
    });

    expect(api.get).toHaveBeenCalledWith('/reservations', {
      params: {
        guestName: 'Jane Doe',
        status: 'CHECKED_IN',
        checkOutDate: '2026-04-20',
      },
    });
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

  it('resolves non-RSV confirmation numbers before modifying reservations', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: 88,
        confirmationNumber: 'DEMO-CHECKIN-READY',
      },
    });
    api.put.mockResolvedValueOnce({ data: { success: true } });

    await modifyReservation('DEMO-CHECKIN-READY', { roomId: 305 });

    expect(api.get).toHaveBeenCalledWith('/reservations/DEMO-CHECKIN-READY');
    expect(api.put).toHaveBeenCalledWith('/reservations/88', { roomId: 305 });
  });
});
