import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../context/AuthProvider';
import * as authService from '../services/authService';

// Mock the authService
vi.mock('../services/authService', () => ({
    login: vi.fn(),
    logout: vi.fn(),
    getStoredToken: vi.fn(() => null),
    getStoredUser: vi.fn(() => null),
    storeAuthData: vi.fn()
}));



// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

/**
 * Helper function to render LoginPage with necessary providers
 */
const renderLoginPage = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <LoginPage />
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('LoginPage', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        mockNavigate.mockClear();
    });

    it('renders login form correctly', () => {
        renderLoginPage();

        // Check for main heading
        // Check for main heading
        expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument();

        // Check for form fields
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

        // Check for submit button
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    // it('displays validation error for invalid email format', async () => {
    //     const user = userEvent.setup();
    //     renderLoginPage();

    //     const emailInput = screen.getByLabelText(/Email/i);
    //     const submitButton = screen.getByRole('button', { name: /Sign In/i });

    //     // Enter invalid email
    //     await user.clear(emailInput);
    //     await user.type(emailInput, 'invalid-email');
    //     await user.click(submitButton);

    //     // Check for validation error
    //     await waitFor(() => {
    //         expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    //     });
    // });

    it('displays validation error for empty password', async () => {
        const user = userEvent.setup();
        renderLoginPage();

        const emailInput = screen.getByLabelText(/Email/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });
        const passwordInput = screen.getByLabelText(/Password/i);

        // Enter valid email but no password
        await user.clear(emailInput);
        await user.type(emailInput, 'test@example.com');
        await user.clear(passwordInput); // Clear password just in case
        await user.click(submitButton);

        // Check for password required error
        await waitFor(() => {
            expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
        });
    });

    it('displays loading spinner during submission', async () => {
        const user = userEvent.setup();

        // Mock login to take some time
        authService.login.mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve({
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6W10sImV4cCI6MTk5OTk5OTk5OX0.signature',
                type: 'Bearer',
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                roles: ['ROLE_GUEST']
            }), 100);
        }));

        renderLoginPage();

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        // Fill in form
        await user.clear(emailInput);
        await user.type(emailInput, 'test@example.com');
        await user.clear(passwordInput);
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Check for loading spinner
        expect(screen.getByText(/Signing in\.\.\./i)).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('displays error message on failed login', async () => {
        const user = userEvent.setup();

        // Mock login to fail
        const errorMessage = 'Invalid credentials';
        authService.login.mockRejectedValue(new Error(errorMessage));

        renderLoginPage();

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        // Fill in form
        await user.clear(emailInput);
        await user.type(emailInput, 'test@example.com');
        await user.clear(passwordInput);
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        // Check for error message
        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('redirects to manager dashboard on successful manager login', async () => {
        const user = userEvent.setup();

        // Mock successful manager login
        authService.login.mockResolvedValue({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX01BTkFHRVIiXSwiZXhwIjoxOTk5OTk5OTk5fQ.signature',
            type: 'Bearer',
            id: 1,
            username: 'admin',
            email: 'admin@test.com',
            roles: ['ROLE_MANAGER']
        });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        // Fill in form
        await user.clear(emailInput);
        await user.type(emailInput, 'admin@test.com');
        await user.clear(passwordInput);
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Check that navigate was called with correct path
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/manager/dashboard', { replace: true });
        });
    });

    it('redirects to staff dashboard on successful staff login', async () => {
        const user = userEvent.setup();

        // Mock successful staff login
        authService.login.mockResolvedValue({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX1NUQUZGIl0sImV4cCI6MTk5OTk5OTk5OX0.signature',
            type: 'Bearer',
            id: 2,
            username: 'staff',
            email: 'staff@test.com',
            roles: ['ROLE_STAFF']
        });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        // Fill in form
        await user.clear(emailInput);
        await user.type(emailInput, 'staff@test.com');
        await user.clear(passwordInput);
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Check that navigate was called with correct path
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/staff/dashboard', { replace: true });
        });
    });

    it('redirects to guest dashboard on successful guest login', async () => {
        const user = userEvent.setup();

        // Mock successful guest login
        authService.login.mockResolvedValue({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX0dVRVNUIl0sImV4cCI6MTk5OTk5OTk5OX0.signature',
            type: 'Bearer',
            id: 3,
            username: 'user',
            email: 'user@test.com',
            roles: ['ROLE_GUEST']
        });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        // Fill in form
        await user.clear(emailInput);
        await user.type(emailInput, 'user@test.com');
        await user.clear(passwordInput);
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Check that navigate was called with correct path
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/guest/dashboard', { replace: true });
        });
    });


});
