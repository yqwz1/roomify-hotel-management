/**
 * searchService.js
 * API client for the room availability search endpoint.
 *
 * Endpoint: GET /api/rooms/search
 * Auth:     NONE — this endpoint is public (no Bearer token sent).
 * Doc:      RoomSearchRequest / RoomSearchResponse
 *
 * Request params (all passed as URL query strings):
 *   checkIn        string   required   ISO date "YYYY-MM-DD"
 *   checkOut       string   required   ISO date "YYYY-MM-DD"
 *   roomType       string   optional   e.g. "Deluxe" (exact match)
 *   minPrice       number   optional   e.g. 100
 *   maxPrice       number   optional   e.g. 400
 *   guestCapacity  number   optional   minimum guests the room must hold
 *   sortBy         string   optional   "PRICE" | "ROOM_TYPE"  (default: PRICE)
 *   sortDirection  string   optional   "ASC"   | "DESC"       (default: ASC)
 *
 * Success response: { rooms: RoomResponse[], totalResults: number }
 * Error response:  { status, error, message, path } — 400 for bad dates/prices
 */
import axios from 'axios';

// ── Dedicated public client (no auth header) ──────────────────────────────────
const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// ── Error normaliser ──────────────────────────────────────────────────────────
/**
 * Extract a human-readable message from any Axios error.
 * Covers standard ApiError { message } and Bean Validation { validationErrors }.
 */
export const extractSearchError = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message ?? 'Search failed. Please try again.';

    // Bean Validation: { validationErrors: { field: message } }
    if (data.validationErrors) {
        return Object.values(data.validationErrors).join(' · ');
    }

    // Standard ApiError: { message }
    if (data.message) return data.message;

    return err.message ?? 'Search failed.';
};

// ── Main search function ──────────────────────────────────────────────────────
/**
 * Search for available rooms matching the given date range and optional filters.
 *
 * @param {{
 *   checkIn:       string,
 *   checkOut:      string,
 *   roomType?:     string,
 *   minPrice?:     number,
 *   maxPrice?:     number,
 *   guestCapacity?: number,
 *   sortBy?:       'PRICE' | 'ROOM_TYPE',
 *   sortDirection?: 'ASC' | 'DESC'
 * }} params
 *
 * @returns {Promise<{ rooms: RoomResponse[], totalResults: number }>}
 */
export const searchRooms = async (params) => {
    const query = {};

    // Required
    query.checkIn = params.checkIn;
    query.checkOut = params.checkOut;

    // Optional — only include when non-empty
    if (params.roomType) query.roomType = params.roomType;
    if (params.minPrice) query.minPrice = params.minPrice;
    if (params.maxPrice) query.maxPrice = params.maxPrice;
    if (params.guestCapacity) query.guestCapacity = params.guestCapacity;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortDirection) query.sortDirection = params.sortDirection;

    const response = await publicApi.get('/rooms/search', { params: query });
    return response.data; // { rooms: [], totalResults: N }
};
