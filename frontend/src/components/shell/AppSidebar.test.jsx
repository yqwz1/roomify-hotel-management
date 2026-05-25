import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from './AppSidebar';

const mockUseAuth = vi.fn();
let currentDir = 'ltr';

vi.mock('../../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      dir: () => currentDir,
    },
  }),
}));

describe('AppSidebar', () => {
  it('anchors the closed sidebar to the left in ltr', () => {
    currentDir = 'ltr';
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_MANAGER'],
        username: 'Admin',
      },
    });

    const { container } = render(
      <MemoryRouter>
        <AppSidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );

    const sidebar = container.querySelector('aside');

    expect(sidebar?.className).toContain('left-0');
    expect(sidebar?.className).toContain('-translate-x-full');
  });

  it('anchors the closed sidebar to the right in rtl', () => {
    currentDir = 'rtl';
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_MANAGER'],
        username: 'Admin',
      },
    });

    const { container } = render(
      <MemoryRouter>
        <AppSidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );

    const sidebar = container.querySelector('aside');

    expect(sidebar?.className).toContain('right-0');
    expect(sidebar?.className).toContain('translate-x-full');
  });

  it('renders the requested guest navigation labels', () => {
    currentDir = 'ltr';
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_GUEST'],
        username: 'Guest',
      },
    });

    render(
      <MemoryRouter>
        <AppSidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('My Stay').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Browse Rooms').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Get Help').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Billing Status').length).toBeGreaterThan(0);
    expect(screen.queryByText('Guest Dashboard')).not.toBeInTheDocument();
  });

  it('renders the requested staff navigation labels', () => {
    currentDir = 'ltr';
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_STAFF'],
        username: 'Agent',
      },
    });

    render(
      <MemoryRouter>
        <AppSidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Front Desk').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reservations').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Arrivals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Departures').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Billing').length).toBeGreaterThan(0);
    expect(screen.queryByText('Staff Dashboard')).not.toBeInTheDocument();
    expect(screen.getAllByText('Room Search').length).toBeGreaterThan(0);
  });

  it('renders the admin navigation labels for the system workspace', () => {
    currentDir = 'ltr';
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_ADMIN'],
        username: 'Admin',
      },
    });

    render(
      <MemoryRouter>
        <AppSidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Admin Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Staff & Managers').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Room Types').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Services').length).toBeGreaterThan(0);
  });
});
