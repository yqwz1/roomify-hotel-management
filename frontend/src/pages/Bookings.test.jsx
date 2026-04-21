import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Bookings from './Bookings';
import i18n from '../i18n';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <Bookings />
    </MemoryRouter>
  );

describe('Bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    void i18n.changeLanguage('en');
  });

  it('keeps guest booking help focused on support-safe actions', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      hasRole: (role) => role === 'ROLE_GUEST',
    });

    renderPage();

    expect(screen.getByRole('button', { name: /My Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Browse Rooms/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact Front Desk/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:info@roomify.com')
    );
    expect(screen.queryByRole('button', { name: /Check-In/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Checkout/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Modify Reservation/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /My Dashboard/i }));
    await user.click(screen.getByRole('button', { name: /Browse Rooms/i }));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, '/guest/dashboard');
    expect(mockNavigate).toHaveBeenNthCalledWith(2, '/search');
  });

  it('sends public guest dashboard ctas to login instead of protected guest routes', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      hasRole: () => false,
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: /Guest Dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(mockNavigate).not.toHaveBeenCalledWith('/guest/dashboard');
  });

  it('keeps support tips visible in Arabic guest booking help', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      hasRole: (role) => role === 'ROLE_GUEST',
    });

    await i18n.changeLanguage('ar');

    renderPage();

    expect(screen.getByText(/احتفظ برقم التأكيد جاهزًا/i)).toBeInTheDocument();
  });
});
