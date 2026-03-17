import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Search, UserRound } from 'lucide-react';
import { searchReservations } from '../services/reservationService';
import StatusPill from './StatusPill';
import { LtrText } from './LtrText';
import { extractApiErrorMessage } from '../utils/apiError';
import { cn } from '../lib/utils';

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

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

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

  const handleSearch = useCallback(
    async (e, forcedQuery) => {
      e?.preventDefault?.();
      const nextQuery = (forcedQuery ?? query).trim();
      if (!nextQuery) return;

      setLoading(true);
      setError(null);
      setSearched(false);
      setSearchedByGuestName(!isConfirmationQuery(nextQuery));

      try {
        const data = await searchReservations(nextQuery);
        setResults(Array.isArray(data) ? data : []);
        setSearched(true);
      } catch (err) {
        setError(extractApiErrorMessage(err, 'Failed to search reservations. Please try again.'));
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    const trimmed = String(initialQuery ?? '').trim();
    if (!trimmed) return;
    setQuery(trimmed);

    if (autoSearch) {
      handleSearch(null, trimmed);
    }
  }, [initialQuery, autoSearch, handleSearch]);

  const reservation = useMemo(
    () => (results.length > 0 ? toUiReservation(results[0], 0) : null),
    [results]
  );

  return (
    <section className={cn('rounded-[1.75rem] border border-black/5 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]', className)}>
      <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Reservation Lookup</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                Search by confirmation number or guest name. Guest-name search returns the first matching reservation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Confirmation-first
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Staff lookup
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="lookup-query"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearched(false);
                setSearchedByGuestName(false);
                setError(null);
              }}
              placeholder="RSV-XXXXXXXXXXXX or guest name"
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {loading ? 'Searching...' : 'Search Reservation'}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </div>
        )}

        {!loading && searched && !reservation && (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
            <p className="text-sm font-bold text-zinc-950">No reservation found</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Try a confirmation number or a more specific guest name.
            </p>
          </div>
        )}

        {!loading && reservation && (
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50">
            {searchedByGuestName && (
              <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-900">
                Guest-name search returns the first matching reservation
              </div>
            )}

            <div className="px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-black tracking-tight text-zinc-950">
                          {reservation.guestName ?? 'Guest'}
                        </p>
                        <p className="truncate text-sm font-medium text-zinc-500">
                          {reservation.guestEmail || 'No guest email provided'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          Confirmation
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-950">
                          <LtrText>{reservation.confirmationNumber}</LtrText>
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          Room
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-950">
                          Room {reservation.roomNumber} | {reservation.roomTypeName}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          Stay Dates
                        </p>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
                          <CalendarDays className="h-4 w-4 text-zinc-400" />
                          {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          Reservation Total
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-950">
                          {money(reservation.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <StatusPill status={reservation.status} size="sm" />
                </div>

                <button
                  type="button"
                  onClick={() => onSelect?.(reservation)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  Select Reservation
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
