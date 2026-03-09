import { useState } from 'react';
import { searchReservations } from '../services/reservationService';
import StatusPill from './StatusPill';
import { useTranslation } from 'react-i18next';
import { LtrText } from './LtrText';


/**
 * ReservationLookupPanel
 * Search for a reservation by confirmation number or guest name.
 * Uses real API data via searchReservations() from reservationService.
 *
 * Props:
 *   onSelect   {Function}  – (reservation) => void — called when user picks a result
 *   className? {string}
 */
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
            // The searchReservations function returns an array, but if empty it might be []
            // The object contains nested structures: guest, room, dates, pricing
            setResults(data);
            setSearched(true);
        } catch {
            setError(t('failedSearch'));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        const locale = i18n.language.startsWith('ar') ? 'ar-SA' : 'en-US';
        return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
            <h2 className="mb-1 text-sm font-semibold text-gray-700">{t('reservationLookup')}</h2>
            <p className="mb-4 text-xs text-gray-400">{t('searchDescription')}</p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-400">
                        🔍
                    </span>
                    <input
                        id="lookup-query"
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
                        placeholder={t('searchPlaceholder')}
                        className="w-full rounded-lg border border-gray-300 py-2 ps-9 pe-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {loading ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : t('search')}
                </button>
            </form>

            {/* Error */}
            {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="mt-4 space-y-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                </div>
            )}

            {/* No results */}
            {!loading && searched && results.length === 0 && (
                <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-gray-200 py-8 text-center">
                    <span className="text-3xl">🔍</span>
                    <p className="mt-2 text-sm font-medium text-gray-600">{t('noReservations')}</p>
                    <p className="text-xs text-gray-400">{t('tryDifferent')}</p>
                </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
                <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                    {results.map((r, idx) => {
                        // The search API might return a single object, we'll map over it
                        // if we wrapped it in an array in the service.
                        const isMock = !r.guest; // mock records don't have nested .guest 
                        
                        const id = r.id || r.confirmationNumber || idx;
                        const guestName = isMock ? r.guestName : r.guest?.name;
                        const conf = isMock ? r.confirmationNumber : r.confirmationNumber;
                        const roomNum = isMock ? r.roomNumber : r.room?.roomNumber;
                        const checkIn = isMock ? r.checkInDate : r.dates?.checkIn;
                        const checkOut = isMock ? r.checkOutDate : r.dates?.checkOut;

                        return (
                        <li key={id}>
                            <button
                                onClick={() => onSelect?.(r)}
                                className="w-full px-4 py-3 text-start transition hover:bg-blue-50 focus:outline-none focus:bg-blue-50"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{guestName}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5"><LtrText>{conf}</LtrText></p>
                                        <p className="text-xs text-gray-400 mt-0.5 flex gap-1 items-center flex-wrap">
                                            <span>{t('room')} <LtrText>{roomNum}</LtrText></span>
                                            <span>·</span>
                                            <span className="font-mono text-[10px]"><LtrText>{formatDate(checkIn)}</LtrText></span>
                                            <span>→</span>
                                            <span className="font-mono text-[10px]"><LtrText>{formatDate(checkOut)}</LtrText></span>
                                        </p>
                                    </div>
                                    <StatusPill status={r.status} size="sm" />
                                </div>
                            </button>
                        </li>
                    )})}
                </ul>
            )}
        </div>
    );
}
