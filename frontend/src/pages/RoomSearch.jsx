import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import DateRangePicker from '../components/DateRangePicker';
import RoomFilters from '../components/RoomFilters';
import ErrorBanner from '../components/ErrorBanner';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FILTERS = { status: '', type: '', floor: '', minPrice: '', maxPrice: '' };

const STATUS_COLORS = {
    AVAILABLE: 'bg-green-100 text-green-800',
    OCCUPIED: 'bg-red-100 text-red-800',
    NEEDS_CLEANING: 'bg-yellow-100 text-yellow-800',
    UNDER_MAINTENANCE: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    NEEDS_CLEANING: 'Needs Cleaning',
    UNDER_MAINTENANCE: 'Under Maintenance',
};

// Room type → display icon
const typeIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('suite')) return '🛎️';
    if (n.includes('family')) return '👨‍👩‍👧‍👦';
    if (n.includes('deluxe')) return '🌟';
    return '🛏️';
};

// Sort options shown in the UI
const SORT_OPTIONS = [
    { label: 'Price: Low → High', sortBy: 'PRICE', sortDirection: 'ASC' },
    { label: 'Price: High → Low', sortBy: 'PRICE', sortDirection: 'DESC' },
    { label: 'Type A → Z', sortBy: 'ROOM_TYPE', sortDirection: 'ASC' },
    { label: 'Type Z → A', sortBy: 'ROOM_TYPE', sortDirection: 'DESC' },
];

// ─── Skeleton card for loading state ─────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
            <div className="h-36 rounded-t-xl bg-gray-200" />
            <div className="flex flex-col gap-3 p-4">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="h-8 w-full rounded-lg bg-gray-200 mt-auto" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * RoomSearch  –  /search
 * Staff / Manager view: search available rooms by date + filters via live API.
 * Endpoint: GET /api/rooms/search (public — no auth header needed).
 * "Book Now" navigates to /book?roomId=<id> with dates in state.
 */
export default function RoomSearch() {
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

    const [checkIn, setCheckIn] = useState(today);
    const [checkOut, setCheckOut] = useState(tomorrow);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

    const {
        results,
        totalResults,
        loading,
        error,
        hasSearched,
        search,
        clearError,
    } = useSearch();

    // ── Derived ──────────────────────────────────────────────────────────────
    const nights = useMemo(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
        return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
    }, [checkIn, checkOut]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSearch = () => {
        if (!checkIn || !checkOut) return;

        search({
            checkIn,
            checkOut,
            roomType: filters.type || undefined,
            minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
            // guestCapacity not in RoomFilters — future enhancement
            sortBy: sortOption.sortBy,
            sortDirection: sortOption.sortDirection,
        });
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
    };

    const handleBookNow = (room) => {
        navigate(`/book?roomId=${room.id}`, {
            state: { checkIn, checkOut, room },
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">

            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Room Search</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Find available rooms for your guests — live availability from the database.
                </p>
            </div>

            {/* ── Error Banner ── */}
            <div className="mb-4">
                <ErrorBanner message={error} onClose={clearError} />
            </div>

            {/* ── Date Picker + Sort + Search Button ── */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">Select Stay Dates</h2>

                <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onCheckInChange={setCheckIn}
                    onCheckOutChange={setCheckOut}
                />

                {nights > 0 && (
                    <p className="mt-2 text-sm text-blue-600 font-medium">
                        📆 {nights} night{nights !== 1 ? 's' : ''} selected
                    </p>
                )}

                {/* Sort selector + Search button */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort-select" className="text-xs font-medium text-gray-600 whitespace-nowrap">
                            Sort by:
                        </label>
                        <select
                            id="sort-select"
                            value={SORT_OPTIONS.indexOf(sortOption)}
                            onChange={(e) => setSortOption(SORT_OPTIONS[Number(e.target.value)])}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            {SORT_OPTIONS.map((opt, i) => (
                                <option key={opt.label} value={i}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading || !checkIn || !checkOut || checkOut <= checkIn}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Searching…
                            </span>
                        ) : '🔍 Search Rooms'}
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="mb-6">
                <RoomFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClear={handleClearFilters}
                />
            </div>

            {/* ── Results Header ── */}
            {hasSearched && !loading && (
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {totalResults} Available Room{totalResults !== 1 ? 's' : ''} Found
                    </h2>
                    {nights > 0 && totalResults > 0 && (
                        <p className="text-xs text-gray-400">
                            Prices shown per night · {nights}-night stay
                        </p>
                    )}
                </div>
            )}

            {/* ── Loading Skeletons ── */}
            {loading && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* ── No search yet ── */}
            {!loading && !hasSearched && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-24 text-center">
                    <span className="mb-4 text-6xl">🏨</span>
                    <p className="text-lg font-semibold text-gray-600">Ready to search</p>
                    <p className="mt-1 text-sm text-gray-400">
                        Select your dates and click <strong>Search Rooms</strong> to see live availability.
                    </p>
                </div>
            )}

            {/* ── No results ── */}
            {!loading && hasSearched && results.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
                    <span className="mb-4 text-5xl">🔍</span>
                    <p className="text-lg font-semibold text-gray-600">No rooms available</p>
                    <p className="mt-1 text-sm text-gray-400">
                        Try different dates, adjust the price range, or remove type filters.
                    </p>
                </div>
            )}

            {/* ── Room Cards Grid ── */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {results.map((room) => {
                        const amenities = room.roomType?.amenities
                            ? room.roomType.amenities.split(',').map((a) => a.trim()).filter(Boolean)
                            : [];
                        const totalCost = nights > 0 && room.roomType?.basePrice
                            ? (room.roomType.basePrice * nights).toFixed(2)
                            : null;

                        return (
                            <div
                                key={room.id}
                                className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                            >
                                {/* Image / icon */}
                                <div className="flex h-36 items-center justify-center rounded-t-xl bg-gradient-to-br from-blue-50 to-indigo-100">
                                    <span className="text-4xl">{typeIcon(room.roomType?.name)}</span>
                                </div>

                                <div className="flex flex-1 flex-col p-4">
                                    {/* Title & Status badge */}
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900">Room {room.roomNumber}</h3>
                                            <p className="text-xs text-gray-500">
                                                {room.floor ? `Floor ${room.floor} · ` : ''}{room.roomType?.name ?? '—'}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[room.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_LABELS[room.status] ?? room.status}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {room.roomType?.description && (
                                        <p className="mb-3 text-xs text-gray-500 line-clamp-2">
                                            {room.roomType.description}
                                        </p>
                                    )}

                                    {/* Amenity tags */}
                                    {amenities.length > 0 && (
                                        <div className="mb-3 flex flex-wrap gap-1">
                                            {amenities.slice(0, 3).map((a) => (
                                                <span key={a} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{a}</span>
                                            ))}
                                            {amenities.length > 3 && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                                                    +{amenities.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Price & capacity */}
                                    <div className="mt-auto flex items-end justify-between">
                                        <div>
                                            <span className="text-xl font-bold text-gray-900">
                                                ${room.roomType?.basePrice?.toFixed(2) ?? '—'}
                                            </span>
                                            <span className="text-xs text-gray-400"> / night</span>
                                            {totalCost && (
                                                <p className="text-xs text-blue-600 font-medium">
                                                    Total: ${totalCost}
                                                </p>
                                            )}
                                        </div>
                                        {room.roomType?.maxGuests && (
                                            <span className="text-xs text-gray-500">
                                                👥 up to {room.roomType.maxGuests}
                                            </span>
                                        )}
                                    </div>

                                    {/* Book Now */}
                                    <button
                                        onClick={() => handleBookNow(room)}
                                        className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
