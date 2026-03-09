/**
 * reservationService.js
 * API client for reservation endpoints.
 */
import api from './api';

export const extractReservationError = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message ?? 'Unknown error';

    if (data.validationErrors) {
        return Object.values(data.validationErrors).join(' · ');
    }

    if (data.message) return data.message;

    return err.message ?? 'Unknown error';
};

export const isConflictError = (err) => err?.response?.status === 409;

export const createReservation = async (data) => {
    const response = await api.post('/reservations', data);
    return response.data;
};

export const getReservationByConfirmationNumber = async (confirmationNumber) => {
    const response = await api.get(`/reservations/${confirmationNumber}`);
    return response.data;
};

/**
 * Search by confirmation number or guest name.
 * Backend returns a single object; the UI expects a list.
 */
export const searchReservations = async (query) => {
    const trimmed = (query ?? '').trim();
    const isConfirmation = trimmed.toUpperCase().startsWith('RSV-');
    const params = isConfirmation ? { confirmation: trimmed } : { guestName: trimmed };

    const response = await api.get('/reservations/search', { params });
    return [response.data];
};

/**
 * Check in using confirmation number.
 */
export const checkInReservation = async (confirmationNumber) => {
    const response = await api.post(`/reservations/check-in/${confirmationNumber}`);
    return response.data;
};
