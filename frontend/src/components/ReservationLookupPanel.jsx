import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Search, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReservationStatus } from '../domain/reservations/statusRules';
import { searchReservations } from '../services/reservationService';
import StatusPill from './StatusPill';
import { LtrText } from './LtrText';
import { extractApiErrorMessage } from '../utils/apiError';
import { cn } from '../lib/utils';
import {
  EMPTY_RESERVATION_LOOKUP_FILTERS,
  hasReservationLookupFilters,
  isLikelyConfirmationValue,
  normalizeReservationLookupFilters,
} from '../utils/reservationLookup';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateKnownValue,
} from '../utils/localization';

const STATUS_OPTIONS = Object.values(ReservationStatus);

const hasActiveFilters = (filters) =>
  hasReservationLookupFilters(filters);

const buildInitialFilters = (initialQuery = '', initialFilters = {}) => {
  const nextFilters = {
    ...EMPTY_RESERVATION_LOOKUP_FILTERS,
    ...normalizeReservationLookupFilters(initialFilters),
  };
  const trimmedQuery = String(initialQuery ?? '').trim();

  if (!trimmedQuery || hasActiveFilters(nextFilters)) {
    return nextFilters;
  }

  if (isLikelyConfirmationValue(trimmedQuery)) {
    nextFilters.confirmation = trimmedQuery;
  } else {
    nextFilters.guestName = trimmedQuery;
  }

  return nextFilters;
};

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
    guestPhone: isLegacy ? record?.guestPhone ?? record?.phone : record?.guest?.phone,
    guestIdNumber: isLegacy ? record?.guestIdNumber ?? record?.idNumber : record?.guest?.idNumber,
    guestNationality: isLegacy ? record?.guestNationality ?? record?.nationality : record?.guest?.nationality,
    maxGuests: isLegacy ? record?.maxGuests : record?.room?.maxGuests,
    amenities: isLegacy ? record?.amenities : record?.room?.amenities,
    totalPaid: record?.totalPaid,
    outstandingBalance: record?.outstandingBalance,
    paymentStatus: record?.paymentStatus,
    invoiceFinalized: record?.invoiceFinalized,
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
  initialFilters = EMPTY_RESERVATION_LOOKUP_FILTERS,
  autoSearch = true,
}) {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState(() => buildInitialFilters(initialQuery, initialFilters));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(
    async (nextFilters) => {
      const normalizedFilters = normalizeReservationLookupFilters(nextFilters);
      if (!hasActiveFilters(normalizedFilters)) {
        setResults([]);
        setSearched(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await searchReservations(normalizedFilters);
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(extractApiErrorMessage(err, t('errors.searchFailed')));
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    },
    [t]
  );

  useEffect(() => {
    const nextFilters = buildInitialFilters(initialQuery, initialFilters);
    setFilters(nextFilters);
    setResults([]);
    setSearched(false);
    setError(null);

    if (autoSearch && hasActiveFilters(nextFilters)) {
      void runSearch(nextFilters);
    }
  }, [autoSearch, initialFilters, initialQuery, runSearch]);

  const reservations = useMemo(
    () => results.map((record, index) => toUiReservation(record, index)),
    [results]
  );
  const hasMultipleMatches = reservations.length > 1;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runSearch(filters);
  };

  const resetFilters = () => {
    const nextFilters = buildInitialFilters('', {});
    setFilters(nextFilters);
    setResults([]);
    setSearched(false);
    setError(null);
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setError(null);
  };

  return (
    <section
      className={cn(
        'rounded-[1.75rem] border border-black/5 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]',
        className
      )}
    >
      <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-zinc-950">
                {t('reservationLookupPanel.title')}
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                {t('reservationLookupPanel.description')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              {t('reservationLookupPanel.chipConfirmation')}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              {t('reservationLookupPanel.chipFiltered')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {t('confirmationNumber')}
              </span>
              <input
                type="text"
                value={filters.confirmation}
                onChange={(event) => updateFilter('confirmation', event.target.value)}
                placeholder={t('reservationLookupPanel.confirmationPlaceholder')}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {t('guestName')}
              </span>
              <input
                type="text"
                value={filters.guestName}
                onChange={(event) => updateFilter('guestName', event.target.value)}
                placeholder={t('reservationLookupPanel.guestNamePlaceholder')}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {t('status')}
              </span>
              <select
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              >
                <option value="">{t('reservationLookupPanel.anyStatus')}</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {getReservationStatusLabel(status, t)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {t('checkInDate')}
              </span>
              <input
                type="date"
                value={filters.checkInDate}
                onChange={(event) => updateFilter('checkInDate', event.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {t('checkOutDate')}
              </span>
              <input
                type="date"
                value={filters.checkOutDate}
                onChange={(event) => updateFilter('checkOutDate', event.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || !hasActiveFilters(filters)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {loading ? t('common.searching') : t('common.searchReservation')}
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t('common.clearFilters')}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </div>
        )}

        {!loading && searched && reservations.length === 0 && (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
            <p className="text-sm font-bold text-zinc-950">{t('reservationLookupPanel.emptyTitle')}</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              {t('reservationLookupPanel.emptyDescription')}
            </p>
          </div>
        )}

        {!loading && reservations.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50">
            <div className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-5">
              <p className="text-sm font-bold text-zinc-950">
                {t('reservationLookupPanel.resultsTitle', { count: reservations.length })}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {hasMultipleMatches
                  ? t('reservationLookupPanel.multipleMatchesDescription')
                  : t('reservationLookupPanel.singleMatchDescription')}
              </p>
            </div>

            <div className="divide-y divide-zinc-200">
              {reservations.map((reservation) => (
                <div key={reservation._rowKey} className="bg-white/80 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-black tracking-tight text-zinc-950">
                            {reservation.guestName ?? t('common.guest')}
                          </p>
                          <p className="truncate text-sm font-medium text-zinc-500">
                            {reservation.guestEmail || t('common.noGuestEmailProvided')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                            {t('confirmationNumber')}
                          </p>
                          <p className="mt-2 text-sm font-bold text-zinc-950">
                            <LtrText>{reservation.confirmationNumber}</LtrText>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                            {t('common.room')}
                          </p>
                          <p className="mt-2 text-sm font-bold text-zinc-950">
                            {t('roomNum', { number: reservation.roomNumber ?? t('unassigned') })}
                          </p>
                          <p className="mt-1 text-xs font-medium text-zinc-500">
                            {translateKnownValue(reservation.roomTypeName, t) || t('unassigned')}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                            {t('modifyReservationPage.stayDates')}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
                            <CalendarDays className="h-4 w-4 text-zinc-400" />
                            {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            -{' '}
                            {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                            {t('checkInPage.reservationTotal')}
                          </p>
                          <p className="mt-2 text-sm font-bold text-zinc-950">
                            {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                          </p>
                          {reservation.outstandingBalance != null ? (
                            <p className="mt-1 text-xs font-medium text-zinc-500">
                              {t('checkoutPage.outstandingBalanceLabel')}: {' '}
                              {formatLocalizedCurrency(reservation.outstandingBalance, i18n.language)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <StatusPill status={reservation.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => onSelect?.(reservation)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
                      >
                        {t('common.selectReservation')}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
