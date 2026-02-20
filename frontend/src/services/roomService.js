/**
 * roomService.js
 * API client for Rooms CRUD + status transitions.
 *
 * Backend base: GET|POST /api/rooms  ·  PUT /api/rooms/{id}  ·  DELETE /api/rooms/{id}
 *               PUT /api/rooms/{id}/status?status=<ENUM>
 *
 * All endpoints require ROLE_MANAGER (Bearer JWT sent automatically by api.js).
 *
 * RoomResponse shape returned by the backend:
 *   {
 *     id:         Long,
 *     roomNumber: String,
 *     roomType:   { id, name, basePrice, maxGuests, amenities, description },
 *     floor:      Integer,
 *     status:     "AVAILABLE" | "OCCUPIED" | "NEEDS_CLEANING" | "UNDER_MAINTENANCE"
 *   }
 *
 * RoomRequest shape expected by POST / PUT:
 *   { roomNumber, roomTypeId, floor, status }
 */
import api from './api';

// ─── Error Normaliser ────────────────────────────────────────────────────────
/**
 * Extract a human-readable message from any Axios error.
 * Covers ApiError shape { message } and Bean Validation shape { validationErrors }.
 */
export const extractErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message ?? 'Unknown error';

    // Bean Validation errors: { validationErrors: { field: msg } }
    if (data.validationErrors) {
        return Object.values(data.validationErrors).join(' · ');
    }

    // Standard ApiError: { message }
    if (data.message) return data.message;

    return err.message ?? 'Unknown error';
};

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetch rooms — all params are optional query strings.
 * @param {{ status?: string, floor?: number, type?: string }} filters
 *   - status : "AVAILABLE" | "OCCUPIED" | "NEEDS_CLEANING" | "UNDER_MAINTENANCE"
 *   - floor  : integer
 *   - type   : room type name, e.g. "Deluxe" (backend uses case-insensitive match)
 * @returns {Promise<RoomResponse[]>}
 */
export const getRooms = async (filters = {}) => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.floor) params.floor = filters.floor;
    if (filters.type) params.type = filters.type;

    const response = await api.get('/rooms', { params });
    return response.data;
};

/**
 * Fetch a single room by ID.
 * @returns {Promise<RoomResponse>}
 */
export const getRoomById = async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
};

/**
 * Create a new room.
 * @param {{ roomNumber: string, roomTypeId: number, floor: number, status: string }} data
 * @returns {Promise<RoomResponse>}
 */
export const createRoom = async (data) => {
    const response = await api.post('/rooms', data);
    return response.data;
};

/**
 * Update all room fields (NOT for status-only changes — use updateRoomStatus for that).
 * @param {number} id
 * @param {{ roomNumber: string, roomTypeId: number, floor: number, status: string }} data
 * @returns {Promise<RoomResponse>}
 */
export const updateRoom = async (id, data) => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
};

/**
 * Update ONLY the room's status, using the dedicated status-transition endpoint.
 * Backend enforces transition rules (e.g. OCCUPIED → AVAILABLE is blocked → 422).
 * @param {number} id
 * @param {string} status – "AVAILABLE" | "OCCUPIED" | "NEEDS_CLEANING" | "UNDER_MAINTENANCE"
 * @returns {Promise<RoomResponse>}
 */
export const updateRoomStatus = async (id, status) => {
    const response = await api.put(`/rooms/${id}/status`, null, {
        params: { status },
    });
    return response.data;
};

/**
 * Delete a room.
 * Backend returns 409 Conflict if the room is OCCUPIED.
 * @returns {Promise<void>}
 */
export const deleteRoom = async (id) => {
    await api.delete(`/rooms/${id}`);
};
