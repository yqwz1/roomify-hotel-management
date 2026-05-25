import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppTopbar from './AppTopbar';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
    },
  }),
}));

vi.mock('../LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div>Language Switcher</div>,
}));

vi.mock('./NotificationCenter', () => ({
  default: () => <div>Notification Center</div>,
}));

vi.mock('../navigation/navConfig', async () => {
  const actual = await vi.importActual('../navigation/navConfig');
  return {
    ...actual,
    getPageMeta: () => ({
      title: 'Admin Dashboard',
      sectionLabel: 'Overview',
    }),
  };
});

describe('AppTopbar', () => {
  it('hides the notification center for admin-primary users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
        username: 'Admin User',
      },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AppTopbar isSidebarOpen={false} onMenuToggle={() => {}} />
      </MemoryRouter>
    );

    expect(screen.queryByText('Notification Center')).not.toBeInTheDocument();
  });

  it('keeps the notification center for manager users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_MANAGER'],
        username: 'Manager User',
      },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AppTopbar isSidebarOpen={false} onMenuToggle={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Notification Center')).toBeInTheDocument();
  });
});
