import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Receipt,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';
import { useStaffDashboard } from '../hooks/useStaffDashboard';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  translateKnownValue,
} from '../utils/localization';

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    inventory,
    loading,
    error,
    availableTonight,
    floorsCovered,
    startingRate,
    premiumReady,
    guestCapacityReady,
    roomTypeSummary,
    alerts,
    dateWindow,
  } = useStaffDashboard();

  const pageTx = 'staffDashboardPage';
  const welcomeName = user?.username || t('roleStaff');

  const quickActions = useMemo(
    () => [
      {
        icon: Search,
        title: t('roomSearch'),
        description: t(`${pageTx}.actions.roomSearchDescription`),
        onClick: () => navigate('/search'),
      },
      {
        icon: ClipboardCheck,
        title: t('checkInTitle'),
        description: t(`${pageTx}.actions.checkInDescription`),
        onClick: () => navigate('/check-in'),
      },
      {
        icon: CalendarClock,
        title: t('modifyReservationTitle'),
        description: t(`${pageTx}.actions.modifyDescription`),
        onClick: () => navigate('/reservations/modify'),
      },
      {
        icon: FileText,
        title: t('cancelReservationTitle'),
        description: t(`${pageTx}.actions.cancelDescription`),
        onClick: () => navigate('/reservations/cancel'),
      },
      {
        icon: Receipt,
        title: t('invoicePreview'),
        description: t(`${pageTx}.actions.invoiceDescription`),
        onClick: () => navigate('/invoice-preview'),
      },
      {
        icon: Wallet,
        title: t('checkoutTitle'),
        description: t(`${pageTx}.actions.checkoutDescription`),
        onClick: () => navigate('/checkout'),
      },
    ],
    [navigate, t]
  );

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
        title={t('staffDashboardTitle')}
        description={t(`${pageTx}.description`, { name: welcomeName })}
        meta={[
          t(`${pageTx}.arrivalWindow`, {
            date: formatLocalizedDate(dateWindow.checkIn, i18n.language, {
              month: 'short',
              day: 'numeric',
            }),
          }),
          t(`${pageTx}.roomsAvailable`, { count: availableTonight }),
          t(`${pageTx}.floorsRepresented`, { count: floorsCovered }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            {t(`${pageTx}.inventoryTitle`)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.startingRate`)}
              </p>
              <p className="mt-2 text-3xl font-black">
                {startingRate == null
                  ? '-'
                  : formatLocalizedCurrency(startingRate, i18n.language, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.largestFit`)}
              </p>
              <p className="mt-2 text-3xl font-black">{guestCapacityReady || '-'}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={BedDouble}
          label={t(`${pageTx}.metrics.availableLabel`)}
          value={String(availableTonight)}
          hint={t(`${pageTx}.metrics.availableHint`)}
        />
        <DashboardMetricCard
          icon={Sparkles}
          label={t(`${pageTx}.metrics.premiumLabel`)}
          value={String(premiumReady)}
          hint={t(`${pageTx}.metrics.premiumHint`)}
        />
        <DashboardMetricCard
          icon={Search}
          label={t(`${pageTx}.metrics.roomTypesLabel`)}
          value={String(roomTypeSummary.length)}
          hint={t(`${pageTx}.metrics.roomTypesHint`)}
        />
        <DashboardMetricCard
          icon={Receipt}
          label={t(`${pageTx}.metrics.rateLabel`)}
          value={
            startingRate == null
              ? '-'
              : formatLocalizedCurrency(startingRate, i18n.language, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
          }
          hint={t(`${pageTx}.metrics.rateHint`)}
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel
          title={t(`${pageTx}.actionsTitle`)}
          description={t(`${pageTx}.actionsDescription`)}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <DashboardQuickAction key={action.title} {...action} />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.shiftAlertsTitle`)}
          description={t(`${pageTx}.shiftAlertsDescription`)}
        >
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.type}
                  className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4"
                >
                  <p className="text-sm font-medium leading-6 text-amber-950">
                    {t(`${pageTx}.alert${alert.type[0].toUpperCase()}${alert.type.slice(1)}`)}
                  </p>
                </div>
              ))}
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
          title={t(`${pageTx}.availabilityTitle`)}
          description={t(`${pageTx}.availabilityDescription`)}
        >
          <div className="space-y-3">
            {roomTypeSummary.length > 0 ? (
              roomTypeSummary.map((item) => (
                <div key={item.name} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-950">
                        {translateKnownValue(item.name, t)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {t(`${pageTx}.availabilityItemDescription`)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 shadow-sm">
                      {t(`${pageTx}.availabilityItemCount`, { count: item.count })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-zinc-500">
                {t(`${pageTx}.noInventory`)}
              </p>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.playbookTitle`)}
          description={t(`${pageTx}.playbookDescription`)}
        >
          <div className="grid gap-3">
            {[
              t(`${pageTx}.playbookTip1`),
              t(`${pageTx}.playbookTip2`),
              t(`${pageTx}.playbookTip3`),
              t(`${pageTx}.playbookTip4`, { count: inventory.length }),
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
  );
}
