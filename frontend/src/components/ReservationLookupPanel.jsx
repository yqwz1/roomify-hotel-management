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
        <div className={`rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 ${className}`}>
            <h2 className="mb-2 text-xl font-extrabold text-black tracking-tight">{t('reservationLookup')}</h2>
            <p className="mb-6 text-sm text-zinc-500">{t('searchDescription')}</p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-zinc-400">
                        🔍
                    </span>
                    <input
                        id="lookup-query"
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
                        placeholder={t('searchPlaceholder')}
                        className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-3 ps-12 pe-5 text-sm font-medium text-black focus:bg-white focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
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
                <p className="mt-4 rounded-full bg-red-50 border border-red-100 px-5 py-3 text-sm font-medium text-red-900">{error}</p>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="mt-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col gap-3 rounded-3xl border border-zinc-100 p-5 animate-pulse bg-white">
                            <div className="flex justify-between items-center">
                                <div className="h-5 w-1/3 rounded bg-zinc-200" />
                                <div className="h-6 w-16 rounded-full bg-zinc-200" />
                            </div>
                            <div className="h-4 w-1/4 rounded bg-zinc-100" />
                            <div className="h-4 w-2/3 rounded bg-zinc-100" />
                        </div>
                    ))}
                </div>
            )}

            {/* No results */}
            {!loading && searched && results.length === 0 && (
                <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 py-12 px-6 text-center">
                    <span className="text-4xl mb-4 opacity-50">🔍</span>
                    <p className="text-base font-bold text-black">{t('noReservations')}</p>
                    <p className="mt-1 text-sm text-zinc-500">{t('tryDifferent')}</p>
                </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
                <ul className="mt-6 space-y-3">
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
                        <li key={id} className="relative">
                            <button
                                onClick={() => onSelect?.(r)}
                                className="w-full flex flex-col text-start rounded-3xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                            >
                                <div className="flex items-center justify-between w-full mb-3">
                                    <p className="text-lg font-bold text-black">{guestName}</p>
                                    <StatusPill status={r.status} size="sm" />
                                </div>
                                <p className="text-sm font-mono text-zinc-500 mb-2"><LtrText>{conf}</LtrText></p>
                                <p className="text-sm text-zinc-500 flex gap-2 items-center flex-wrap">
                                    <span className="font-semibold text-black">{t('room')} <LtrText>{roomNum}</LtrText></span>
                                    <span className="text-zinc-300">•</span>
                                    <span className="font-mono text-xs font-semibold"><LtrText>{formatDate(checkIn)}</LtrText></span>
                                    <span className="text-zinc-400">→</span>
                                    <span className="font-mono text-xs font-semibold"><LtrText>{formatDate(checkOut)}</LtrText></span>
                                </p>
                            </button>
                        </li>
                    )})}
                </ul>
            )}
        </div>
    );
}
