import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardCheck,
  DoorClosedLocked,
  Receipt,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { ReservationDetailLoader } from '../components/reservations/ReservationDetailContent';
import { useReservationQueue } from '../hooks/useReservationQueue';
import { useAuth } from '../context/AuthProvider';
import { ReservationStatus } from '../domain/reservations/statusRules';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateKnownValue,
  translateWithFallback,
} from '../utils/localization';
import { buildReservationLookupNavigationState } from '../utils/reservationLookup';
import {
  RESERVATION_WORKSPACE_SELECTED_PARAM,
  areReservationWorkspaceFiltersEqual,
  buildReservationWorkspaceFilterChips,
  buildReservationWorkspaceSearchParams,
  buildReservationWorkspaceQueueContext,
  buildReservationWorkspaceTabDefaults,
  countReservationWorkspaceFilters,
  createReservationWorkspaceFiltersFromSearchParams,
  formatDateInputValue,
  getReservationWorkspaceActionLabel,
  normalizeReservationWorkspaceFilters,
  normalizeWorkspaceValue,
} from '../utils/reservationWorkspace';

const useDesktopWorkspace = () => {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia('(min-width: 1280px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const handleChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return isDesktop;
};

const FILTER_GRID_CLASS =
  'grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]';

const FILTER_FIELD_CLASS =
  'flex min-w-0 flex-col gap-2 rounded-[1.35rem] border border-zinc-200 bg-white p-3 shadow-sm';

const FILTER_LABEL_CLASS =
  'text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500';

const FILTER_INPUT_CLASS =
  'h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

export default function ReservationsWorkspace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isDesktop = useDesktopWorkspace();
  const today = useMemo(() => formatDateInputValue(new Date()), []);
  const pageTx = 'staffDashboardPage';
  const displayName = user?.username || t('roleStaff');

  const activeFilters = useMemo(
    () => createReservationWorkspaceFiltersFromSearchParams(searchParams, today),
    [searchParams, today]
  );
  const [draftFilters, setDraftFilters] = useState(activeFilters);
  const selectedConfirmation = normalizeWorkspaceValue(
    searchParams.get(RESERVATION_WORKSPACE_SELECTED_PARAM)
  );

  useEffect(() => {
    setDraftFilters(activeFilters);
  }, [activeFilters]);

  const { reservations, loading, error, metrics, reload } = useReservationQueue(activeFilters);

  useEffect(() => {
    if (!selectedConfirmation) {
      return;
    }

    const selectedStillVisible = reservations.some(
      (reservation) => reservation.confirmationNumber === selectedConfirmation
    );

    if (!selectedStillVisible) {
      setSearchParams(buildReservationWorkspaceSearchParams(activeFilters));
    }
  }, [activeFilters, reservations, selectedConfirmation, setSearchParams]);

  const queueTabs = useMemo(
    () => [
      { id: 'arrivals', label: t(`${pageTx}.tabs.arrivals`) },
      { id: 'inHouse', label: t(`${pageTx}.tabs.inHouse`) },
      { id: 'departures', label: t(`${pageTx}.tabs.departures`) },
      { id: 'all', label: t(`${pageTx}.tabs.all`) },
    ],
    [t]
  );

  const activeTab = queueTabs.find((tab) => tab.id === activeFilters.queueTab) ?? queueTabs[0];
  const defaultFilters = useMemo(
    () => buildReservationWorkspaceTabDefaults(activeFilters.queueTab || 'arrivals', today),
    [activeFilters.queueTab, today]
  );
  const visibleFilterChips = useMemo(
    () => buildReservationWorkspaceFilterChips(draftFilters, t, i18n.language),
    [draftFilters, i18n.language, t]
  );
  const hasPendingFilterChanges = !areReservationWorkspaceFiltersEqual(
    activeFilters,
    draftFilters
  );
  const hasConfirmationPrecedence =
    Boolean(draftFilters.confirmation) &&
    ['guestName', 'status', 'checkInDate', 'checkOutDate'].some((key) =>
      Boolean(normalizeWorkspaceValue(draftFilters[key]))
    );
  const isAtQueueDefault =
    areReservationWorkspaceFiltersEqual(activeFilters, defaultFilters) &&
    areReservationWorkspaceFiltersEqual(draftFilters, defaultFilters);

  const applyFilters = (nextFilters, nextSelected = '') => {
    setSearchParams(buildReservationWorkspaceSearchParams(nextFilters, nextSelected));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applyFilters(
      {
        ...activeFilters,
        ...draftFilters,
      },
      selectedConfirmation
    );
  };

  const handleTabChange = (tabId) => {
    const defaults = buildReservationWorkspaceTabDefaults(tabId, today);
    applyFilters(
      {
        ...defaults,
        confirmation: activeFilters.confirmation,
        guestName: activeFilters.guestName,
      },
      ''
    );
  };

  const handleReset = () => {
    const resetFilters = buildReservationWorkspaceTabDefaults(
      activeFilters.queueTab || 'arrivals',
      today
    );
    setDraftFilters(resetFilters);
    applyFilters(resetFilters);
  };

  const handleOpenReservation = (reservation) => {
    if (isDesktop) {
      applyFilters(activeFilters, reservation.confirmationNumber);
      return;
    }

    const params = buildReservationWorkspaceSearchParams(activeFilters).toString();
    navigate(`/reservations/${reservation.confirmationNumber}${params ? `?${params}` : ''}`, {
      state: { fromQueuePath: '/reservations' },
    });
  };

  const handleDetailAction = (action, reservation) => {
    switch (action) {
      case 'checkIn':
        navigate('/check-in', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      case 'payment':
        navigate('/checkout', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation, workflowIntent: 'payment' }
          ),
        });
        break;
      case 'modify':
        navigate('/reservations/modify', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      case 'cancel':
        navigate('/reservations/cancel', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      case 'checkout':
        navigate('/checkout', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation, workflowIntent: 'checkout' }
          ),
        });
        break;
      case 'invoice':
        navigate('/invoice-preview', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      default:
        break;
    }
  };

  const queueContext = useMemo(
    () => buildReservationWorkspaceQueueContext(searchParams, t, i18n.language),
    [i18n.language, searchParams, t]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.eyebrow`)}
        title={t('navReservations')}
        description={t(`${pageTx}.description`, { name: displayName })}
        meta={[
          t(`${pageTx}.focusMeta`, { focus: activeTab.label }),
          t(`${pageTx}.resultsMeta`, { count: metrics.visibleCount }),
          countReservationWorkspaceFilters(activeFilters) > 0
            ? t(`${pageTx}.filtersMeta`, {
                count: countReservationWorkspaceFilters(activeFilters),
              })
            : t(`${pageTx}.filtersMetaNone`),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t(`${pageTx}.workspaceTitle`)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.currentFocus`)}
              </p>
              <p className="mt-2 text-3xl font-black">{activeTab.label}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.activeQueue`)}
              </p>
              <p className="mt-2 text-3xl font-black">{metrics.visibleCount}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={CalendarDays}
          label={t(`${pageTx}.metrics.visibleLabel`)}
          value={String(metrics.visibleCount)}
          hint={t(`${pageTx}.metrics.visibleHint`)}
        />
        <DashboardMetricCard
          icon={ClipboardCheck}
          label={t(`${pageTx}.metrics.arrivalsLabel`)}
          value={String(metrics.arrivalsReady)}
          hint={t(`${pageTx}.metrics.arrivalsHint`)}
        />
        <DashboardMetricCard
          icon={DoorClosedLocked}
          label={t(`${pageTx}.metrics.departuresLabel`)}
          value={String(metrics.departuresToday)}
          hint={t(`${pageTx}.metrics.departuresHint`)}
        />
        <DashboardMetricCard
          icon={Receipt}
          label={t(`${pageTx}.metrics.balanceLabel`)}
          value={String(metrics.balancesDue)}
          hint={t(`${pageTx}.metrics.balanceHint`)}
          tone="light"
          cardClassName="!bg-white !text-zinc-950 !border-zinc-200 !shadow-sm"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <DashboardPanel
          title={t(`${pageTx}.queueTitle`)}
          description={t(`${pageTx}.queueDescription`)}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {queueTabs.map((tab) => {
                const isActive = tab.id === activeTab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      isActive
                        ? 'bg-zinc-950 text-white'
                        : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className={FILTER_GRID_CLASS}>
                <label className={FILTER_FIELD_CLASS}>
                  <span className={FILTER_LABEL_CLASS}>
                    {t('confirmationNumber')}
                  </span>
                  <input
                    type="text"
                    dir="ltr"
                    value={draftFilters.confirmation}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        confirmation: event.target.value,
                      }))
                    }
                    placeholder={t(`${pageTx}.confirmationPlaceholder`)}
                    className={FILTER_INPUT_CLASS}
                  />
                </label>

                <label className={FILTER_FIELD_CLASS}>
                  <span className={FILTER_LABEL_CLASS}>
                    {t('guestName')}
                  </span>
                  <input
                    type="text"
                    value={draftFilters.guestName}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        guestName: event.target.value,
                      }))
                    }
                    placeholder={t(`${pageTx}.guestNamePlaceholder`)}
                    className={FILTER_INPUT_CLASS}
                  />
                </label>

                <label className={FILTER_FIELD_CLASS}>
                  <span className={FILTER_LABEL_CLASS}>
                    {t('status')}
                  </span>
                  <select
                    value={draftFilters.status}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className={FILTER_INPUT_CLASS}
                  >
                    <option value="">{t(`${pageTx}.anyStatus`)}</option>
                    {Object.values(ReservationStatus).map((status) => (
                      <option key={status} value={status}>
                        {getReservationStatusLabel(status, t)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={FILTER_FIELD_CLASS}>
                  <span className={FILTER_LABEL_CLASS}>
                    {t('checkInDate')}
                  </span>
                  <input
                    type="date"
                    value={draftFilters.checkInDate}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        checkInDate: event.target.value,
                      }))
                    }
                    className={FILTER_INPUT_CLASS}
                  />
                </label>

                <label className={FILTER_FIELD_CLASS}>
                  <span className={FILTER_LABEL_CLASS}>
                    {t('checkOutDate')}
                  </span>
                  <input
                    type="date"
                    value={draftFilters.checkOutDate}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        checkOutDate: event.target.value,
                      }))
                    }
                    className={FILTER_INPUT_CLASS}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3 sm:justify-end">
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  {t(`${pageTx}.applyFilters`)}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isAtQueueDefault}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('common.clearFilters')}
                </button>
              </div>

              <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {hasPendingFilterChanges
                      ? translateWithFallback(
                          t,
                          'staffDashboardPage.pendingFilters',
                          'Draft filters'
                        )
                      : translateWithFallback(
                          t,
                          'staffDashboardPage.appliedFilters',
                          'Applied filters'
                        )}
                  </p>
                  {hasPendingFilterChanges ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {translateWithFallback(
                        t,
                        'staffDashboardPage.pendingFiltersHint',
                        'Apply filters to refresh the queue'
                      )}
                    </span>
                  ) : null}
                </div>

                {visibleFilterChips.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleFilterChips.map((chip) => (
                      <span
                        key={chip.key}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700"
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
                  <p className="mt-3 text-sm font-medium text-zinc-500">
                    {translateWithFallback(
                      t,
                      'staffDashboardPage.emptyFiltersNote',
                      'No extra filters are applied. The queue is showing the default reservations for the active tab.'
                    )}
                  </p>
                )}

                <p className="mt-3 text-sm font-medium leading-6 text-zinc-600">
                  {hasConfirmationPrecedence
                    ? translateWithFallback(
                        t,
                        'staffDashboardPage.confirmationPrecedenceNote',
                        'Confirmation number takes precedence. Guest name, status, and stay dates remain visible, but the queue resolves by confirmation first.'
                      )
                    : hasPendingFilterChanges
                      ? translateWithFallback(
                          t,
                          'staffDashboardPage.pendingSyncNote',
                          'Apply filters to sync the queue with the latest reservation search criteria.'
                        )
                      : translateWithFallback(
                          t,
                          'staffDashboardPage.filterSyncNote',
                          'The queue is synced with the current filters.'
                        )}
                </p>
              </div>
            </form>

            {loading ? (
              <LoadingState message={t(`${pageTx}.loading`)} />
            ) : error ? (
              <div className="space-y-4">
                <ErrorState
                  title={t(`${pageTx}.errorTitle`)}
                  message={error}
                  onRetry={reload}
                />
                {!isAtQueueDefault ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      {t('common.clearFilters')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : reservations.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  title={t(`${pageTx}.emptyTitle`)}
                  message={t(`${pageTx}.emptyDescription`)}
                />
                {!isAtQueueDefault ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      {t('common.clearFilters')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((reservation) => {
                  const isSelected =
                    selectedConfirmation === reservation.confirmationNumber && isDesktop;

                  return (
                    <button
                      key={reservation.id ?? reservation.confirmationNumber}
                      type="button"
                      onClick={() => handleOpenReservation(reservation)}
                      className={`w-full rounded-[1.5rem] border p-5 text-left shadow-sm transition ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-950 text-white'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex min-w-0 flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-black tracking-tight [overflow-wrap:anywhere]">
                              {reservation.guestName || t('common.guest')}
                            </p>
                            <LtrText
                              className={`mt-1 text-sm font-medium ${
                                isSelected ? 'text-white/70' : 'text-zinc-500'
                              }`}
                            >
                              {reservation.guestEmail || t('common.noGuestEmailProvided')}
                            </LtrText>
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                              isSelected
                                ? 'border-white/20 bg-white/10 text-white'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                            }`}
                          >
                            {getReservationStatusLabel(reservation.status, t)}
                          </span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div
                            className={`rounded-2xl border px-4 py-3 ${
                              isSelected
                                ? 'border-white/10 bg-white/5'
                                : 'border-zinc-200 bg-zinc-50'
                            }`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('confirmationNumber')}
                            </p>
                            <LtrText className="mt-2 text-sm font-bold">
                              {reservation.confirmationNumber}
                            </LtrText>
                          </div>

                          <div
                            className={`rounded-2xl border px-4 py-3 ${
                              isSelected
                                ? 'border-white/10 bg-white/5'
                                : 'border-zinc-200 bg-zinc-50'
                            }`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('common.room')}
                            </p>
                            <p className="mt-2 text-sm font-bold">
                              {reservation.roomNumber || t('unassigned')}
                            </p>
                            <p
                              className={`mt-1 text-xs font-medium ${
                                isSelected ? 'text-white/70' : 'text-zinc-500'
                              }`}
                            >
                              {translateKnownValue(reservation.roomTypeName, t) || t('unassigned')}
                            </p>
                          </div>

                          <div
                            className={`rounded-2xl border px-4 py-3 ${
                              isSelected
                                ? 'border-white/10 bg-white/5'
                                : 'border-zinc-200 bg-zinc-50'
                            }`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('modifyReservationPage.stayDates')}
                            </p>
                            <p className="mt-2 text-sm font-bold">
                              {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            <p
                              className={`mt-1 text-xs font-medium ${
                                isSelected ? 'text-white/70' : 'text-zinc-500'
                              }`}
                            >
                              {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>

                          <div
                            className={`rounded-2xl border px-4 py-3 ${
                              isSelected
                                ? 'border-white/10 bg-white/5'
                                : 'border-zinc-200 bg-zinc-50'
                            }`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('checkInPage.reservationTotal')}
                            </p>
                            <p className="mt-2 text-sm font-bold">
                              {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                            </p>
                            {reservation.outstandingBalance != null ? (
                              <p
                                className={`mt-1 text-xs font-medium ${
                                  isSelected ? 'text-white/70' : 'text-zinc-500'
                                }`}
                              >
                                {t('checkoutPage.outstandingBalanceLabel')}:{' '}
                                <LtrText>
                                  {formatLocalizedCurrency(
                                    reservation.outstandingBalance,
                                    i18n.language
                                  )}
                                </LtrText>
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div
                          className={`flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${
                            isSelected ? 'border-white/10' : 'border-zinc-200'
                          }`}
                        >
                          <p
                            className={`text-sm font-medium ${
                              isSelected ? 'text-white/80' : 'text-zinc-500'
                            }`}
                          >
                            {getReservationWorkspaceActionLabel(reservation, today, t)}
                          </p>
                          <span className="text-sm font-bold">
                            {isDesktop
                              ? t('common.selectReservation')
                              : t(`${pageTx}.openReservation`)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t('reservationDetailsTitle')}
          description={
            isDesktop
              ? translateWithFallback(
                  t,
                  'reservationsWorkspacePage.inlineDetailDescription',
                  'Select a reservation from the queue to load its details and next actions beside the list.'
                )
              : translateWithFallback(
                  t,
                  'reservationsWorkspacePage.mobileDetailDescription',
                  'Open a reservation from the queue to continue on the standalone reservation details page.'
                )
          }
        >
          {!isDesktop ? (
            <EmptyState
              title={t('reservationDetailsPage.selectTitle')}
              message={translateWithFallback(
                t,
                'reservationsWorkspacePage.mobileDetailDescription',
                'Open a reservation from the queue to continue on the standalone reservation details page.'
              )}
            />
          ) : selectedConfirmation ? (
            <ReservationDetailLoader
              confirmationNumber={selectedConfirmation}
              queueContext={queueContext}
              variant="inline"
              onAction={handleDetailAction}
            />
          ) : (
            <EmptyState
              title={t('reservationDetailsPage.selectTitle')}
              message={translateWithFallback(
                t,
                'reservationsWorkspacePage.selectDetailDescription',
                'Pick a reservation from the queue to keep the action hub and billing details in sync.'
              )}
            />
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
