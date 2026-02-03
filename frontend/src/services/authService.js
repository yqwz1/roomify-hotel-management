// Authentication Service for Roomify
// This service handles user authentication with both mock and real backend implementations

// MOCK IMPLEMENTATION (Active)
// Remove or comment out this section when backend is ready

/**
 * Mock login function that simulates backend authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} JWT response object matching backend DTO structure
 */
/*
const mockLogin = (email, password) => {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // Simulate validation
            if (!email || !password) {
                reject(new Error('Email and password are required'));
                return;
            }

            // Determine role based on email pattern
            let roles = ['ROLE_GUEST']; // Default role

            if (email.toLowerCase().includes('admin')) {
                roles = ['ROLE_MANAGER'];
            } else if (email.toLowerCase().includes('staff')) {
                roles = ['ROLE_STAFF'];
            }

            // Mock JWT response matching backend DTO structure
            const response = {
                token: 'fake-jwt-token-xyz-' + Date.now(),
                type: 'Bearer',
                id: Math.floor(Math.random() * 1000) + 1,
                username: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'),
                email: email,
                roles: roles
            };

            resolve(response);
        }, 1000); // 1 second delay
    });
};
*/



import api from './api';


/**
 * Real login function using Axios to communicate with backend
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} JWT response object from backend
 */
const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', {
            email,
            password
        });

        // Backend should return JwtResponse DTO:
        // {
        //   token: string,
        //   type: string (e.g., "Bearer"),
        //   id: number,
        //   username: string,
        //   email: string,
        //   roles: string[] (e.g., ["ROLE_MANAGER", "ROLE_STAFF"])
        // }
        return response.data;
    } catch (error) {
        // Handle error response from backend
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        // Fallback error message (or backend strictly returns string body)
        if (error.response && error.response.data && typeof error.response.data === 'string') {
            throw new Error(error.response.data);
        }
        throw new Error('Login failed. Please check your credentials and try again.');
    }
};


/**
 * Login function - currently uses mock implementation
 * Switch to real implementation by uncommenting above and removing mock
 */
// export const login = mockLogin;
export { login };


/**
 * Logout function - clears authentication data
 * This works for both mock and real implementations
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

/**
 * Get stored token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export const getStoredToken = () => {
    return localStorage.getItem('token');
};

/**
 * Get stored user data from localStorage
 * @returns {Object|null} User object or null if not found
 */
export const getStoredUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
};

/**
 * Store authentication data in localStorage
 * @param {string} token - JWT token
 * @param {Object} user - User object
 */
export const storeAuthData = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};
