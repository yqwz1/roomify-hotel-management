import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, RotateCcw, Search, SlidersHorizontal, UserRound } from 'lucide-react';
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

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
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

const FILTER_GRID_CLASS =
  'grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]';

const FILTER_FIELD_CLASS =
  'flex min-w-0 flex-col gap-2 rounded-[1.35rem] border border-brand-surface-border bg-white p-3 shadow-sm';

const FILTER_LABEL_CLASS =
  'text-[11px] font-black uppercase tracking-[0.2em] text-brand-ink-muted';

const FILTER_INPUT_CLASS =
  'h-11 w-full rounded-xl border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

const RESULT_DETAIL_GRID_CLASS =
  'grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]';

const RESULT_DETAIL_CARD_CLASS =
  'min-w-0 rounded-2xl border border-brand-surface-border bg-white px-4 py-3 shadow-sm';

const RESULT_DETAIL_LABEL_CLASS =
  'text-[11px] font-black uppercase tracking-[0.08em] text-brand-ink-hint';

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
      <div className="border-b border-brand-surface-border px-5 py-5 sm:px-6">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex min-w-0 h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white break-words">
              <Search className="h-5 w-5 shrink-0" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-brand-ink break-words">
                {t('reservationLookupPanel.title')}
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted break-words">
                {t('reservationLookupPanel.description')}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap gap-2">
            <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-muted break-words">
              {t('reservationLookupPanel.chipConfirmation')}
            </span>
            <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-muted break-words">
              {t('reservationLookupPanel.chipFiltered')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={FILTER_GRID_CLASS}>
            <label className={FILTER_FIELD_CLASS}>
              <span className={FILTER_LABEL_CLASS}>
                {t('confirmationNumber')}
              </span>
              <input
                type="text"
                dir="ltr"
                value={filters.confirmation}
                onChange={(event) => updateFilter('confirmation', event.target.value)}
                placeholder={t('reservationLookupPanel.confirmationPlaceholder')}
                className={FILTER_INPUT_CLASS}
              />
            </label>

            <label className={FILTER_FIELD_CLASS}>
              <span className={FILTER_LABEL_CLASS}>
                {t('guestName')}
              </span>
              <input
                type="text"
                value={filters.guestName}
                onChange={(event) => updateFilter('guestName', event.target.value)}
                placeholder={t('reservationLookupPanel.guestNamePlaceholder')}
                className={FILTER_INPUT_CLASS}
              />
            </label>

            <label className={FILTER_FIELD_CLASS}>
              <span className={FILTER_LABEL_CLASS}>
                {t('status')}
              </span>
              <NativeSelect
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
                className={FILTER_INPUT_CLASS}
              >
                <option value="">{t('reservationLookupPanel.anyStatus')}</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {getReservationStatusLabel(status, t)}
                  </option>
                ))}
              </NativeSelect>
            </label>

            <label className={FILTER_FIELD_CLASS}>
              <span className={FILTER_LABEL_CLASS}>
                {t('checkInDate')}
              </span>
              <input
                type="date"
                value={filters.checkInDate}
                onChange={(event) => updateFilter('checkInDate', event.target.value)}
                className={FILTER_INPUT_CLASS}
              />
            </label>

            <label className={FILTER_FIELD_CLASS}>
              <span className={FILTER_LABEL_CLASS}>
                {t('checkOutDate')}
              </span>
              <input
                type="date"
                value={filters.checkOutDate}
                onChange={(event) => updateFilter('checkOutDate', event.target.value)}
                className={FILTER_INPUT_CLASS}
              />
            </label>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
            <Button variant="unstyled" size="none"
              type="submit"
              disabled={loading || !hasActiveFilters(filters)}
              className="inline-flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-brand-primary px-6 text-sm font-extrabold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-primary-deep hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted disabled:shadow-none"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              {loading ? t('common.searching') : t('common.searchReservation')}
            </Button>

            <Button variant="unstyled" size="none"
              type="button"
              onClick={resetFilters}
              disabled={isAtDefaultState}
              className="inline-flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-2xl border border-brand-surface-border bg-white px-5 text-sm font-bold text-brand-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/40 hover:bg-brand-surface-light hover:shadow disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-brand-surface-border disabled:bg-brand-primary-tint disabled:text-brand-ink-hint disabled:shadow-none"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              {t('common.clearFilters')}
            </Button>
          </div>

          <div className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4">
            {activeFilterChips.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-brand-surface-border bg-white px-3 py-1.5 text-xs font-bold text-brand-ink break-words"
                  >
                    <span className="text-brand-ink-muted break-words">{chip.label}:</span>
                    {chip.ltr ? (
                      <LtrText className="text-brand-ink">{chip.value}</LtrText>
                    ) : (
                      <span className="min-w-0 break-words [overflow-wrap:anywhere] text-brand-ink">
                        {chip.value}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-brand-ink-muted break-words">
                {translateWithFallback(
                  t,
                  'reservationLookupPanel.emptyFiltersNote',
                  'Add a confirmation number, guest name, status, or stay date to search the live reservation list.'
                )}
              </p>
            )}

            <p className="mt-3 text-sm font-medium leading-6 text-brand-ink-muted break-words">
              {hasConfirmationPrecedence
                ? translateWithFallback(
                    t,
                    'reservationLookupPanel.confirmationPrecedenceDescription',
                    'Confirmation number takes precedence. Guest name, status, and stay dates remain visible, but the results list is resolved by confirmation first.'
                  )
                : translateWithFallback(
                    t,
                    'reservationLookupPanel.backendDrivenDescription',
                    'Reservation lookup stays aligned with the current filters exactly as shown.'
                  )}
            </p>
          </div>
        </form>

        {loading && (
          <div className="mt-4 rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light px-6 py-8 text-center">
            <p className="text-sm font-bold text-brand-ink break-words">
              {translateWithFallback(t, 'reservationLookupPanel.loadingTitle', 'Searching reservations')}
            </p>
            <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
              {translateWithFallback(
                t,
                'reservationLookupPanel.loadingDescription',
                'Live reservations are being filtered using the current lookup criteria.'
              )}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        )}

        {!loading && searched && reservations.length === 0 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-10 text-center">
              <p className="text-sm font-bold text-brand-ink break-words">{t('reservationLookupPanel.emptyTitle')}</p>
              <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
                {t('reservationLookupPanel.emptyDescription')}
              </p>
            </div>
            {!isAtDefaultState ? (
              <Button variant="unstyled" size="none"
                type="button"
                onClick={resetFilters}
                className="inline-flex min-w-0 h-12 items-center justify-center rounded-full border border-brand-surface-border bg-white px-5 text-sm font-bold text-brand-ink transition hover:border-brand-surface-border hover:bg-brand-surface-light"
              >
                {t('common.clearFilters')}
              </Button>
            ) : null}
          </div>
        )}

        {!loading && reservations.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light">
            <div className="border-b border-brand-surface-border bg-white px-4 py-3 sm:px-5">
              <p className="text-sm font-bold text-brand-ink break-words">
                {t('reservationLookupPanel.resultsTitle', { count: reservations.length })}
              </p>
              <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                {hasMultipleMatches
                  ? t('reservationLookupPanel.multipleMatchesDescription')
                  : t('reservationLookupPanel.singleMatchDescription')}
              </p>
            </div>

            <div className="divide-y divide-brand-surface-border">
              {reservations.map((reservation) => (
                <div key={reservation._rowKey} className="bg-white/80 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex min-w-0 h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-brand-ink shadow-sm break-words">
                          <UserRound className="h-4 w-4 shrink-0" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-base font-black tracking-tight text-brand-ink [overflow-wrap:anywhere] break-words">
                            {reservation.guestName ?? t('common.guest')}
                          </p>
                          <LtrText className="mt-1 text-sm font-medium text-brand-ink-muted">
                            {reservation.guestEmail || t('common.noGuestEmailProvided')}
                          </LtrText>
                        </div>
                      </div>
                      <StatusPill status={reservation.status} size="sm" />
                    </div>

                    <div className={RESULT_DETAIL_GRID_CLASS}>
                      <div className={RESULT_DETAIL_CARD_CLASS}>
                        <p className={RESULT_DETAIL_LABEL_CLASS}>
                          {t('confirmationNumber')}
                        </p>
                        <LtrText className="mt-2 text-sm font-bold text-brand-ink">
                          {reservation.confirmationNumber}
                        </LtrText>
                      </div>

                      <div className={RESULT_DETAIL_CARD_CLASS}>
                        <p className={RESULT_DETAIL_LABEL_CLASS}>
                          {t('common.room')}
                        </p>
                        <LtrText className="mt-2 text-sm font-bold text-brand-ink">
                          {reservation.roomNumber ?? t('unassigned')}
                        </LtrText>
                        <p className="mt-1 text-xs font-medium text-brand-ink-muted [overflow-wrap:anywhere] break-words">
                          {translateKnownValue(reservation.roomTypeName, t) || t('unassigned')}
                        </p>
                      </div>

                      <div className={RESULT_DETAIL_CARD_CLASS}>
                        <p className={RESULT_DETAIL_LABEL_CLASS}>
                          {t('modifyReservationPage.stayDates')}
                        </p>
                        <div className="mt-2 space-y-2">
                          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="inline-flex min-w-0 min-w-max items-center gap-2 text-xs font-medium text-brand-ink-muted break-words">
                              <CalendarDays className="h-4 w-4 text-brand-ink-hint shrink-0" />
                              {t('checkInDate')}
                            </span>
                            <span className="min-w-max whitespace-nowrap text-sm font-bold text-brand-ink">
                              {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="min-w-max text-xs font-medium text-brand-ink-muted break-words">{t('checkOutDate')}</span>
                            <span className="min-w-max whitespace-nowrap text-sm font-bold text-brand-ink">
                              {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={RESULT_DETAIL_CARD_CLASS}>
                        <p className={RESULT_DETAIL_LABEL_CLASS}>
                          {t('checkInPage.reservationTotal')}
                        </p>
                        <LtrText className="mt-2 text-sm font-bold text-brand-ink">
                          {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                        </LtrText>
                        {reservation.outstandingBalance != null ? (
                          <div className="mt-1 text-xs font-medium text-brand-ink-muted">
                            <p>{t('checkoutPage.outstandingBalanceLabel')}</p>
                            <LtrText className="mt-0.5 whitespace-nowrap text-brand-ink">
                              {formatLocalizedCurrency(reservation.outstandingBalance, i18n.language)}
                            </LtrText>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3 border-t border-brand-surface-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-brand-ink-muted break-words">
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
                      <Button variant="unstyled" size="none"
                        type="button"
                        onClick={() => onSelect?.(reservation)}
                        className="inline-flex min-w-0 h-11 w-full items-center justify-center gap-2 rounded-full border border-brand-surface-border bg-white px-5 text-sm font-bold text-brand-ink transition hover:border-brand-primary hover:bg-brand-surface-light sm:w-auto"
                      >
                        {t('common.selectReservation')}
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </Button>
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
