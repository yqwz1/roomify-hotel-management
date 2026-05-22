import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from './SignupPage';
import * as authService from '../services/authService';

vi.mock('../services/authService', () => ({
  register: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderSignupPage = () => render(
  <BrowserRouter>
    <SignupPage />
  </BrowserRouter>
);

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders the guest signup form', () => {
    renderSignupPage();

    expect(screen.getByRole('heading', { name: /Create your Roomify account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('posts registration data and redirects to login on success', async () => {
    const user = userEvent.setup();
    authService.register.mockResolvedValue({
      id: 1,
      guestId: 2,
      name: 'Guest Member',
      email: 'guest.member@roomify.dev',
      roles: ['ROLE_GUEST'],
    });

    renderSignupPage();

    await user.type(screen.getByLabelText(/Name/i), 'Guest Member');
    await user.type(screen.getByLabelText(/Email/i), 'guest.member@roomify.dev');
    await user.type(screen.getByLabelText('Password'), 'Strong@Pass123');
    await user.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: 'Guest Member',
        email: 'guest.member@roomify.dev',
        password: 'Strong@Pass123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: {
          registeredEmail: 'guest.member@roomify.dev',
          signupSuccess: true,
        },
      });
    });
  });

  it('shows duplicate email errors from the backend', async () => {
    const user = userEvent.setup();
    authService.register.mockRejectedValue(new Error('An account with this email already exists'));

    renderSignupPage();

    await user.type(screen.getByLabelText(/Name/i), 'Guest Member');
    await user.type(screen.getByLabelText(/Email/i), 'guest.member@roomify.dev');
    await user.type(screen.getByLabelText('Password'), 'Strong@Pass123');
    await user.click(screen.getByRole('button', { name: /Create account/i }));

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
  });
});
