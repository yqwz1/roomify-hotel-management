/**
 * reservationService.js
 * API client for the Reservations endpoints.
 *
 * Backend base: POST /api/reservations
 *               GET  /api/reservations/{confirmationNumber}
 *
 * Requires ROLE_MANAGER or ROLE_STAFF (Bearer JWT sent automatically by api.js).
 *
 * ReservationCreateRequest shape:
 *   {
 *     roomId:       Long,
 *     checkInDate:  "YYYY-MM-DD",
 *     checkOutDate: "YYYY-MM-DD",
 *     status?:      "PENDING" | "CONFIRMED",
 *     guest: {
 *       name:        String,
 *       email:       String,
 *       phone:       String,
 *       idNumber:    String,
 *       nationality: String,
 *     }
 *   }
 *
 * ReservationResponse shape returned by the backend:
 *   {
 *     id:                 Long,
 *     confirmationNumber: String,   // "RSV-XXXXXXXXXXXX"
 *     status:             String,   // "PENDING" | "CONFIRMED"
 *     roomId:             Long,
 *     roomNumber:         String,
 *     guestId:            Long,
 *     guestName:          String,
 *     guestEmail:         String,
 *     checkInDate:        "YYYY-MM-DD",
 *     checkOutDate:       "YYYY-MM-DD",
 *     nights:             Long,
 *     roomRate:           BigDecimal,
 *     subtotal:           BigDecimal,
 *     taxes:              BigDecimal,
 *     totalPrice:         BigDecimal,
 *   }
 */
import api from './api';

// ─── Error Normaliser ──────────────────────────────────────────────────────────
/**
 * Extracts a human-readable error message from any Axios error.
 * Handles:
 *   - ApiError shape      { message }
 *   - Validation shape    { validationErrors: { field: msg } }
 *   - 409 Conflict        { message: "Room is already booked..." }
 */
export const extractReservationError = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message ?? 'Unknown error';

    if (data.validationErrors) {
        return Object.values(data.validationErrors).join(' · ');
    }

    if (data.message) return data.message;

    return err.message ?? 'Unknown error';
};

/**
 * Returns true if the error is a 409 Conflict (double-booking).
 */
export const isConflictError = (err) => err?.response?.status === 409;

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * Create a new reservation.
 * @param {{
 *   roomId: number,
 *   checkInDate: string,
 *   checkOutDate: string,
 *   guest: { name, email, phone, idNumber, nationality }
 * }} data
 * @returns {Promise<ReservationResponse>}
 */
export const createReservation = async (data) => {
    const response = await api.post('/reservations', data);
    return response.data;
};

/**
 * Fetch a reservation by its confirmation number.
 * @param {string} confirmationNumber  e.g. "RSV-XXXXXXXXXXXX"
 * @returns {Promise<ReservationResponse>}
 */
export const getReservationByConfirmationNumber = async (confirmationNumber) => {
    const response = await api.get(`/reservations/${confirmationNumber}`);
    return response.data;
};

// ─── Day 2: Azam's Search Endpoint ────────────────────────────────────────────
/**
 * Search for reservations by confirmation number OR guest name.
 * Replaces mockLookup() in ReservationLookupPanel — swap import when ready.
 *
 * Endpoint: GET /api/reservations/search
 * Auth:     ROLE_MANAGER | ROLE_STAFF (Bearer JWT sent by api.js)
 *
 * @param {string} query  Confirmation number (e.g. "RSV-…") or partial guest name
 * @returns {Promise<ReservationLookupResponse[]>}
 *   Returns an array for drop-in compatibility with mockLookup().
 *   A single result is wrapped in [result] so the lookup panel renders consistently.
 */
export const searchReservations = async (query) => {
    const trimmed = (query ?? '').trim();
    const isConfirmation = trimmed.toUpperCase().startsWith('RSV-');
    const params = isConfirmation
        ? { confirmation: trimmed }
        : { guestName: trimmed };

    const response = await api.get('/reservations/search', { params });
    // Backend returns a single ReservationLookupResponse — wrap in array for the panel
    return [response.data];
};

// ─── Day 2: Wahib's Check-In Endpoint ─────────────────────────────────────────
/**
 * Perform a guest check-in.
 * Replaces the setTimeout mock in CheckIn.jsx — swap import + call when ready.
 *
 * Endpoint: POST /api/reservations/{id}/check-in
 * Auth:     ROLE_MANAGER | ROLE_STAFF (Bearer JWT sent by api.js)
 *
 * @param {number} id                Reservation ID (Long on the backend)
 * @param {string} actualCheckInDate ISO date string "YYYY-MM-DD" (today or past)
 * @returns {Promise<ReservationActionPlaceholderResponse>}
 *   Shape: { reservationId, action, message, placeholder, currentStatus }
 *
 * Error codes:
 *   400 – actualCheckInDate missing or in the future
 *   409 – wrong reservation status, early actual date, or room not available
 *   403 – caller is not MANAGER or STAFF
 */
export const checkInReservation = async (id, actualCheckInDate) => {
    const response = await api.post(`/reservations/${id}/check-in`, { actualCheckInDate });
    return response.data;
};
