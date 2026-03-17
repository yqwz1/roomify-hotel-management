import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Building2,
  ClipboardCheck,
  Receipt,
  Settings2,
  Sparkles,
  Tag,
  Users,
  Wrench,
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';
import { useManagerDashboard } from '../hooks/useManagerDashboard';
import {
  formatLocalizedCurrency,
  getRoomStatusLabel,
  translateKnownValue,
} from '../utils/localization';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    loading,
    error,
    loadIssues,
    totalRooms,
    availableRooms,
    cleaningRooms,
    maintenanceRooms,
    occupancyRate,
    readinessRate,
    roomTypeCount,
    activeStaff,
    statusCounts,
    floorSummary,
    departmentSummary,
    roomTypeMix,
    alerts,
  } = useManagerDashboard();

  const pageTx = 'managerDashboardPage';
  const welcomeName = user?.username || t('managerFallback') || t('roleManager');

  const quickActions = useMemo(
    () => [
      {
        icon: BedDouble,
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
        icon: Settings2,
        title: t(`${pageTx}.quickActionItems.roomsTitle`),
        description: t(`${pageTx}.quickActionItems.roomsDescription`),
        onClick: () => navigate('/rooms-management'),
      },
      {
        icon: Tag,
        title: t(`${pageTx}.quickActionItems.roomTypesTitle`),
        description: t(`${pageTx}.quickActionItems.roomTypesDescription`),
        onClick: () => navigate('/room-types'),
      },
      {
        icon: Users,
        title: t(`${pageTx}.quickActionItems.staffTitle`),
        description: t(`${pageTx}.quickActionItems.staffDescription`),
        onClick: () => navigate('/staff'),
      },
      {
        icon: Receipt,
        title: t(`${pageTx}.quickActionItems.invoicesTitle`),
        description: t(`${pageTx}.quickActionItems.invoicesDescription`),
        onClick: () => navigate('/invoice-preview'),
      },
    ],
    [navigate, t]
  );

  const loadIssueMessages = loadIssues.map((issue) => {
    if (issue === 'rooms') return t(`${pageTx}.issueRooms`);
    if (issue === 'roomTypes') return t(`${pageTx}.issueRoomTypes`);
    if (issue === 'staff') return t(`${pageTx}.issueStaff`);
    return issue;
  });

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
          onRetry={() => window.location.reload()}
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
          t(`${pageTx}.metaOccupied`, { count: occupancyRate }),
          t(`${pageTx}.metaReadyRooms`, { count: availableRooms }),
          t(`${pageTx}.metaActiveStaff`, { count: activeStaff }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            {t(`${pageTx}.focusTitle`)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.readiness`)}
              </p>
              <p className="mt-2 text-3xl font-black">{readinessRate}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.cleaningQueue`)}
              </p>
              <p className="mt-2 text-3xl font-black">{cleaningRooms}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      {loadIssueMessages.length > 0 && (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
          {loadIssueMessages.join(' ')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardMetricCard
          icon={Building2}
          label={t(`${pageTx}.metrics.totalRoomsLabel`)}
          value={String(totalRooms)}
          hint={t(`${pageTx}.metrics.totalRoomsHint`)}
        />
        <DashboardMetricCard
          icon={BedDouble}
          label={t(`${pageTx}.metrics.availableNowLabel`)}
          value={String(availableRooms)}
          hint={t(`${pageTx}.metrics.availableNowHint`)}
        />
        <DashboardMetricCard
          icon={Sparkles}
          label={t(`${pageTx}.metrics.needsCleaningLabel`)}
          value={String(cleaningRooms)}
          hint={t(`${pageTx}.metrics.needsCleaningHint`)}
        />
        <DashboardMetricCard
          icon={Wrench}
          label={t(`${pageTx}.metrics.maintenanceLabel`)}
          value={String(maintenanceRooms)}
          hint={t(`${pageTx}.metrics.maintenanceHint`)}
        />
        <DashboardMetricCard
          icon={Users}
          label={t(`${pageTx}.metrics.activeStaffLabel`)}
          value={String(activeStaff)}
          hint={t(`${pageTx}.metrics.activeStaffHint`, { count: roomTypeCount })}
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
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
          title={t(`${pageTx}.alertsTitle`)}
          description={t(`${pageTx}.alertsDescription`)}
        >
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const prefix = `${pageTx}.alert${alert.type[0].toUpperCase()}${alert.type.slice(1)}`;

                return (
                  <button
                    key={`${alert.type}-${alert.count}`}
                    type="button"
                    onClick={() => navigate(alert.href)}
                    className="w-full rounded-[1.4rem] border border-rose-100 bg-rose-50 px-4 py-4 text-start transition hover:border-rose-200 hover:bg-rose-100/80"
                  >
                    <p className="text-sm font-bold text-rose-950">{t(`${prefix}Title`)}</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-rose-900/80">
                      {t(`${prefix}Detail`, { count: alert.count })}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-5">
              <p className="text-sm font-bold text-emerald-900">
                {t(`${pageTx}.noAlertsTitle`)}
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-800/80">
                {t(`${pageTx}.noAlertsDescription`)}
              </p>
            </div>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel
          title={t(`${pageTx}.roomBreakdownTitle`)}
          description={t(`${pageTx}.roomBreakdownDescription`)}
        >
          <div className="space-y-4">
            {statusCounts.map((item) => {
              const width = totalRooms > 0
                ? `${Math.max((item.count / totalRooms) * 100, item.count > 0 ? 6 : 0)}%`
                : '0%';

              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${item.tone}`}>
                        {getRoomStatusLabel(item.status, t)}
                      </span>
                      <p className="text-sm font-medium text-zinc-500">
                        {t(`${pageTx}.roomCount`, { count: item.count })}
                      </p>
                    </div>
                    <p className="text-sm font-black text-zinc-950">
                      {totalRooms > 0 ? `${Math.round((item.count / totalRooms) * 100)}%` : '0%'}
                    </p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-zinc-100">
                    <div className={`h-2 rounded-full ${item.bar}`} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.floorReadinessTitle`)}
          description={t(`${pageTx}.floorReadinessDescription`)}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {floorSummary.map((floor) => {
              const floorLabel = typeof floor.floor === 'number'
                ? t(`${pageTx}.floorLabel`, { floor: floor.floor })
                : t('unassigned');

              return (
                <div key={String(floor.floor)} className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        {floorLabel}
                      </p>
                      <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                        {t(`${pageTx}.floorRooms`, { count: floor.total })}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-600 shadow-sm">
                      {t(`${pageTx}.floorReady`, { count: floor.available })}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    <div className="rounded-2xl bg-white px-3 py-2 text-center">
                      <p>{t(`${pageTx}.occupiedShort`)}</p>
                      <p className="mt-1 text-base font-black text-zinc-950">{floor.occupied}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-center">
                      <p>{t(`${pageTx}.cleaningShort`)}</p>
                      <p className="mt-1 text-base font-black text-zinc-950">{floor.cleaning}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-center">
                      <p>{t(`${pageTx}.repairShort`)}</p>
                      <p className="mt-1 text-base font-black text-zinc-950">{floor.maintenance}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardPanel
          title={t(`${pageTx}.staffingTitle`)}
          description={t(`${pageTx}.staffingDescription`)}
        >
          <div className="space-y-3">
            {departmentSummary.length > 0 ? (
              departmentSummary.map((department) => (
                <div key={department.department} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-zinc-950">
                      {translateKnownValue(department.department, t)}
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-600 shadow-sm">
                      {t(`${pageTx}.staffCount`, { count: department.count })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-zinc-500">
                {t(`${pageTx}.noStaffingData`)}
              </p>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.mixTitle`)}
          description={t(`${pageTx}.mixDescription`)}
        >
          <div className="space-y-3">
            {roomTypeMix.length > 0 ? (
              roomTypeMix.map((roomType) => (
                <div key={roomType.id} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-950">
                        {translateKnownValue(roomType.name, t)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {t(`${pageTx}.mixLine`, {
                          guests: roomType.maxGuests,
                          rate: formatLocalizedCurrency(roomType.basePrice, i18n.language, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }),
                        })}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 shadow-sm">
                      {t(`${pageTx}.assignedRooms`, { count: roomType.assignedRooms })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-zinc-500">
                {t(`${pageTx}.noRoomTypeData`)}
              </p>
            )}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
