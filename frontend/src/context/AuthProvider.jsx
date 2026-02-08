/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, logout as logoutService, getStoredToken, getStoredUser, storeAuthData } from '../services/authService';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Custom hook to use Auth Context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * AuthProvider component that wraps the app and provides authentication state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = getStoredToken();
                const storedUser = getStoredUser();

                if (storedToken) {
                    // 1. Decode token to check expiration & get roles
                    let decoded;
                    try {
                        decoded = jwtDecode(storedToken);
                    } catch (e) {
                        console.error("Invalid token format", e);
                        logoutService();
                        setLoading(false);
                        return;
                    }

                    const currentTime = Date.now() / 1000;

                    if (decoded.exp < currentTime) {
                        // Token expired
                        console.warn('Token expired, logging out');
                        logoutService();
                    } else if (storedUser) {
                        // Token valid
                        // Ensure we have roles from the token, not just storedUser
                        // The token is the source of truth for permissions
                        const userWithRoles = {
                            ...storedUser,
                            roles: decoded.roles || decoded.role || [] // Adjust based on JWT structure
                        };

                        // Handle case where roles might be a single string in JWT
                        if (typeof userWithRoles.roles === 'string') {
                            userWithRoles.roles = [userWithRoles.roles];
                        }

                        setToken(storedToken);
                        setUser(userWithRoles);
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                // Clear invalid data
                logoutService();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    /**
     * Login function
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User object
     * @throws {Error} If login fails
     */
    const login = async (email, password) => {
        try {
            setLoading(true);

            // Call login service (real backend)
            const response = await loginService(email, password);

            // Extract data from response
            const { token: jwtToken, type, id, username, email: userEmail } = response;

            // Decode the token to get the REAL roles
            const decoded = jwtDecode(jwtToken);
            console.log("Decoded JWT:", decoded);

            let roles = decoded.roles || decoded.role || [];
            // Handle case where roles might be a single string in JWT
            if (typeof roles === 'string') {
                roles = [roles];
            }

            const userData = {
                id,
                username,
                email: userEmail,
                roles, // Use roles from JWT
                tokenType: type
            };

            // Store in state
            setToken(jwtToken);
            setUser(userData);
            setIsAuthenticated(true);

            // Persist to localStorage
            storeAuthData(jwtToken, userData);

            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout function
     */
    const logout = () => {
        // Clear state
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);

        // Clear localStorage
        logoutService();
    };

    /**
     * Check if user has a specific role
     * @param {string} role - Role to check (e.g., 'ROLE_MANAGER')
     * @returns {boolean} True if user has the role
     */
    const hasRole = (role) => {
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
    };

    /**
     * Get user's primary role (first role in the array)
     * @returns {string|null} Primary role or null
     */
    const getPrimaryRole = () => {
        if (!user || !user.roles || user.roles.length === 0) return null;
        return user.roles[0];
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        hasRole,
        getPrimaryRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthProvider;
