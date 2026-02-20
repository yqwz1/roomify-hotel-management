import { useState, useCallback } from 'react';
import {
    getRooms,
    createRoom,
    updateRoomStatus,
    deleteRoom,
    extractErrorMessage,
} from '../services/roomService';

/**
 * useRooms
 * Custom hook for managing Rooms state, loading, and error handling.
 *
 * Exposes:
 *   rooms         – current list of RoomResponse objects
 *   loading       – true while any async operation is in flight
 *   error         – string error message (or null)
 *   fetchRooms    – (filters?) => Promise<void>  — re-fetch with optional filters
 *   addRoom       – (data)     => Promise<{ success, error? }>
 *   changeStatus  – (id, status) => Promise<{ success, error? }>
 *   removeRoom    – (id)       => Promise<{ success, error? }>
 *   clearError    – () => void
 */
export const useRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchRooms = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRooms(filters);
            setRooms(data);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Create ───────────────────────────────────────────────────────────────
    const addRoom = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const created = await createRoom(data);
            setRooms((prev) => [...prev, created]);
            return { success: true };
        } catch (err) {
            const msg = extractErrorMessage(err);
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    };

    // ── Update Status ────────────────────────────────────────────────────────
    const changeStatus = async (id, status) => {
        setLoading(true);
        setError(null);
        try {
            const updated = await updateRoomStatus(id, status);
            setRooms((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r))
            );
            return { success: true };
        } catch (err) {
            const msg = extractErrorMessage(err);
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const removeRoom = async (id) => {
        setLoading(true);
        setError(null);
        try {
            await deleteRoom(id);
            setRooms((prev) => prev.filter((r) => r.id !== id));
            return { success: true };
        } catch (err) {
            const msg = extractErrorMessage(err);
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const clearError = () => setError(null);

    return {
        rooms,
        loading,
        error,
        fetchRooms,
        addRoom,
        changeStatus,
        removeRoom,
        clearError,
    };
};
