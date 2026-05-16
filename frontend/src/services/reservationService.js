import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';
import { isLikelyConfirmationValue } from '../utils/reservationLookup';

export const extractReservationError = (err) => {
    return extractApiErrorMessage(err, 'Reservation request failed. Please try again.');
};

export const isConflictError = (err) => err?.response?.status === 409;

const normalizeFilterValue = (value) => {
    if (value == null) return null;
    const normalized = String(value).trim();
    return normalized ? normalized : null;
};

const normalizeSearchInput = (input) => {
    if (typeof input === 'string') {
        const trimmed = normalizeFilterValue(input);
        if (!trimmed) return {};

        return isLikelyConfirmationValue(trimmed)
            ? { confirmation: trimmed }
            : { guestName: trimmed };
    }

    return input && typeof input === 'object' ? input : {};
};

const buildReservationParams = (filters = {}) => {
    const params = {};
    const normalizedFilters = normalizeSearchInput(filters);
    const confirmation = normalizeFilterValue(normalizedFilters.confirmation);
    const confirmationNumber = normalizeFilterValue(normalizedFilters.confirmationNumber);
    const guestName = normalizeFilterValue(normalizedFilters.guestName);
    const status = normalizeFilterValue(normalizedFilters.status);
    const queueTab = normalizeFilterValue(normalizedFilters.queueTab);
    const checkInDate = normalizeFilterValue(normalizedFilters.checkInDate);
    const checkOutDate = normalizeFilterValue(normalizedFilters.checkOutDate);

    if (confirmation) params.confirmation = confirmation;
    if (confirmationNumber) params.confirmationNumber = confirmationNumber;
    if (guestName) params.guestName = guestName;
    if (status) params.status = status;
    if (queueTab) params.queueTab = queueTab;
    if (checkInDate) params.checkInDate = checkInDate;
    if (checkOutDate) params.checkOutDate = checkOutDate;

    return params;
};

export const createReservation = async (data) => {
    const response = await api.post('/reservations', data);
    return response.data;
};

export const createGuestReservation = async (data) => {
    const response = await api.post('/guest/reservations', data);
    return response.data;
};

export const getAllReservations = async (filters = {}) => {
    const params = buildReservationParams(filters);
    const requestConfig = Object.keys(params).length > 0 ? { params } : undefined;
    const response = await api.get('/reservations', requestConfig);
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

    if (/^\d+$/.test(raw)) {
        return Number(raw);
    }

    const reservation = await getReservationByConfirmationNumber(raw);
    return reservation.id;
};

export const searchReservations = async (query) => {
    const params = buildReservationParams(query);
    if (Object.keys(params).length === 0) return [];

    return getAllReservations(params);
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
