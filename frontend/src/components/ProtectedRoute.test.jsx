import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock the useAuth hook directly since we want to control the return values precisely
const mockUseAuth = vi.fn();

vi.mock('../context/AuthProvider', async () => {
    const actual = await vi.importActual('../context/AuthProvider');
    return {
        ...actual,
        useAuth: () => mockUseAuth(),
        AuthProvider: ({ children }) => <div>{children}</div> // Mock provider to just render children
    };
});

describe('ProtectedRoute', () => {
    // Helper to render component wrapped in router
    const renderProtectedRoute = (children, allowedRoles = []) => {
        return render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute allowedRoles={allowedRoles}>
                                {children}
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders loading state when auth is loading', () => {
        mockUseAuth.mockReturnValue({ loading: true });
        renderProtectedRoute(<div>Protected Content</div>);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', () => {
        mockUseAuth.mockReturnValue({
            loading: false,
            isAuthenticated: false,
            user: null
        });
        renderProtectedRoute(<div>Protected Content</div>);
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders children when authenticated and no roles required', () => {
        mockUseAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { username: 'user' }
        });
        renderProtectedRoute(<div>Protected Content</div>);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to unauthorized when authenticated but missing required role', () => {
        mockUseAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { username: 'user', roles: ['ROLE_GUEST'] }
        });
        // Require MANAGER role
        renderProtectedRoute(<div>Protected Content</div>, ['ROLE_MANAGER']);
        expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('renders children when authenticated and has required role', () => {
        mockUseAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { username: 'admin', roles: ['ROLE_MANAGER'] }
        });
        // Require MANAGER role
        renderProtectedRoute(<div>Protected Content</div>, ['ROLE_MANAGER']);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders children when authenticated and has one of multiple allowed roles', () => {
        mockUseAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { username: 'staff', roles: ['ROLE_STAFF'] }
        });
        // Require MANAGER or STAFF role
        renderProtectedRoute(<div>Protected Content</div>, ['ROLE_MANAGER', 'ROLE_STAFF']);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
