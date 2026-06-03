import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationCenter from './NotificationCenter';
import {
  getNotifications,
  getUnreadNotificationCount,
} from '../../services/notificationService';

vi.mock('../../services/notificationService', () => ({
  extractNotificationError: vi.fn((err) => err?.message ?? 'Notification error'),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'notifications.unread') {
        return `${options?.count ?? 0} unread`;
      }
      return key;
    },
    i18n: {
      language: 'en',
      resolvedLanguage: 'en',
      dir: () => 'ltr',
    },
  }),
}));

describe('NotificationCenter', () => {
  it('uses a dot unread indicator instead of a numeric topbar badge', async () => {
    getNotifications.mockResolvedValue([]);
    getUnreadNotificationCount.mockResolvedValue(14);

    render(<NotificationCenter />);

    const button = screen.getByRole('button', { name: /open notifications/i });

    await waitFor(() => {
      expect(within(button).getByTestId('notification-unread-dot')).toBeInTheDocument();
    });

    expect(within(button).queryByText('14')).not.toBeInTheDocument();
  });
});
