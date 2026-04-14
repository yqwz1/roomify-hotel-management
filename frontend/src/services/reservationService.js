import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractReservationError = (err) => {
    return extractApiErrorMessage(err, 'Reservation request failed. Please try again.');
};

export const isConflictError = (err) => err?.response?.status === 409;

export const createReservation = async (data) => {
    const response = await api.post('/reservations', data);
    return response.data;
};

export const getAllReservations = async () => {
    const response = await api.get('/reservations');
    return response.data;
};

export const getReservationByConfirmationNumber = async (confirmationNumber) => {
    const response = await api.get(`/reservations/${confirmationNumber}`);
    return response.data;
};

const resolveReservationId = async (idOrConfirmation) => {
    if (typeof idOrConfirmation === 'number' && Number.isFinite(idOrConfirmation)) {
        return idOrConfirmation;
    }

    const raw = String(idOrConfirmation ?? '').trim();
    if (!raw) {
        throw new Error('Invalid reservation identifier');
    }

    if (raw.toUpperCase().startsWith('RSV-')) {
        const reservation = await getReservationByConfirmationNumber(raw);
        return reservation.id;
    }

    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
    }

    throw new Error('Invalid reservation identifier');
};

export const searchReservations = async (query) => {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return [];

    const isConfirmation = trimmed.toUpperCase().startsWith('RSV-');
    if (isConfirmation) {
        const lookupResponse = await api.get('/reservations/search', {
            params: { confirmation: trimmed },
        });
        const lookup = lookupResponse.data;

        let id = null;
        try {
            const full = await getReservationByConfirmationNumber(lookup.confirmationNumber);
            id = full.id;
        } catch {
            // Allow UI lookup rendering even if id enrichment fails.
        }

        return [{ ...lookup, id }];
    }

    const reservations = await getAllReservations();
    const normalizedQuery = trimmed.toLowerCase();

    return reservations.filter((reservation) => {
        const guestName = String(
            reservation?.guestName ?? reservation?.guest?.name ?? ''
        ).toLowerCase();

        return guestName.includes(normalizedQuery);
    });
};

export const checkInReservation = async (confirmationNumber) => {
    const response = await api.post(`/reservations/check-in/${confirmationNumber}`);
    return response.data;
};

export const cancelReservation = async (idOrConfirmation, reason) => {
    const id = await resolveReservationId(idOrConfirmation);
    const payload = {};
    const trimmedReason = (reason ?? '').trim();

    if (trimmedReason) {
        payload.cancellationReason = trimmedReason;
    }

    const response = await api.post(`/reservations/${id}/cancel`, payload);
    return response.data;
};

export const modifyReservation = async (idOrConfirmation, data) => {
    const id = await resolveReservationId(idOrConfirmation);
    const response = await api.put(`/reservations/${id}`, data);
    return response.data;
};

/**
 * Fetches the itemised bill for a reservation.
 * @param {string} confirmationNumber - The reservation confirmation number
 * @param {number} [serviceCharges=0] - Optional additional service charges
 * @param {number} [discountAmount=0] - Optional discount amount
 * @returns {Promise<BillResponse>}
 */
export const getBill = async (confirmationNumber, serviceCharges = 0, discountAmount = 0) => {
    const response = await api.get(`/reservations/${confirmationNumber}/bill`, {
        params: { serviceCharges, discountAmount },
    });
    return response.data;
};

/**
 * Executes checkout for a reservation. Requires paid balance (balanceDue = 0).
 * @param {string} confirmationNumber - The reservation confirmation number
 * @returns {Promise<ReservationActionPlaceholderResponse>}
 */
export const checkOutReservation = async (confirmationNumber) => {
    const response = await api.post(`/reservations/check-out/${confirmationNumber}`);
    return response.data;
};
