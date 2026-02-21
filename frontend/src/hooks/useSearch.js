import { useState, useCallback } from 'react';
import { searchRooms, extractSearchError } from '../services/searchService';

/**
 * useSearch
 * Custom hook for the room availability search flow.
 *
 * Exposes:
 *   results      – RoomResponse[] from the last successful search
 *   totalResults – integer count from backend
 *   loading      – true while the request is in flight
 *   error        – human-readable string error, or null
 *   hasSearched  – true once the user has submitted at least one search
 *   search       – (params) => Promise<void>  — trigger a new search
 *   clearError   – () => void
 *   clearResults – () => void  — reset to initial state
 */
export const useSearch = () => {
    const [results, setResults] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const search = useCallback(async (params) => {
        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const data = await searchRooms(params);
            setResults(data.rooms ?? []);
            setTotalResults(data.totalResults ?? 0);
        } catch (err) {
            setError(extractSearchError(err));
            setResults([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = () => setError(null);
    const clearResults = () => {
        setResults([]);
        setTotalResults(0);
        setHasSearched(false);
        setError(null);
    };

    return {
        results,
        totalResults,
        loading,
        error,
        hasSearched,
        search,
        clearError,
        clearResults,
    };
};
