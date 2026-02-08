import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const mockUseAuth = vi.fn().mockReturnValue({
    loading: true,
    isAuthenticated: false,
    user: null
});

vi.mock('../context/AuthProvider', () => ({
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('./Spinner', () => ({
    default: () => <div>Spinner</div>
}));

describe('PrivateRoute', () => {
    const renderPrivateRoute = (children, allowedRoles = []) => {
        return render(
            <MemoryRouter initialEntries={['/private']}>
                <Routes>
                    <Route
                        path="/private"
                        element={
                            <PrivateRoute allowedRoles={allowedRoles}>
                                {children}
                            </PrivateRoute>
                        }
                    />
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders loading spinner when auth is loading', () => {
        mockUseAuth.mockReturnValue({ loading: true });
        renderPrivateRoute(<div>Private Content</div>);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', () => {
        mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: false });
        renderPrivateRoute(<div>Private Content</div>);
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('redirects to unauthorized when authenticated but role is not allowed', () => {
        mockUseAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { roles: ['ROLE_GUEST'] }
        });
        renderPrivateRoute(<div>Private Content</div>, ['ROLE_MANAGER']);
        expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('renders children when authenticated and role is allowed', () => {
        mockUseAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { roles: ['ROLE_MANAGER'] }
        });
        renderPrivateRoute(<div>Private Content</div>, ['ROLE_MANAGER']);
        expect(screen.getByText('Private Content')).toBeInTheDocument();
    });
});
