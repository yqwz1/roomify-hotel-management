import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  CalendarRange,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearch } from '../hooks/useSearch';
import DateRangePicker from '../components/DateRangePicker';
import RoomFilters from '../components/RoomFilters';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';

const EMPTY_FILTERS = { type: '', guestCapacity: '', minPrice: '', maxPrice: '' };

const SORT_OPTIONS = [
  { label: 'Price: Low to High', sortBy: 'PRICE', sortDirection: 'ASC' },
  { label: 'Price: High to Low', sortBy: 'PRICE', sortDirection: 'DESC' },
  { label: 'Type: A to Z', sortBy: 'ROOM_TYPE', sortDirection: 'ASC' },
  { label: 'Type: Z to A', sortBy: 'ROOM_TYPE', sortDirection: 'DESC' },
];

const STATUS_STYLES = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  OCCUPIED: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  NEEDS_CLEANING: 'border-amber-200 bg-amber-50 text-amber-900',
  UNDER_MAINTENANCE: 'border-rose-200 bg-rose-50 text-rose-900',
};

const tOr = (t, key, fallback, options) => {
  const value = t(key, options);
  return value === key ? fallback : value;
};

const formatMoney = (value) => `$${Number(value ?? 0).toFixed(2)}`;

function SearchSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] animate-pulse">
      <div className="h-40 bg-zinc-100" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-1/2 rounded-full bg-zinc-200" />
        <div className="h-4 w-2/3 rounded-full bg-zinc-100" />
        <div className="h-4 w-1/3 rounded-full bg-zinc-100" />
        <div className="h-12 rounded-full bg-zinc-200" />
      </div>
    </div>
  );
}

export default function RoomSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const recoveredCheckIn = String(location.state?.checkIn ?? '').trim();
  const recoveredCheckOut = String(location.state?.checkOut ?? '').trim();
  const hasRecoveredDates = Boolean(
    recoveredCheckIn &&
      recoveredCheckOut &&
      recoveredCheckOut > recoveredCheckIn
  );

  const [checkIn, setCheckIn] = useState(() =>
    hasRecoveredDates ? recoveredCheckIn : today
  );
  const [checkOut, setCheckOut] = useState(() =>
    hasRecoveredDates ? recoveredCheckOut : tomorrow
  );
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortOptionIndex, setSortOptionIndex] = useState(0);

  const { results, totalResults, loading, error, hasSearched, search, clearError } =
    useSearch();

  const sortOption = SORT_OPTIONS[sortOptionIndex];

  useEffect(() => {
    if (!hasRecoveredDates) return;

    search({
      checkIn: recoveredCheckIn,
      checkOut: recoveredCheckOut,
      sortBy: SORT_OPTIONS[0].sortBy,
      sortDirection: SORT_OPTIONS[0].sortDirection,
    });
  }, [hasRecoveredDates, recoveredCheckIn, recoveredCheckOut, search]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  }, [checkIn, checkOut]);

  const startingPrice = useMemo(() => {
    if (!results.length) return null;
    return results.reduce((lowest, room) => {
      const price = Number(room.roomType?.basePrice ?? 0);
      return lowest === null || price < lowest ? price : lowest;
    }, null);
  }, [results]);

  const roomTypeOptions = useMemo(() => {
    return [...new Set(results.map((room) => room.roomType?.name).filter(Boolean))].map(
      (name) => ({ value: name, label: name })
    );
  }, [results]);

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;

    search({
      checkIn,
      checkOut,
      roomType: filters.type || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      guestCapacity: filters.guestCapacity ? Number(filters.guestCapacity) : undefined,
      sortBy: sortOption.sortBy,
      sortDirection: sortOption.sortDirection,
    });
  };

  const handleBookNow = (room) => {
    navigate(`/book?roomId=${room.id}`, {
      state: { checkIn, checkOut, room },
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Front Desk Search"
        title={tOr(t, 'roomSearchTitle', 'Room Search')}
        description={tOr(
          t,
          'roomSearchDesc',
          'Search live room availability by date, guest capacity, room type, and price range.'
        )}
        meta={[
          `${nights || 0} night${nights === 1 ? '' : 's'}`,
          hasSearched ? `${totalResults} results` : 'Awaiting search',
          hasRecoveredDates ? 'Recovered booking context' : 'Manual search',
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Search Snapshot
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Dates
              </p>
              <p className="mt-2 text-lg font-black">{checkIn} to {checkOut}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Starting Rate
              </p>
              <p className="mt-2 text-lg font-black">
                {startingPrice == null ? 'Not loaded' : formatMoney(startingPrice)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <DashboardPanel
            title="Search Controls"
            description="Set the stay window, choose a sort rule, and request live availability from the backend."
          >
            <div className="space-y-5">
              {error && (
                <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  <div className="flex items-start justify-between gap-3">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-xs font-bold uppercase tracking-[0.18em] text-rose-800"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />

              <div className="space-y-2">
                <label
                  htmlFor="room-search-sort"
                  className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400"
                >
                  Sort Results
                </label>
                <select
                  id="room-search-sort"
                  value={sortOptionIndex}
                  onChange={(event) => setSortOptionIndex(Number(event.target.value))}
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  {SORT_OPTIONS.map((option, index) => (
                    <option key={`${option.sortBy}-${option.sortDirection}`} value={index}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={loading || !checkIn || !checkOut || checkOut <= checkIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Searching Rooms...' : 'Search Rooms'}
              </button>
            </div>
          </DashboardPanel>

          <RoomFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
            roomTypeOptions={roomTypeOptions}
            showStatus={false}
            showFloor={false}
            showGuestCapacity={true}
          />
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title="Search Results"
            description={
              hasSearched
                ? `${totalResults} room${totalResults === 1 ? '' : 's'} matched the current search.`
                : 'Run a room search to see live availability.'
            }
            action={
              hasSearched && results.length > 0 ? (
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  {nights} night{nights === 1 ? '' : 's'} stay
                </span>
              ) : null
            }
          >
            {!hasSearched && !loading && (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
                <CalendarRange className="mx-auto h-10 w-10 text-zinc-400" />
                <p className="mt-4 text-lg font-black text-zinc-950">Ready to search</p>
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  Choose the date range and filters, then request live room availability.
                </p>
              </div>
            )}

            {loading && (
              <div className="grid gap-5 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <SearchSkeletonCard key={index} />
                ))}
              </div>
            )}

            {!loading && hasSearched && results.length === 0 && !error && (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
                <SlidersHorizontal className="mx-auto h-10 w-10 text-zinc-400" />
                <p className="mt-4 text-lg font-black text-zinc-950">No rooms available</p>
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  Try different dates, expand the price range, or remove a room type filter.
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2">
                {results.map((room) => {
                  const basePrice = Number(room.roomType?.basePrice ?? 0);
                  const totalCost = nights > 0 ? basePrice * nights : basePrice;
                  const amenities = room.roomType?.amenities
                    ? room.roomType.amenities
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <article
                      key={room.id}
                      className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-28px_rgba(15,23,42,0.24)]"
                    >
                      <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#f5f5f4_0%,#fafaf9_45%,#ede9e1_100%)]">
                        <span className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-zinc-950 shadow-sm">
                          <BedDouble className="h-7 w-7" />
                        </span>
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xl font-black tracking-tight text-zinc-950">
                              Room {room.roomNumber}
                            </p>
                            <p className="mt-1 text-sm font-medium text-zinc-500">
                              {room.roomType?.name || 'Room type unavailable'}
                              {room.floor ? ` | Floor ${room.floor}` : ''}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                              STATUS_STYLES[room.status] ||
                              'border-zinc-200 bg-zinc-50 text-zinc-500'
                            }`}
                          >
                            {room.status || 'UNKNOWN'}
                          </span>
                        </div>

                        {room.roomType?.description && (
                          <p className="text-sm font-medium leading-6 text-zinc-500">
                            {room.roomType.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600"
                            >
                              {amenity}
                            </span>
                          ))}
                          {amenities.length > 3 && (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600">
                              +{amenities.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                              Rate
                            </p>
                            <p className="mt-2 text-sm font-bold text-zinc-950">
                              {formatMoney(basePrice)} / night
                            </p>
                          </div>
                          <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                              Capacity
                            </p>
                            <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
                              <Users className="h-4 w-4 text-zinc-400" />
                              Up to {room.roomType?.maxGuests ?? '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                              Stay total
                            </p>
                            <p className="mt-1 text-lg font-black text-zinc-950">
                              {formatMoney(totalCost)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleBookNow(room)}
                            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                          >
                            Book Room
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
