import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StaffGuestInbox from './StaffGuestInbox';

const mockState = vi.hoisted(() => ({
  socketConnected: true,
  publishTypingMock: vi.fn(),
  sendStaffGuestReplyMock: vi.fn(),
}));

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
    connected: mockState.socketConnected,
    publishTyping: mockState.publishTypingMock,
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
  sendStaffGuestReply: mockState.sendStaffGuestReplyMock,
}));

describe('StaffGuestInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.socketConnected = true;
    mockState.sendStaffGuestReplyMock.mockResolvedValue({
      id: 101,
      senderRole: 'STAFF',
      originalBody: 'We will send towels now.',
      createdAt: '2026-06-05T10:00:00',
    });
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

  it('allows staff to send a REST reply while realtime socket is disconnected', async () => {
    mockState.socketConnected = false;
    const user = userEvent.setup();
    render(<StaffGuestInbox />);

    const input = await screen.findByPlaceholderText('Reply to the guest...');
    await user.type(input, 'We will send towels now.');

    const sendButton = screen.getByRole('button', { name: 'Send reply' });
    expect(sendButton).toBeEnabled();
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockState.sendStaffGuestReplyMock).toHaveBeenCalledWith('conv-1', {
        body: 'We will send towels now.',
        replyLanguage: 'en',
      });
    });
  });
});
