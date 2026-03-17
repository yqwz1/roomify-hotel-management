import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchReservations } from '../services/reservationService';
import StatusPill from './StatusPill';
import { extractApiErrorMessage } from '../utils/apiError';

const isConfirmationQuery = (value) => String(value ?? '').trim().toUpperCase().startsWith('RSV-');

const toUiReservation = (record, fallbackIndex) => {
    const isLegacy = !record?.guest;

    return {
        id: record?.id ?? null,
        confirmationNumber: record?.confirmationNumber,
        status: record?.status,
        guestName: isLegacy ? record?.guestName : record?.guest?.name,
        guestEmail: isLegacy ? record?.guestEmail : record?.guest?.email,
        roomId: isLegacy ? record?.roomId : record?.room?.id,
        roomNumber: isLegacy ? record?.roomNumber : record?.room?.roomNumber,
        roomTypeName: isLegacy ? record?.roomTypeName : record?.room?.roomTypeName,
        floor: isLegacy ? record?.floor : record?.room?.floor,
        checkInDate: isLegacy ? record?.checkInDate : record?.dates?.checkIn,
        checkOutDate: isLegacy ? record?.checkOutDate : record?.dates?.checkOut,
        nights: isLegacy ? record?.nights : record?.dates?.nights,
        roomRate: isLegacy ? record?.roomRate : record?.pricing?.roomRate,
        subtotal: isLegacy ? record?.subtotal : record?.pricing?.subtotal,
        taxes: isLegacy ? record?.taxes : record?.pricing?.taxes,
        totalPrice: isLegacy ? record?.totalPrice : record?.pricing?.totalPrice,
        guest: record?.guest,
        room: record?.room,
        dates: record?.dates,
        pricing: record?.pricing,
        _rowKey: record?.id ?? record?.confirmationNumber ?? fallbackIndex,
    };
};

export default function ReservationLookupPanel({
    onSelect,
    className = '',
    initialQuery = '',
    autoSearch = true,
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);
    const [searchedByGuestName, setSearchedByGuestName] = useState(false);

    const handleSearch = useCallback(async (e, forcedQuery) => {
        e?.preventDefault?.();
        const q = (forcedQuery ?? query).trim();
        if (!q) return;

        setLoading(true);
        setError(null);
        setSearched(false);
        setSearchedByGuestName(!isConfirmationQuery(q));

        try {
            const data = await searchReservations(q);
            setResults(Array.isArray(data) ? data : []);
            setSearched(true);
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to search reservations. Please try again.'));
            setResults([]);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        const trimmed = String(initialQuery ?? '').trim();
        if (!trimmed) return;
        setQuery(trimmed);
        if (autoSearch) {
            handleSearch(null, trimmed);
        }
    }, [initialQuery, autoSearch, handleSearch]);

    const formatDate = (iso) => {
        if (!iso) return '-';
        return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const reservation = useMemo(
        () => (results.length > 0 ? toUiReservation(results[0], 0) : null),
        [results]
    );

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
            <h2 className="mb-1 text-sm font-semibold text-gray-700">Reservation Lookup</h2>
            <p className="mb-4 text-xs text-gray-400">
                Search by confirmation number. Guest-name search returns the first matching reservation.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        Search
                    </span>
                    <input
                        id="lookup-query"
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSearched(false);
                            setSearchedByGuestName(false);
                        }}
                        placeholder="RSV-XXXXXXXXXXXX or guest name"
                        className="w-full rounded-lg border border-gray-300 py-2 pl-16 pr-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                    {loading ? 'Loading...' : 'Search'}
                </button>
            </form>

            {error && (
                <p className="mt-4 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-900">
                    {error}
                </p>
            )}

            {!loading && searched && !reservation && (
                <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-gray-200 py-8 text-center">
                    <p className="mt-2 text-sm font-medium text-gray-600">No reservation found</p>
                    <p className="text-xs text-gray-400">
                        Try a confirmation number or a more specific guest name.
                    </p>
                </div>
            )}

            {!loading && reservation && (
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                    {searchedByGuestName && (
                        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
                            Guest-name search returns the first matching reservation. Use the confirmation number when available.
                        </div>
                    )}

                    <div className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {reservation.guestName ?? 'Guest'}
                                </p>
                                <p className="font-mono text-xs text-gray-500">
                                    {reservation.confirmationNumber}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    Room {reservation.roomNumber} - {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)}
                                </p>
                            </div>
                            <StatusPill status={reservation.status} size="sm" />
                        </div>

                        <button
                            type="button"
                            onClick={() => onSelect?.(reservation)}
                            className="mt-4 w-full rounded-full bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        >
                            Use This Reservation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
