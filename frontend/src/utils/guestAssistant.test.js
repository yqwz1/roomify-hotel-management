import { describe, expect, it } from 'vitest';
import {
  buildGuestAssistantConversationSubject,
  buildGuestReservationRoomContextLabel,
  getGuestAssistantReservationAccess,
  isGuestActiveReservation,
  isGuestCheckedInReservation,
  isGuestCheckedOutReservation,
} from './guestAssistant';

describe('guestAssistant helpers', () => {
  it('identifies checked-in and checked-out reservations for assistant access', () => {
    const checkedIn = {
      status: 'CHECKED_IN',
      roomId: 11,
      roomNumber: '204',
      checkOutDate: '2099-01-02',
    };
    const checkedOut = {
      status: 'CHECKED_OUT',
      roomId: 12,
      roomNumber: '305',
    };
    const pending = {
      status: 'CONFIRMED',
      roomId: 13,
      roomNumber: '409',
      checkOutDate: '2099-01-01',
    };
    const expired = {
      status: 'CONFIRMED',
      roomId: 14,
      roomNumber: '510',
      checkOutDate: '2024-01-01',
    };

    expect(isGuestCheckedInReservation(checkedIn)).toBe(true);
    expect(isGuestCheckedOutReservation(checkedOut)).toBe(true);
    expect(isGuestCheckedInReservation(pending)).toBe(false);
    expect(isGuestActiveReservation(pending)).toBe(true);
    expect(isGuestActiveReservation(expired)).toBe(false);

    const access = getGuestAssistantReservationAccess([checkedIn, checkedOut, pending]);
    expect(access.activeReservations).toHaveLength(2);
    expect(access.checkedInReservations).toHaveLength(1);
    expect(access.checkedInReservations[0].roomNumber).toBe('204');
    expect(access.checkedOutOnly).toBe(false);
    expect(access.requiresCheckIn).toBe(false);
  });

  it('builds room-aware labels for the chat UI', () => {
    const reservation = {
      roomNumber: '305',
      roomTypeName: 'Family Room',
    };

    expect(buildGuestReservationRoomContextLabel(reservation)).toBe('Room 305 - Family Room');
    expect(buildGuestAssistantConversationSubject(reservation)).toBe('Family Room');
  });
});
