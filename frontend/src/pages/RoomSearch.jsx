import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import DateRangePicker from '../components/DateRangePicker';
import RoomFilters from '../components/RoomFilters';
import ErrorBanner from '../components/ErrorBanner';
import { useTranslation } from 'react-i18next';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FILTERS = { status: '', type: '', floor: '', minPrice: '', maxPrice: '' };

const STATUS_COLORS = {
    AVAILABLE: 'border border-zinc-300 bg-white text-black',
    OCCUPIED: 'bg-black text-white',
    NEEDS_CLEANING: 'bg-zinc-200 text-black',
    UNDER_MAINTENANCE: 'bg-zinc-100 text-zinc-600',
};

const STATUS_LABELS = {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    NEEDS_CLEANING: 'needsCleaning',
    UNDER_MAINTENANCE: 'underMaintenance',
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
    { labelKey: 'sortPriceAsc', defaultLabel: 'Price: Low → High', sortBy: 'PRICE', sortDirection: 'ASC' },
    { labelKey: 'sortPriceDesc', defaultLabel: 'Price: High → Low', sortBy: 'PRICE', sortDirection: 'DESC' },
    { labelKey: 'sortTypeAsc', defaultLabel: 'Type A → Z', sortBy: 'ROOM_TYPE', sortDirection: 'ASC' },
    { labelKey: 'sortTypeDesc', defaultLabel: 'Type Z → A', sortBy: 'ROOM_TYPE', sortDirection: 'DESC' },
];

// ─── Skeleton card for loading state ─────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm animate-pulse">
            <div className="h-40 rounded-t-3xl bg-zinc-100" />
            <div className="flex flex-col gap-4 p-6">
                <div className="h-5 w-2/3 rounded-full bg-zinc-200" />
                <div className="h-4 w-1/2 rounded-full bg-zinc-100" />
                <div className="h-12 w-full rounded-full bg-zinc-200 mt-auto" />
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
    const { t } = useTranslation();

    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

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
        <div className="h-full bg-zinc-50 p-6 lg:p-8">

            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-black tracking-tight">{t('roomSearchTitle') || 'Room Search'}</h1>
                <p className="mt-2 text-sm font-medium text-zinc-500">
                    {t('roomSearchDesc') || 'Find available rooms for your guests — live availability from the database.'}
                </p>
            </div>

            {/* ── Error Banner ── */}
            <div className="mb-4">
                <ErrorBanner message={error} onClose={clearError} />
            </div>

            {/* ── Date Picker + Sort + Search Button ── */}
            <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-zinc-500 uppercase tracking-widest">{t('selectStayDates') || 'Select Stay Dates'}</h2>

                <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onCheckInChange={setCheckIn}
                    onCheckOutChange={setCheckOut}
                />

                {nights > 0 && (
                    <p className="mt-3 text-sm text-black font-bold">
                        📆 {t('nightsSelected', { count: nights }) || `${nights} night(s) selected`}
                    </p>
                )}

                {/* Sort selector + Search button */}
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <label htmlFor="sort-select" className="text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                            {t('sortBy') || 'Sort by:'}
                        </label>
                        <select
                            id="sort-select"
                            value={SORT_OPTIONS.indexOf(sortOption)}
                            onChange={(e) => setSortOption(SORT_OPTIONS[Number(e.target.value)])}
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-bold text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                        >
                            {SORT_OPTIONS.map((opt, i) => (
                                <option key={opt.labelKey} value={i}>{t(opt.labelKey) || opt.defaultLabel}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading || !checkIn || !checkOut || checkOut <= checkIn}
                        className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-zinc-400 w-full sm:w-auto"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                {t('searching') || 'Searching…'}
                            </span>
                        ) : (t('searchRoomsButton') || '🔍 Search Rooms')}
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
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-black">
                        {t('roomsFound', { count: totalResults }) || `${totalResults} Available Room(s) Found`}
                    </h2>
                    {nights > 0 && totalResults > 0 && (
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            {t('pricesShownPerNight', { count: nights }) || `Prices shown per night · ${nights}-night stay`}
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
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-300 bg-transparent py-24 text-center">
                    <span className="mb-6 text-6xl">🏨</span>
                    <p className="text-xl font-bold text-black">{t('readyToSearch') || 'Ready to search'}</p>
                    <p className="mt-2 text-sm font-medium text-zinc-500">
                        {t('searchInstructions') || 'Select your dates and click Search Rooms to see live availability.'}
                    </p>
                </div>
            )}

            {/* ── No results ── */}
            {!loading && hasSearched && results.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-300 bg-transparent py-20 text-center">
                    <span className="mb-6 text-5xl">🔍</span>
                    <p className="text-xl font-bold text-black">{t('noRoomsAvailable') || 'No rooms available'}</p>
                    <p className="mt-2 text-sm font-medium text-zinc-500">
                        {t('tryDifferentDates') || 'Try different dates, adjust the price range, or remove type filters.'}
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
                                className="flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                            >
                                {/* Image / icon */}
                                <div className="flex h-40 items-center justify-center rounded-t-3xl bg-zinc-100">
                                    <span className="text-5xl drop-shadow-sm">{typeIcon(room.roomType?.name)}</span>
                                </div>

                                <div className="flex flex-1 flex-col p-6 sm:p-8">
                                    {/* Title & Status badge */}
                                    <div className="mb-4 flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-black">{t('roomNum', { number: room.roomNumber }) || `Room ${room.roomNumber}`}</h3>
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mt-1">
                                                {room.floor ? `${t('floorNum', { floor: room.floor }) || `Floor ${room.floor}`} · ` : ''}{room.roomType?.name ?? '—'}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[room.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                                            {t(STATUS_LABELS[room.status]) || room.status}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {room.roomType?.description && (
                                        <p className="mb-5 text-sm font-medium text-zinc-500 line-clamp-2">
                                            {room.roomType.description}
                                        </p>
                                    )}

                                    {/* Amenity tags */}
                                    {amenities.length > 0 && (
                                        <div className="mb-5 flex flex-wrap gap-2">
                                            {amenities.slice(0, 3).map((a) => (
                                                <span key={a} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-black">{a}</span>
                                            ))}
                                            {amenities.length > 3 && (
                                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-500">
                                                    +{amenities.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Price & capacity */}
                                    <div className="mt-auto flex items-end justify-between border-t border-zinc-100 pt-5">
                                        <div>
                                            <span className="text-3xl font-extrabold text-black">
                                                ${room.roomType?.basePrice?.toFixed(2) ?? '—'}
                                            </span>
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">/ {t('perNight') || 'night'}</span>
                                            {totalCost && (
                                                <p className="text-xs font-bold text-black mt-1">
                                                    {t('totalCost') || 'Total:'} ${totalCost}
                                                </p>
                                            )}
                                        </div>
                                        {room.roomType?.maxGuests && (
                                            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-black">
                                                👥 {t('upToGuests', { count: room.roomType.maxGuests }) || `up to ${room.roomType.maxGuests}`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Book Now */}
                                    <button
                                        onClick={() => handleBookNow(room)}
                                        className="mt-6 w-full rounded-full bg-black py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
                                    >
                                        {t('bookNow') || 'Book Now'}
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
