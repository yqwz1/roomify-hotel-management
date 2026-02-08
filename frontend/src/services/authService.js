import api from './api';

/**
 * Real login function using Axios to communicate with backend
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} JWT response object from backend
 */
export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', {
            email,
            password
        });
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
 * Logout function - clears authentication data
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
        } catch {
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
