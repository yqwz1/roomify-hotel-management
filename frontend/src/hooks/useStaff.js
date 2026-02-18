import { useState, useCallback } from 'react';
import * as staffService from '../services/staffService';

/**
 * Custom hook for managing Staff
 * Handles fetching, creating, updating, activating, deactivating, and unlocking staff
 * Manages loading and error states
 */
export const useStaff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch all staff with optional filters
     * @param {Object} filters - Query parameters for filtering
     */
    const fetchStaff = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffService.getStaff(filters);
            setStaff(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch staff');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Create a new staff member
     * @param {Object} data - Staff data (email, name, department)
     * @returns {Promise<Object>} Result object with success flag
     */
    const createStaff = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const newStaff = await staffService.createStaff(data);
            setStaff(prev => [...prev, newStaff]);
            return { success: true, data: newStaff };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create staff';
            const validationErrors = err.response?.data?.validationErrors;
            return { success: false, error: errorMessage, validationErrors };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update an existing staff member
     * @param {number} id - Staff ID
     * @param {Object} data - Updated staff data (name, department)
     * @returns {Promise<Object>} Result object with success flag
     */
    const updateStaff = async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const updatedStaff = await staffService.updateStaff(id, data);
            setStaff(prev => prev.map(s => s.id === id ? updatedStaff : s));
            return { success: true, data: updatedStaff };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update staff';
            const validationErrors = err.response?.data?.validationErrors;
            return { success: false, error: errorMessage, validationErrors };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Activate a staff member's account
     * @param {number} id - Staff ID
     * @returns {Promise<Object>} Result object with success flag
     */
    const activateStaff = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const updatedStaff = await staffService.activateStaff(id);
            setStaff(prev => prev.map(s => s.id === id ? updatedStaff : s));
            return { success: true, data: updatedStaff };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to activate staff';
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deactivate a staff member's account
     * @param {number} id - Staff ID
     * @returns {Promise<Object>} Result object with success flag
     */
    const deactivateStaff = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const updatedStaff = await staffService.deactivateStaff(id);
            setStaff(prev => prev.map(s => s.id === id ? updatedStaff : s));
            return { success: true, data: updatedStaff };
        } catch (err) {
            // Handle 409 Conflict for self-deactivation
            if (err.response?.status === 409) {
                return {
                    success: false,
                    error: err.response?.data?.message || 'You cannot deactivate your own account'
                };
            }
            const errorMessage = err.response?.data?.message || 'Failed to deactivate staff';
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Manually unlock a locked staff account
     * Clears failed login attempts and lockout timestamp
     * @param {number} id - Staff ID
     * @returns {Promise<Object>} Result object with success flag
     */
    const unlockStaff = async (id) => {
        setLoading(true);
        setError(null);
        try {
            await staffService.unlockStaff(id);
            // Note: Backend returns 204 No Content, no updated data
            // We might want to refetch the staff list or mark as unlocked locally
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to unlock staff account';
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return {
        staff,
        loading,
        error,
        fetchStaff,
        createStaff,
        updateStaff,
        activateStaff,
        deactivateStaff,
        unlockStaff
    };
};
