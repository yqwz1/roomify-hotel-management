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
