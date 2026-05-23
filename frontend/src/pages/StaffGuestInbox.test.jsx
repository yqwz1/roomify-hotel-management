import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StaffGuestInbox from './StaffGuestInbox';

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      username: 'Staff User',
      email: 'staff@roomify.com',
      roles: ['ROLE_STAFF'],
    },
    isAuthenticated: true,
  }),
}));

vi.mock('../hooks/useGuestAssistantSocket', () => ({
  default: () => ({
    connected: true,
    publishTyping: vi.fn(),
  }),
}));

vi.mock('../services/guestAssistantService', () => ({
  extractGuestAssistantError: vi.fn((err) => err?.message ?? 'Guest assistant request failed. Please try again.'),
  getStaffGuestConversation: vi.fn().mockResolvedValue({
    conversation: {
      publicId: 'conv-1',
      guestName: 'Aisha Khan',
      roomNumber: '204',
      roomTypeName: 'Deluxe Suite',
      reservationStatus: 'CHECKED_IN',
      preferredLanguage: 'ar',
      subject: 'Deluxe Suite',
      assignedStaffName: 'Maya',
      staffOnline: true,
      onlineStaffCount: 2,
      unreadStaffCount: 0,
      status: 'ACTIVE',
      aiHandled: false,
      lastMessagePreview: 'Hello',
    },
    messages: [],
  }),
  listStaffGuestConversations: vi.fn().mockResolvedValue([
    {
      publicId: 'conv-1',
      guestName: 'Aisha Khan',
      roomNumber: '204',
      roomTypeName: 'Deluxe Suite',
      reservationStatus: 'CHECKED_IN',
      preferredLanguage: 'ar',
      subject: 'Deluxe Suite',
      assignedStaffName: 'Maya',
      staffOnline: true,
      onlineStaffCount: 2,
      unreadStaffCount: 0,
      status: 'ACTIVE',
      aiHandled: false,
      lastMessagePreview: 'Hello',
    },
  ]),
  markStaffGuestConversationRead: vi.fn(),
  resolveStaffGuestConversation: vi.fn(),
  sendStaffGuestReply: vi.fn(),
}));

describe('StaffGuestInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows reservation status, selected room context, and preferred language for the active thread', async () => {
    render(<StaffGuestInbox />);

    expect(await screen.findByText('Reservation status')).toBeInTheDocument();
    expect(screen.getByText(/checked in/i)).toBeInTheDocument();
    expect(screen.getByText('Preferred language')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByText('Selected room context')).toBeInTheDocument();
    expect(screen.getByText('Deluxe Suite - Room 204')).toBeInTheDocument();
  });
});
