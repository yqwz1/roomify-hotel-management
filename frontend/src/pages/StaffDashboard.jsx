import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BedDouble,
  CalendarDays,
  ClipboardCheck,
  DoorClosedLocked,
  Receipt,
  Search,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { LtrText } from '../components/LtrText';
import StatusPill from '../components/StatusPill';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';
import { ReservationStatus } from '../domain/reservations/statusRules';
import {
  extractReservationError,
  searchReservations,
} from '../services/reservationService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateKnownValue,
} from '../utils/localization';

const formatDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeValue = (value) => String(value ?? '').trim();

const normalizeQueueFilters = (filters = {}) => ({
  queueTab: normalizeValue(filters.queueTab),
  confirmation: normalizeValue(filters.confirmation),
  guestName: normalizeValue(filters.guestName),
  status: normalizeValue(filters.status),
  checkInDate: normalizeValue(filters.checkInDate),
  checkOutDate: normalizeValue(filters.checkOutDate),
});

const buildTabDefaults = (tabId, today) => {
  switch (tabId) {
    case 'departures':
      return {
        queueTab: 'departures',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: today,
      };
    case 'inHouse':
      return {
        queueTab: 'inHouse',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: '',
      };
    case 'all':
      return {
        queueTab: 'all',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: '',
      };
    case 'arrivals':
    default:
      return {
        queueTab: 'arrivals',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: today,
        checkOutDate: '',
      };
  }
};

const createFiltersFromSearchParams = (searchParams, today) => {
  const hasParams = Array.from(searchParams.keys()).length > 0;
  const requestedTab = normalizeValue(searchParams.get('queueTab')) || (hasParams ? 'all' : 'arrivals');
  const defaults = buildTabDefaults(requestedTab, today);

  return {
    ...defaults,
    confirmation: normalizeValue(searchParams.get('confirmation')),
    guestName: normalizeValue(searchParams.get('guestName')),
    status: normalizeValue(searchParams.get('status')),
    checkInDate: normalizeValue(searchParams.get('checkInDate')) || defaults.checkInDate,
    checkOutDate: normalizeValue(searchParams.get('checkOutDate')) || defaults.checkOutDate,
  };
};

const buildSearchParamsFromFilters = (filters) => {
  const params = new URLSearchParams();
  const normalized = normalizeQueueFilters(filters);

  Object.entries(normalized).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params;
};

const countActiveFilters = (filters) =>
  ['confirmation', 'guestName', 'status', 'checkInDate', 'checkOutDate'].filter(
    (key) => Boolean(normalizeValue(filters[key]))
  ).length;

const toQueueReservation = (reservation) => ({
  id: reservation?.id ?? null,
  confirmationNumber: reservation?.confirmationNumber,
  status: reservation?.status,
  guestName: reservation?.guestName ?? reservation?.guest?.name,
  guestEmail: reservation?.guestEmail ?? reservation?.guest?.email,
  roomNumber: reservation?.roomNumber ?? reservation?.room?.roomNumber,
  roomTypeName: reservation?.roomTypeName ?? reservation?.room?.roomTypeName,
  checkInDate: reservation?.checkInDate ?? reservation?.dates?.checkIn,
  checkOutDate: reservation?.checkOutDate ?? reservation?.dates?.checkOut,
  nights: reservation?.nights ?? reservation?.dates?.nights ?? 0,
  totalPrice: reservation?.totalPrice ?? reservation?.pricing?.totalPrice ?? 0,
  outstandingBalance: reservation?.outstandingBalance,
});

const getQueueActionLabel = (reservation, today, t) => {
  if (reservation.status === ReservationStatus.CONFIRMED) {
    return t('staffDashboardPage.queueActionArrivals');
  }

  if (
    reservation.status === ReservationStatus.CHECKED_IN &&
    reservation.checkOutDate === today
  ) {
    return t('staffDashboardPage.queueActionDepartures');
  }

  if (reservation.status === ReservationStatus.CHECKED_IN) {
    return t('staffDashboardPage.queueActionInHouse');
  }

  if (reservation.status === ReservationStatus.PENDING) {
    return t('staffDashboardPage.queueActionPending');
  }

  return t('staffDashboardPage.queueActionReview');
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const today = useMemo(() => formatDateInputValue(new Date()), []);
  const pageTx = 'staffDashboardPage';
  const welcomeName = user?.username || t('roleStaff');
  const activeFilters = useMemo(
    () => createFiltersFromSearchParams(searchParams, today),
    [searchParams, today]
  );
  const [draftFilters, setDraftFilters] = useState(activeFilters);

  useEffect(() => {
    setDraftFilters(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    let ignore = false;

    const loadQueue = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchReservations(activeFilters);
        if (ignore) return;
        setReservations(Array.isArray(response) ? response.map(toQueueReservation) : []);
      } catch (err) {
        if (ignore) return;
        setReservations([]);
        setError(extractReservationError(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadQueue();

    return () => {
      ignore = true;
    };
  }, [activeFilters, reloadNonce]);

  const queueTabs = useMemo(
    () => [
      { id: 'arrivals', label: t(`${pageTx}.tabs.arrivals`) },
      { id: 'inHouse', label: t(`${pageTx}.tabs.inHouse`) },
      { id: 'departures', label: t(`${pageTx}.tabs.departures`) },
      { id: 'all', label: t(`${pageTx}.tabs.all`) },
    ],
    [t]
  );
  const activeTab =
    queueTabs.find((tab) => tab.id === activeFilters.queueTab) ?? queueTabs[0];

  const queueMetrics = useMemo(() => {
    const arrivalsReady = reservations.filter(
      (reservation) => reservation.status === ReservationStatus.CONFIRMED
    ).length;
    const departuresToday = reservations.filter(
      (reservation) =>
        reservation.status === ReservationStatus.CHECKED_IN &&
        reservation.checkOutDate === today
    ).length;
    const balancesDue = reservations.filter(
      (reservation) => Number(reservation.outstandingBalance ?? 0) > 0
    ).length;

    return {
      visibleCount: reservations.length,
      arrivalsReady,
      departuresToday,
      balancesDue,
    };
  }, [reservations, today]);

  const quickActions = useMemo(
    () => [
      {
        icon: Search,
        title: t('roomSearch'),
        description: t(`${pageTx}.actions.roomSearchDescription`),
        onClick: () => navigate('/search'),
      },
      {
        icon: BedDouble,
        title: t('bookRoom'),
        description: t(`${pageTx}.actions.bookRoomDescription`),
        onClick: () => navigate('/book'),
      },
      {
        icon: ClipboardCheck,
        title: t('checkInTitle'),
        description: t(`${pageTx}.actions.checkInDescription`),
        onClick: () => navigate('/check-in'),
      },
      {
        icon: DoorClosedLocked,
        title: t('checkoutTitle'),
        description: t(`${pageTx}.actions.checkoutDescription`),
        onClick: () => navigate('/checkout'),
      },
      {
        icon: Receipt,
        title: t('invoicePreview'),
        description: t(`${pageTx}.actions.invoiceDescription`),
        onClick: () => navigate('/invoice-preview'),
      },
    ],
    [navigate, t]
  );

  const applyFilters = (nextFilters) => {
    setSearchParams(buildSearchParamsFromFilters(nextFilters));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applyFilters({
      ...activeFilters,
      ...draftFilters,
    });
  };

  const handleTabChange = (tabId) => {
    const defaults = buildTabDefaults(tabId, today);
    applyFilters({
      ...defaults,
      confirmation: activeFilters.confirmation,
      guestName: activeFilters.guestName,
    });
  };

  const handleReset = () => {
    const resetFilters = buildTabDefaults(activeFilters.queueTab || 'arrivals', today);
    setDraftFilters(resetFilters);
    applyFilters(resetFilters);
  };

  const handleOpenReservation = (reservation) => {
    const params = buildSearchParamsFromFilters(activeFilters).toString();
    navigate(
      `/reservations/${reservation.confirmationNumber}${params ? `?${params}` : ''}`,
      {
        state: { fromQueuePath: location.pathname },
      }
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.eyebrow`)}
        title={t('staffDashboardTitle')}
        description={t(`${pageTx}.description`, { name: welcomeName })}
        meta={[
          t(`${pageTx}.focusMeta`, { focus: activeTab.label }),
          t(`${pageTx}.resultsMeta`, { count: queueMetrics.visibleCount }),
          countActiveFilters(activeFilters) > 0
            ? t(`${pageTx}.filtersMeta`, { count: countActiveFilters(activeFilters) })
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
              <p className="mt-2 text-3xl font-black">{queueMetrics.visibleCount}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={CalendarDays}
          label={t(`${pageTx}.metrics.visibleLabel`)}
          value={String(queueMetrics.visibleCount)}
          hint={t(`${pageTx}.metrics.visibleHint`)}
        />
        <DashboardMetricCard
          icon={ClipboardCheck}
          label={t(`${pageTx}.metrics.arrivalsLabel`)}
          value={String(queueMetrics.arrivalsReady)}
          hint={t(`${pageTx}.metrics.arrivalsHint`)}
        />
        <DashboardMetricCard
          icon={DoorClosedLocked}
          label={t(`${pageTx}.metrics.departuresLabel`)}
          value={String(queueMetrics.departuresToday)}
          hint={t(`${pageTx}.metrics.departuresHint`)}
        />
        <DashboardMetricCard
          icon={Receipt}
          label={t(`${pageTx}.metrics.balanceLabel`)}
          value={String(queueMetrics.balancesDue)}
          hint={t(`${pageTx}.metrics.balanceHint`)}
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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

            <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {t('confirmationNumber')}
                  </span>
                  <input
                    type="text"
                    value={draftFilters.confirmation}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        confirmation: event.target.value,
                      }))
                    }
                    placeholder={t(`${pageTx}.confirmationPlaceholder`)}
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
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
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
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
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="">{t(`${pageTx}.anyStatus`)}</option>
                    {Object.values(ReservationStatus).map((status) => (
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
                    value={draftFilters.checkInDate}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        checkInDate: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
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
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  {t(`${pageTx}.applyFilters`)}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  {t('common.clearFilters')}
                </button>
              </div>
            </form>

            {loading ? (
              <LoadingState message={t(`${pageTx}.loading`)} />
            ) : error ? (
              <ErrorState
                title={t(`${pageTx}.errorTitle`)}
                message={error}
                onRetry={() => setReloadNonce((current) => current + 1)}
              />
            ) : reservations.length === 0 ? (
              <EmptyState
                title={t(`${pageTx}.emptyTitle`)}
                message={t(`${pageTx}.emptyDescription`)}
              />
            ) : (
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id ?? reservation.confirmationNumber}
                    className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-black tracking-tight text-zinc-950">
                              {reservation.guestName || t('common.guest')}
                            </p>
                            <p className="truncate text-sm font-medium text-zinc-500">
                              {reservation.guestEmail || t('common.noGuestEmailProvided')}
                            </p>
                          </div>
                          <StatusPill status={reservation.status} size="sm" />
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('confirmationNumber')}
                            </p>
                            <p className="mt-2 text-sm font-bold text-zinc-950">
                              <LtrText>{reservation.confirmationNumber}</LtrText>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('common.room')}
                            </p>
                            <p className="mt-2 text-sm font-bold text-zinc-950">
                              {t('roomNum', {
                                number: reservation.roomNumber || t('unassigned'),
                              })}
                            </p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">
                              {translateKnownValue(reservation.roomTypeName, t) || t('unassigned')}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('modifyReservationPage.stayDates')}
                            </p>
                            <p className="mt-2 text-sm font-bold text-zinc-950">
                              {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="mt-1 text-sm font-medium text-zinc-500">
                              {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                              {t('checkInPage.reservationTotal')}
                            </p>
                            <p className="mt-2 text-sm font-bold text-zinc-950">
                              {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                            </p>
                            {reservation.outstandingBalance != null ? (
                              <p className="mt-1 text-xs font-medium text-zinc-500">
                                {t('checkoutPage.outstandingBalanceLabel')}: {' '}
                                {formatLocalizedCurrency(
                                  reservation.outstandingBalance,
                                  i18n.language
                                )}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex min-w-[13rem] flex-col items-stretch gap-3">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                            {t(`${pageTx}.nextActionLabel`)}
                          </p>
                          <p className="mt-2 text-sm font-bold text-zinc-950">
                            {getQueueActionLabel(reservation, today, t)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenReservation(reservation)}
                          className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
                        >
                          {t(`${pageTx}.openReservation`)}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title={t(`${pageTx}.actionsTitle`)}
            description={t(`${pageTx}.actionsDescription`)}
          >
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <DashboardQuickAction key={action.title} {...action} />
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={t(`${pageTx}.workspaceNotesTitle`)}
            description={t(`${pageTx}.workspaceNotesDescription`)}
          >
            <div className="grid gap-3">
              {[
                t(`${pageTx}.workspaceNote1`),
                t(`${pageTx}.workspaceNote2`),
                t(`${pageTx}.workspaceNote3`),
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium leading-6 text-zinc-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
