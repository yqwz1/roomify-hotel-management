import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for managing Room Types.
 * Handles fetching, creating, and deleting room types.
 * Manages loading and error states.
 */
export const useRoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all room types
    const fetchRoomTypes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/room-types');
            // Backend returns amenities as comma-separated string string.
            // We might want to parse it here if needed, but for the table display
            // string is fine. For the form, we'll need to handle it.
            setRoomTypes(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch room types');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new room type
    const createRoomType = async (data) => {
        setLoading(true);
        setError(null);
        try {
            // Transform amenities array to comma-separated string if it's an array
            const payload = {
                ...data,
                amenities: Array.isArray(data.amenities) ? data.amenities.join(',') : data.amenities
            };

            const response = await api.post('/room-types', payload);
            setRoomTypes(prev => [...prev, response.data]);
            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create room type';
            const validationErrors = err.response?.data?.validationErrors;
            return { success: false, error: errorMessage, validationErrors };
        } finally {
            setLoading(false);
        }
    };

    // Delete a room type
    const deleteRoomType = async (id) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/room-types/${id}`);
            setRoomTypes(prev => prev.filter(rt => rt.id !== id));
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete room type';
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return {
        roomTypes,
        loading,
        error,
        fetchRoomTypes,
        createRoomType,
        deleteRoomType
    };
};
