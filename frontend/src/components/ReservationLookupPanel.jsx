import { useState } from 'react';
import { searchReservations } from '../services/reservationService';
import StatusPill from './StatusPill';
import { useTranslation } from 'react-i18next';
import { LtrText } from './LtrText';


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

export default function ReservationLookupPanel({ onSelect, className = '' }) {
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(false);

        try {
            const data = await searchReservations(query);
            setResults(Array.isArray(data) ? data : []);
            setSearched(true);
        } catch {
            setError('Failed to search reservations. Please try again.');
            setResults([]);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '-';
        return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
            <h2 className="mb-1 text-sm font-semibold text-gray-700">Reservation Lookup</h2>
            <p className="mb-4 text-xs text-gray-400">Search by confirmation number (e.g. RSV-...) or guest name.</p>

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
                        }}
                        placeholder="RSV-XXXXXXXXXXXX or Guest Name"
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
                <p className="mt-4 rounded-full bg-red-50 border border-red-100 px-5 py-3 text-sm font-medium text-red-900">{error}</p>
            )}

            {!loading && searched && results.length === 0 && (
                <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-gray-200 py-8 text-center">
                    <p className="mt-2 text-sm font-medium text-gray-600">No reservations found</p>
                    <p className="text-xs text-gray-400">Try a different confirmation number or guest name.</p>
                </div>
            )}

            {!loading && results.length > 0 && (
                <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                    {results.map((record, idx) => {
                        const reservation = toUiReservation(record, idx);
                        return (
                            <li key={reservation._rowKey}>
                                <button
                                    onClick={() => onSelect?.(reservation)}
                                    className="w-full px-4 py-3 text-left transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                                >
                                    <div className="flex items-center justify-between gap-2">
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
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
