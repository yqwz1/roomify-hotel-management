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
  translateWithFallback,
  translateKnownValue,
} from '../utils/localization';

const STATUS_OPTIONS = Object.values(ReservationStatus);

const hasActiveFilters = (filters) =>
  hasReservationLookupFilters(filters);

const areLookupFiltersEqual = (left = {}, right = {}) =>
  ['confirmation', 'guestName', 'status', 'checkInDate', 'checkOutDate'].every(
    (key) => normalizeReservationLookupFilters(left)[key] === normalizeReservationLookupFilters(right)[key]
  );

const buildActiveFilterChips = (filters, t, language) => {
  const normalized = normalizeReservationLookupFilters(filters);
  const chips = [];

  if (normalized.confirmation) {
    chips.push({
      key: 'confirmation',
      label: t('confirmationNumber'),
      value: normalized.confirmation,
      ltr: true,
    });
  }

  if (normalized.guestName) {
    chips.push({
      key: 'guestName',
      label: t('guestName'),
      value: normalized.guestName,
      ltr: false,
    });
  }

  if (normalized.status) {
    chips.push({
      key: 'status',
      label: t('status'),
      value: getReservationStatusLabel(normalized.status, t),
      ltr: false,
    });
  }

  if (normalized.checkInDate) {
    chips.push({
      key: 'checkInDate',
      label: t('checkInDate'),
      value: formatLocalizedDate(normalized.checkInDate, language, { dateStyle: 'medium' }),
      ltr: false,
    });
  }

  if (normalized.checkOutDate) {
    chips.push({
      key: 'checkOutDate',
      label: t('checkOutDate'),
      value: formatLocalizedDate(normalized.checkOutDate, language, { dateStyle: 'medium' }),
      ltr: false,
    });
  }

  return chips;
};

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
  const defaultFilters = useMemo(
    () => buildInitialFilters(initialQuery, initialFilters),
    [initialFilters, initialQuery]
  );
  const [filters, setFilters] = useState(defaultFilters);
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
    setFilters(defaultFilters);
    setResults([]);
    setSearched(false);
    setError(null);

    if (autoSearch && hasActiveFilters(defaultFilters)) {
      void runSearch(defaultFilters);
    }
  }, [autoSearch, defaultFilters, runSearch]);

  const reservations = useMemo(
    () => results.map((record, index) => toUiReservation(record, index)),
    [results]
  );
  const hasMultipleMatches = reservations.length > 1;
  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(filters, t, i18n.language),
    [filters, i18n.language, t]
  );
  const hasConfirmationPrecedence =
    Boolean(filters.confirmation) &&
    ['guestName', 'status', 'checkInDate', 'checkOutDate'].some((key) =>
      Boolean(normalizeReservationLookupFilters(filters)[key])
    );
  const isAtDefaultState = areLookupFiltersEqual(filters, defaultFilters);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runSearch(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setResults([]);
    setSearched(false);
    setError(null);

    if (autoSearch && hasActiveFilters(defaultFilters)) {
      void runSearch(defaultFilters);
    }
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
          <div className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(5,minmax(0,1fr))]">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {t('confirmationNumber')}
              </span>
              <input
                type="text"
                dir="ltr"
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
              disabled={isAtDefaultState}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t('common.clearFilters')}
            </button>
          </div>

          <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
            {activeFilterChips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700"
                  >
                    <span className="text-zinc-500">{chip.label}:</span>
                    {chip.ltr ? (
                      <LtrText className="text-zinc-950">{chip.value}</LtrText>
                    ) : (
                      <span className="min-w-0 break-words [overflow-wrap:anywhere] text-zinc-950">
                        {chip.value}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-zinc-500">
                {translateWithFallback(
                  t,
                  'reservationLookupPanel.emptyFiltersNote',
                  'Add a confirmation number, guest name, status, or stay date to search the live reservation list.'
                )}
              </p>
            )}

            <p className="mt-3 text-sm font-medium leading-6 text-zinc-600">
              {hasConfirmationPrecedence
                ? 'Confirmation number takes precedence. Guest name, status, and stay dates remain visible, but the backend resolves the selection list by confirmation first.'
                : 'Reservation lookup stays backend-driven. Search uses the current filters exactly as shown.'}
            </p>
          </div>
        </form>

        {loading && (
          <div className="mt-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
            <p className="text-sm font-bold text-zinc-950">
              {translateWithFallback(t, 'reservationLookupPanel.loadingTitle', 'Searching reservations')}
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              {translateWithFallback(
                t,
                'reservationLookupPanel.loadingDescription',
                'The backend is filtering live reservations for the current lookup criteria.'
              )}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </div>
        )}

        {!loading && searched && reservations.length === 0 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
              <p className="text-sm font-bold text-zinc-950">{t('reservationLookupPanel.emptyTitle')}</p>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {t('reservationLookupPanel.emptyDescription')}
              </p>
            </div>
            {!isAtDefaultState ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                {t('common.clearFilters')}
              </button>
            ) : null}
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
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-base font-black tracking-tight text-zinc-950 [overflow-wrap:anywhere]">
                            {reservation.guestName ?? t('common.guest')}
                          </p>
                          <LtrText className="mt-1 text-sm font-medium text-zinc-500">
                            {reservation.guestEmail || t('common.noGuestEmailProvided')}
                          </LtrText>
                        </div>
                      </div>
                      <StatusPill status={reservation.status} size="sm" />
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[repeat(2,minmax(0,1fr))] 2xl:grid-cols-[repeat(4,minmax(0,1fr))]">
                      <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          {t('confirmationNumber')}
                        </p>
                        <LtrText className="mt-2 text-sm font-bold text-zinc-950">
                          {reservation.confirmationNumber}
                        </LtrText>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          {t('common.room')}
                        </p>
                        <LtrText className="mt-2 text-sm font-bold text-zinc-950">
                          {reservation.roomNumber ?? t('unassigned')}
                        </LtrText>
                        <p className="mt-1 text-xs font-medium text-zinc-500 [overflow-wrap:anywhere]">
                          {translateKnownValue(reservation.roomTypeName, t) || t('unassigned')}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          {t('modifyReservationPage.stayDates')}
                        </p>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500">
                              <CalendarDays className="h-4 w-4 text-zinc-400" />
                              {t('checkInDate')}
                            </span>
                            <span className="min-w-0 text-right text-sm font-bold text-zinc-950 [overflow-wrap:anywhere]">
                              {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-medium text-zinc-500">{t('checkOutDate')}</span>
                            <span className="min-w-0 text-right text-sm font-bold text-zinc-950 [overflow-wrap:anywhere]">
                              {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          {t('checkInPage.reservationTotal')}
                        </p>
                        <LtrText className="mt-2 text-sm font-bold text-zinc-950">
                          {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                        </LtrText>
                        {reservation.outstandingBalance != null ? (
                          <p className="mt-1 text-xs font-medium text-zinc-500">
                            {t('checkoutPage.outstandingBalanceLabel')}:{' '}
                            <LtrText className="text-zinc-950">
                              {formatLocalizedCurrency(reservation.outstandingBalance, i18n.language)}
                            </LtrText>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-zinc-500">
                        {hasMultipleMatches
                          ? translateWithFallback(
                              t,
                              'reservationLookupPanel.multipleMatchesHint',
                              'Select the exact stay before continuing with a reservation action.'
                            )
                          : translateWithFallback(
                              t,
                              'reservationLookupPanel.singleMatchHint',
                              'This stay is ready to hand off into the reservation workflow.'
                            )}
                      </p>
                      <button
                        type="button"
                        onClick={() => onSelect?.(reservation)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-sm font-bold text-zinc-950 transition hover:border-zinc-950 hover:bg-zinc-50 sm:w-auto"
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
