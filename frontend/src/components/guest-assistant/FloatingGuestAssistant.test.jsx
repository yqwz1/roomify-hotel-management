import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FloatingGuestAssistant from './FloatingGuestAssistant';
import {
  createGuestConversation,
  getGuestConversation,
  listGuestConversations,
  markGuestConversationRead,
  sendGuestConversationMessage,
} from '../../services/guestAssistantService';
import { getGuestReservations } from '../../services/guestReservationService';

vi.mock('react-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  createPortal: (node) => node,
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: {
    aside: ({ children, ...props }) => <aside {...props}>{children}</aside>,
  },
}));

vi.mock('../../context/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      username: 'Guest User',
      email: 'guest@roomify.com',
      roles: ['ROLE_GUEST'],
    },
    isAuthenticated: true,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallbackOrOptions) => {
      if (typeof fallbackOrOptions === 'string') return fallbackOrOptions;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../hooks/useGuestAssistantSocket', () => ({
  default: () => ({
    connected: true,
    publishTyping: vi.fn(),
  }),
}));

vi.mock('../../services/guestAssistantService', () => ({
  createGuestConversation: vi.fn(),
  extractGuestAssistantError: vi.fn((err) => err?.message ?? 'Guest assistant request failed. Please try again.'),
  getGuestConversation: vi.fn(),
  listGuestConversations: vi.fn(),
  markGuestConversationRead: vi.fn(),
  runGuestQuickAction: vi.fn(),
  sendGuestConversationMessage: vi.fn(),
}));

vi.mock('../../services/guestReservationService', () => ({
  getGuestReservations: vi.fn(),
}));

vi.mock('../ConfirmationToast', () => ({
  default: () => null,
}));

vi.mock('./GuestAssistantLauncher', () => ({
  default: ({ onClick }) => (
    <button type="button" onClick={onClick}>
      Open assistant
    </button>
  ),
}));

vi.mock('./GuestAssistantMessageList', () => ({
  default: () => <div>Messages</div>,
}));

vi.mock('./GuestAssistantQuickActions', () => ({
  default: ({ disabled }) => <div data-testid="quick-actions" data-disabled={disabled ? 'true' : 'false'} />,
}));

describe('FloatingGuestAssistant', () => {
  const conversation = {
    publicId: 'conv-1',
    roomId: 11,
    reservationId: 77,
    roomNumber: '204',
    subject: 'Deluxe Room',
    staffOnline: true,
    onlineStaffCount: 1,
    unreadGuestCount: 0,
    lastMessagePreview: 'Hello',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    listGuestConversations.mockResolvedValue([conversation]);
    getGuestReservations.mockResolvedValue([
      {
        id: 77,
        status: 'CHECKED_IN',
        roomId: 11,
        roomNumber: '204',
        roomType: 'Deluxe Room',
        checkInDate: '2099-01-01',
        checkOutDate: '2099-01-03',
        paymentStatus: 'UNPAID',
        outstandingBalance: 450,
      },
    ]);
    createGuestConversation.mockResolvedValue({
      conversation,
      messages: [],
    });
    getGuestConversation.mockResolvedValue({
      conversation,
      messages: [],
    });
    markGuestConversationRead.mockResolvedValue({
      conversation,
      messages: [],
    });
    sendGuestConversationMessage.mockResolvedValue({
      id: 501,
      originalBody: 'Need towels',
      createdAt: '2099-01-01T10:00:00',
    });
  });

  it('keeps the room selector visible after choosing one of multiple checked-in rooms', async () => {
    listGuestConversations.mockResolvedValue([
      conversation,
      {
        ...conversation,
        publicId: 'conv-2',
        roomId: 12,
        reservationId: 88,
        roomNumber: '305',
        subject: 'Suite Room',
      },
    ]);
    getGuestReservations.mockResolvedValue([
      {
        id: 77,
        status: 'CHECKED_IN',
        roomId: 11,
        roomNumber: '204',
        roomType: 'Deluxe Room',
        checkInDate: '2099-01-01',
        checkOutDate: '2099-01-03',
        paymentStatus: 'UNPAID',
        outstandingBalance: 450,
      },
      {
        id: 88,
        status: 'CHECKED_IN',
        roomId: 12,
        roomNumber: '305',
        roomType: 'Suite Room',
        checkInDate: '2099-01-01',
        checkOutDate: '2099-01-03',
        paymentStatus: 'UNPAID',
        outstandingBalance: 650,
      },
    ]);
    getGuestConversation.mockResolvedValue({
      conversation: {
        ...conversation,
        publicId: 'conv-2',
        roomId: 12,
        reservationId: 88,
        roomNumber: '305',
        subject: 'Suite Room',
      },
      messages: [],
    });
    markGuestConversationRead.mockResolvedValue({
      conversation: {
        ...conversation,
        publicId: 'conv-2',
        roomId: 12,
        reservationId: 88,
        roomNumber: '305',
        subject: 'Suite Room',
      },
      messages: [],
    });

    render(<FloatingGuestAssistant />);

    fireEvent.click(screen.getByRole('button', { name: 'Open assistant' }));

    const selector = await screen.findByRole('combobox');
    expect(selector).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: '88' } });

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('88');
    });

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('opens a compact right-positioned panel and closes it', async () => {
    listGuestConversations.mockResolvedValue([
      conversation,
      {
        ...conversation,
        publicId: 'conv-2',
        roomId: 12,
        reservationId: 88,
        roomNumber: '305',
        subject: 'Suite Room',
      },
    ]);
    getGuestReservations.mockResolvedValue([
      {
        id: 77,
        status: 'CHECKED_IN',
        roomId: 11,
        roomNumber: '204',
        roomType: 'Deluxe Room',
        checkInDate: '2099-01-01',
        checkOutDate: '2099-01-03',
        paymentStatus: 'UNPAID',
        outstandingBalance: 450,
      },
      {
        id: 88,
        status: 'CHECKED_IN',
        roomId: 12,
        roomNumber: '305',
        roomType: 'Suite Room',
        checkInDate: '2099-01-01',
        checkOutDate: '2099-01-03',
        paymentStatus: 'UNPAID',
        outstandingBalance: 650,
      },
    ]);

    render(<FloatingGuestAssistant />);

    fireEvent.click(screen.getByRole('button', { name: 'Open assistant' }));

    await waitFor(() => {
      expect(document.querySelector('aside[data-assistant-side="right"]')).toBeInTheDocument();
    });

    const panel = document.querySelector('aside[data-assistant-side="right"]');
    expect(panel.className).toContain('right-4');
    expect(panel.className).toContain('sm:right-6');
    expect(panel.className).toContain('w-[min(27rem,calc(100vw-2rem))]');
    expect(panel.className).not.toContain('end-4');
    expect(panel.style.left).toBe('auto');

    fireEvent.click(screen.getByRole('button', { name: 'Close guest assistant' }));

    await waitFor(() => {
      expect(document.querySelector('aside[data-assistant-side="right"]')).not.toBeInTheDocument();
    });
  });
});
