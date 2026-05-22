import '../i18n';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

const mockUseAuth = vi.fn();

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../services/healthService', () => ({
  checkHealth: vi.fn().mockResolvedValue({ status: 'UP', timestamp: Date.now() }),
}));

describe('Home', () => {
  it('keeps the authenticated manager on the home page with dashboard and bookings links', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      hasRole: (role) => role === 'ROLE_MANAGER',
      user: {
        roles: ['ROLE_MANAGER'],
      },
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /The operating system for your hotel/i,
      })
    ).toBeInTheDocument();

    await waitFor(() => {
      const links = screen.getAllByRole('link');

      expect(links.some((link) => link.getAttribute('href') === '/manager/dashboard')).toBe(true);
      expect(links.some((link) => link.getAttribute('href') === '/bookings')).toBe(true);
    });
  });
});
