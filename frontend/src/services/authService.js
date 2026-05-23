import api from './api';
import i18n from '../i18n';
import { localizeKnownServerMessage } from '../utils/localization';

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
            throw new Error(localizeKnownServerMessage(error.response.data.message, i18n.t.bind(i18n)));
        }
        // Fallback error message (or backend strictly returns string body)
        if (error.response && error.response.data && typeof error.response.data === 'string') {
            throw new Error(localizeKnownServerMessage(error.response.data, i18n.t.bind(i18n)));
        }
        throw new Error(i18n.t('loginFailedDefault'));
    }
};

export const register = async ({ name, email, password }) => {
    try {
        const response = await api.post('/auth/register', {
            name,
            email,
            password
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.validationErrors) {
            const messages = Object.values(error.response.data.validationErrors).filter(Boolean);
            if (messages.length) {
                throw new Error(localizeKnownServerMessage(messages.join(' · '), i18n.t.bind(i18n)));
            }
        }
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(localizeKnownServerMessage(error.response.data.message, i18n.t.bind(i18n)));
        }
        if (error.response && error.response.data && typeof error.response.data === 'string') {
            throw new Error(localizeKnownServerMessage(error.response.data, i18n.t.bind(i18n)));
        }
        throw new Error(i18n.t('signupFailedDefault', { defaultValue: 'Unable to create your account. Please try again.' }));
    }
};

export const deleteMyAccount = async () => {
    await api.delete('/account');
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
