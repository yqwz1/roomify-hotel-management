import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Bell,
  CalendarRange,
  ClipboardCheck,
  Download,
  LineChart,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthProvider';
import { useManagerDashboard } from '../hooks/useManagerDashboard';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { exportDashboardReport, extractDashboardError } from '../services/dashboardService';
import { getNotifications, extractNotificationError } from '../services/notificationService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedNumber,
  getReservationStatusLabel,
  translateWithFallback,
  translateKnownValue,
} from '../utils/localization';

const EXPORTABLE_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

const toIsoDate = (value) => value.toISOString().split('T')[0];

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getDefaultRange = () => {
  const end = new Date();
  const start = addDays(end, -13);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};

const formatPercent = (value) => `${Math.round(Number(value ?? 0) * 100)}%`;

function TrendBars({
  points,
  title,
  description,
  emptyTitle,
  emptyMessage,
  colorClassName,
  maxValue,
  formatValue,
  formatSubtitle,
  testId,
}) {
  if (!Array.isArray(points) || points.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} icon={LineChart} />;
  }

  return (
    <div className="space-y-4" data-testid={testId}>
      <div>
        <p className="text-sm font-bold text-zinc-950">{title}</p>
        <p className="mt-1 text-sm font-medium text-zinc-500">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {points.map((point) => {
          const value = Number(point.value ?? 0);
          const height = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 12 : 6) : 6;

          return (
            <div
              key={point.key}
              className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex h-28 items-end">
                <div className="w-full rounded-3xl bg-white/80 p-2 shadow-sm">
                  <div className="flex h-20 items-end">
                    <div
                      className={`w-full rounded-2xl ${colorClassName}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm font-black text-zinc-950">{formatValue(value)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                {point.label}
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {formatSubtitle(point)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const pageTx = 'managerDashboardPage';
  const welcomeName = user?.username || t('managerFallback') || t('roleManager');

  const [draftRange, setDraftRange] = useState(getDefaultRange);
  const [appliedRange, setAppliedRange] = useState(getDefaultRange);
  const [filterError, setFilterError] = useState(null);
  const [exportFilters, setExportFilters] = useState({
    roomTypeId: '',
    status: '',
  });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(null);

  const {
    metrics,
    occupancyTrend,
    revenueTrend,
    roomTypeDistribution,
    loading,
    error,
    reload,
  } = useManagerDashboard(appliedRange);
  const { roomTypes, fetchRoomTypes } = useRoomTypes();

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  const loadActivity = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);

    const [notificationsResult] = await Promise.allSettled([getNotifications()]);

    if (notificationsResult.status === 'fulfilled') {
      setNotifications(notificationsResult.value);
    } else {
      setNotifications([]);
      setNotificationsError(extractNotificationError(notificationsResult.reason));
    }

    setNotificationsLoading(false);
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (!exportUrl) return undefined;

    return () => {
      URL.revokeObjectURL(exportUrl);
    };
  }, [exportUrl]);

  const quickActions = useMemo(
    () => [
      {
        icon: Search,
        title: t(`${pageTx}.quickActionItems.newBookingTitle`),
        description: t(`${pageTx}.quickActionItems.newBookingDescription`),
        onClick: () => navigate('/search'),
      },
      {
        icon: ClipboardCheck,
        title: t(`${pageTx}.quickActionItems.checkInTitle`),
        description: t(`${pageTx}.quickActionItems.checkInDescription`),
        onClick: () => navigate('/check-in'),
      },
      {
        icon: CalendarRange,
        title: t('navReservations'),
        description: translateWithFallback(
          t,
          `${pageTx}.quickActionItems.reservationsDescription`,
          'Open the live reservations workspace for queue-driven operations.'
        ),
        onClick: () => navigate('/reservations'),
      },
      {
        icon: Receipt,
        title: t(`${pageTx}.quickActionItems.invoicesTitle`),
        description: t(`${pageTx}.quickActionItems.invoicesDescription`),
        onClick: () => navigate('/invoice-preview'),
      },
      {
        icon: TrendingUp,
        title: t('roomStatus'),
        description: translateWithFallback(
          t,
          `${pageTx}.quickActionItems.roomStatusDescription`,
          'Review room readiness, cleaning, and operational status transitions.'
        ),
        onClick: () => navigate('/room-status'),
      },
      {
        icon: BedDouble,
        title: t(`${pageTx}.quickActionItems.roomsTitle`),
        description: t(`${pageTx}.quickActionItems.roomsDescription`),
        onClick: () => navigate('/rooms-management'),
      },
    ],
    [navigate, t]
  );

  const metricCards = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        icon: CalendarRange,
        label: t(`${pageTx}.metrics.totalReservationsLabel`),
        value: formatLocalizedNumber(metrics.totalReservations, i18n.language),
        hint: t(`${pageTx}.metrics.totalReservationsHint`),
      },
      {
        icon: ClipboardCheck,
        label: t(`${pageTx}.metrics.activeReservationsLabel`),
        value: formatLocalizedNumber(metrics.activeReservations, i18n.language),
        hint: t(`${pageTx}.metrics.activeReservationsHint`),
      },
      {
        icon: Receipt,
        label: t(`${pageTx}.metrics.revenueLabel`),
        value: formatLocalizedCurrency(metrics.totalRevenue, i18n.language, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        hint: t(`${pageTx}.metrics.revenueHint`),
        tone: 'dark',
      },
      {
        icon: TrendingUp,
        label: t(`${pageTx}.metrics.occupancyLabel`),
        value: formatPercent(metrics.occupancyRate),
        hint: t(`${pageTx}.metrics.occupancyHint`),
      },
      {
        icon: BedDouble,
        label: t(`${pageTx}.metrics.averageStayLabel`),
        value: t(`${pageTx}.averageStayValue`, {
          count: Number(metrics.averageStayNights ?? 0).toFixed(1),
        }),
        hint: t(`${pageTx}.metrics.averageStayHint`),
      },
    ];
  }, [i18n.language, metrics, t]);

  const occupancyPoints = useMemo(
    () =>
      occupancyTrend.map((point) => ({
        key: String(point.date),
        label: formatLocalizedDate(point.date, i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
        value: Number(point.occupancyRate ?? 0),
        occupiedRooms: Number(point.occupiedRooms ?? 0),
        totalRooms: Number(point.totalRooms ?? 0),
      })),
    [i18n.language, occupancyTrend]
  );

  const revenuePoints = useMemo(
    () =>
      revenueTrend.map((point) => ({
        key: String(point.date),
        label: formatLocalizedDate(point.date, i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
        value: Number(point.revenue ?? 0),
        reservationCount: Number(point.reservationCount ?? 0),
      })),
    [i18n.language, revenueTrend]
  );

  const maxOccupancy = useMemo(
    () => occupancyPoints.reduce((max, point) => Math.max(max, point.value), 0),
    [occupancyPoints]
  );
  const maxRevenue = useMemo(
    () => revenuePoints.reduce((max, point) => Math.max(max, point.value), 0),
    [revenuePoints]
  );

  const handleRangeChange = (field, value) => {
    setDraftRange((current) => ({ ...current, [field]: value }));
  };

  const handleApplyRange = () => {
    if (!draftRange.startDate || !draftRange.endDate) {
      setFilterError(t(`${pageTx}.filtersRequired`));
      return;
    }

    if (draftRange.endDate < draftRange.startDate) {
      setFilterError(t(`${pageTx}.filtersInvalid`));
      return;
    }

    setFilterError(null);
    setAppliedRange(draftRange);
  };

  const handleResetRange = () => {
    const nextRange = getDefaultRange();
    setFilterError(null);
    setDraftRange(nextRange);
    setAppliedRange(nextRange);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);

    try {
      const payload = {
        startDate: appliedRange.startDate,
        endDate: appliedRange.endDate,
        exportFormat: 'JSON',
      };

      if (exportFilters.roomTypeId) {
        payload.roomTypeId = Number(exportFilters.roomTypeId);
      }

      if (exportFilters.status) {
        payload.status = exportFilters.status;
      }

      const result = await exportDashboardReport(payload);
      const nextBlob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json',
      });
      const nextUrl = URL.createObjectURL(nextBlob);

      setExportUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return nextUrl;
      });
      setExportResult(result);
    } catch (err) {
      setExportError(extractDashboardError(err));
      setExportResult(null);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState message={t(`${pageTx}.loading`)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState
          title={t(`${pageTx}.errorTitle`)}
          message={error}
          onRetry={reload}
        />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          title={t(`${pageTx}.emptyTitle`)}
          message={t(`${pageTx}.emptyDescription`)}
          icon={LineChart}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.eyebrow`)}
        title={t('managerDashboardTitle')}
        description={t(`${pageTx}.description`, { name: welcomeName })}
        meta={[
          t(`${pageTx}.metaRange`, {
            start: formatLocalizedDate(appliedRange.startDate, i18n.language, {
              month: 'short',
              day: 'numeric',
            }),
            end: formatLocalizedDate(appliedRange.endDate, i18n.language, {
              month: 'short',
              day: 'numeric',
            }),
          }),
          t(`${pageTx}.metaOccupancy`, { value: formatPercent(metrics.occupancyRate) }),
          t(`${pageTx}.metaRevenue`, {
            value: formatLocalizedCurrency(metrics.totalRevenue, i18n.language, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
          }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t(`${pageTx}.focusTitle`)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.focusReservations`)}
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatLocalizedNumber(metrics.activeReservations, i18n.language)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.focusAvgStay`)}
              </p>
              <p className="mt-2 text-3xl font-black">
                {Number(metrics.averageStayNights ?? 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <DashboardPanel
        title={t(`${pageTx}.controlsTitle`)}
        description={t(`${pageTx}.controlsDescription`)}
        action={
          <Button type="button" variant="outline" onClick={reload} className="border-zinc-200">
            <RefreshCw className="h-4 w-4" />
            {t('retry')}
          </Button>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.startDateLabel`)}
                </span>
                <input
                  type="date"
                  value={draftRange.startDate}
                  onChange={(event) => handleRangeChange('startDate', event.target.value)}
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.endDateLabel`)}
                </span>
                <input
                  type="date"
                  value={draftRange.endDate}
                  onChange={(event) => handleRangeChange('endDate', event.target.value)}
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </label>
            </div>

            {filterError ? (
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                {filterError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={handleApplyRange} className="h-12 bg-zinc-950 text-white hover:bg-zinc-800">
                {t(`${pageTx}.applyFilters`)}
              </Button>
              <Button type="button" variant="outline" onClick={handleResetRange} className="h-12 border-zinc-200">
                {t(`${pageTx}.resetFilters`)}
              </Button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {t(`${pageTx}.controlsSummaryTitle`)}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.controlsSummaryReservations`)}
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-950">
                  {formatLocalizedNumber(metrics.totalReservations, i18n.language)}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.controlsSummaryRevenue`)}
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-950">
                  {formatLocalizedCurrency(metrics.totalRevenue, i18n.language, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.controlsSummaryOccupancy`)}
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-950">
                  {formatPercent(metrics.occupancyRate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <DashboardMetricCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            hint={card.hint}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          title={t(`${pageTx}.quickActionsTitle`)}
          description={t(`${pageTx}.quickActionsDescription`)}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <DashboardQuickAction key={action.title} {...action} />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.exportTitle`)}
          description={t(`${pageTx}.exportDescription`)}
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.exportRoomTypeLabel`)}
                </span>
                <select
                  value={exportFilters.roomTypeId}
                  onChange={(event) =>
                    setExportFilters((current) => ({ ...current, roomTypeId: event.target.value }))
                  }
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">{t(`${pageTx}.allRoomTypes`)}</option>
                  {roomTypes.map((roomType) => (
                    <option key={roomType.id} value={roomType.id}>
                      {translateKnownValue(roomType.name, t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.exportStatusLabel`)}
                </span>
                <select
                  value={exportFilters.status}
                  onChange={(event) =>
                    setExportFilters((current) => ({ ...current, status: event.target.value }))
                  }
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">{t(`${pageTx}.allStatuses`)}</option>
                  {EXPORTABLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getReservationStatusLabel(status, t)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
              {t(`${pageTx}.exportNote`)}
            </div>

            {exportError ? (
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                {exportError}
              </div>
            ) : null}

            {exportResult ? (
              <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      {t(`${pageTx}.exportGeneratedAt`)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-950">
                      {formatLocalizedDateTime(exportResult.generatedAt, i18n.language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      {t(`${pageTx}.exportRecords`)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-950">
                      {formatLocalizedNumber(exportResult.totalRecords, i18n.language)}
                    </p>
                  </div>
                </div>

                {exportUrl ? (
                  <div className="mt-4">
                    <Button asChild className="bg-emerald-700 text-white hover:bg-emerald-800">
                      <a href={exportUrl} download={`roomify-report-${appliedRange.startDate}-${appliedRange.endDate}.json`}>
                        <Download className="h-4 w-4" />
                        {t(`${pageTx}.downloadExport`)}
                      </a>
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="h-12 bg-zinc-950 text-white hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              {exporting ? t(`${pageTx}.exporting`) : t(`${pageTx}.exportAction`)}
            </Button>
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardPanel
          title={t(`${pageTx}.occupancyTrendTitle`)}
          description={t(`${pageTx}.occupancyTrendDescription`)}
        >
          <TrendBars
            points={occupancyPoints}
            title={t(`${pageTx}.occupancyTrendTitle`)}
            description={t(`${pageTx}.occupancyTrendDescription`)}
            emptyTitle={t(`${pageTx}.occupancyEmptyTitle`)}
            emptyMessage={t(`${pageTx}.occupancyEmptyDescription`)}
            colorClassName="bg-emerald-500"
            maxValue={maxOccupancy}
            formatValue={(value) => formatPercent(value)}
            formatSubtitle={(point) =>
              t(`${pageTx}.occupancyPoint`, {
                occupied: point.occupiedRooms,
                total: point.totalRooms,
              })
            }
            testId="occupancy-trend"
          />
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.revenueTrendTitle`)}
          description={t(`${pageTx}.revenueTrendDescription`)}
        >
          <TrendBars
            points={revenuePoints}
            title={t(`${pageTx}.revenueTrendTitle`)}
            description={t(`${pageTx}.revenueTrendDescription`)}
            emptyTitle={t(`${pageTx}.revenueEmptyTitle`)}
            emptyMessage={t(`${pageTx}.revenueEmptyDescription`)}
            colorClassName="bg-zinc-950"
            maxValue={maxRevenue}
            formatValue={(value) =>
              formatLocalizedCurrency(value, i18n.language, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            }
            formatSubtitle={(point) =>
              t(`${pageTx}.revenuePoint`, { count: point.reservationCount })
            }
            testId="revenue-trend"
          />
        </DashboardPanel>
      </div>

      <DashboardPanel
        title={t(`${pageTx}.distributionTitle`)}
        description={t(`${pageTx}.distributionDescription`)}
      >
        {roomTypeDistribution.length === 0 ? (
          <EmptyState
            title={t(`${pageTx}.distributionEmptyTitle`)}
            message={t(`${pageTx}.distributionEmptyDescription`)}
            icon={LineChart}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {roomTypeDistribution.map((item) => (
              <div
                key={item.roomTypeName}
                className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-zinc-950">
                      {translateKnownValue(item.roomTypeName, t)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {t(`${pageTx}.distributionRate`, {
                        rate: formatLocalizedCurrency(item.basePrice, i18n.language, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }),
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 shadow-sm">
                    {formatPercent(item.occupancyRate)}
                  </span>
                </div>

                <div className="mt-4 h-3 rounded-full bg-white">
                  <div
                    className="h-3 rounded-full bg-zinc-950"
                    style={{ width: `${Math.max(Number(item.occupancyRate ?? 0) * 100, item.occupiedRooms ? 6 : 0)}%` }}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.1rem] border border-white bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                      {t(`${pageTx}.distributionTotalRooms`)}
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">
                      {formatLocalizedNumber(item.totalRooms, i18n.language)}
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] border border-white bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                      {t(`${pageTx}.distributionOccupiedRooms`)}
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">
                      {formatLocalizedNumber(item.occupiedRooms, i18n.language)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title={t(`${pageTx}.notificationsTitle`)}
        description={t(`${pageTx}.notificationsDescription`)}
        action={
          <Button type="button" variant="outline" onClick={loadActivity} className="border-zinc-200">
            <RefreshCw className="h-4 w-4" />
            {t('retry')}
          </Button>
        }
      >
        {notificationsLoading ? (
          <LoadingState message={t(`${pageTx}.notificationsLoading`)} />
        ) : notificationsError ? (
          <ErrorState
            title={t(`${pageTx}.notificationsTitle`)}
            message={notificationsError}
            onRetry={loadActivity}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            title={t(`${pageTx}.notificationsEmptyTitle`)}
            message={t(`${pageTx}.notificationsEmptyDescription`)}
            icon={Bell}
          />
        ) : (
          <div className="space-y-3" data-testid="manager-notifications">
            {notifications.slice(0, 6).map((notification) => (
              <div
                key={notification.id}
                className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-zinc-950">{notification.title}</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-zinc-600">
                      {notification.message}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                      notification.read
                        ? 'border border-zinc-200 bg-white text-zinc-500'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                    }`}
                  >
                    {notification.read ? t(`${pageTx}.readLabel`) : t(`${pageTx}.newLabel`)}
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {formatLocalizedDateTime(notification.createdAt, i18n.language, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
