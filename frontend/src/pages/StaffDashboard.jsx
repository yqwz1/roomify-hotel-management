import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  BriefcaseBusiness,
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
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';
import { useReservationQueue } from '../hooks/useReservationQueue';
import {
  formatLocalizedCurrency,
  translateWithFallback,
  translateKnownValue,
} from '../utils/localization';
import {
  getReservationWorkspaceActionLabel,
} from '../utils/reservationWorkspace';

import { Button } from "@/components/ui/button";
export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const pageTx = 'staffDashboardPage';
  const welcomeName = user?.username || t('roleStaff');

  const overviewFilters = useMemo(
    () => ({
      queueTab: 'all',
      confirmation: '',
      guestName: '',
      status: '',
      checkInDate: '',
      checkOutDate: '',
    }),
    []
  );

  const { reservations, loading, error, metrics, today, reload } =
    useReservationQueue(overviewFilters);

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
        onClick: () => navigate('/search'),
      },
      {
        icon: CalendarDays,
        title: t('navReservations'),
        description: t('staffDashboardPage.queueDescription'),
        onClick: () => navigate('/reservations'),
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
        icon: BriefcaseBusiness,
        title: translateWithFallback(t, 'navServiceRequests', 'Service Requests'),
        description: translateWithFallback(
          t,
          'staffServiceRequests.quickActionDescription',
          'Review guest service requests and update their progress.'
        ),
        onClick: () => navigate('/staff/service-requests'),
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

  const previewReservations = reservations.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.eyebrow`)}
        title={t('staffDashboardTitle')}
        description={t(`${pageTx}.description`, { name: welcomeName })}
        meta={[
          t(`${pageTx}.focusMeta`, { focus: t('navReservations') }),
          t(`${pageTx}.resultsMeta`, { count: metrics.visibleCount }),
          t(`${pageTx}.filtersMetaNone`),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t(`${pageTx}.workspaceTitle`)}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 min-h-[136px] flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 break-words">
                {t(`${pageTx}.currentFocus`)}
              </p>
              <p className="mt-auto whitespace-nowrap text-[clamp(1.2rem,1.4vw,1.5rem)] font-black leading-none tracking-tight">
                {t('navReservations')}
              </p>
            </div>
            <div className="flex min-w-0 min-h-[136px] flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 break-words">
                {t(`${pageTx}.activeQueue`)}
              </p>
              <p className="mt-auto whitespace-nowrap text-[clamp(1.2rem,1.4vw,1.5rem)] font-black leading-none tracking-tight">
                {metrics.visibleCount}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          icon={CalendarDays}
          label={t(`${pageTx}.metrics.visibleLabel`)}
          value={String(metrics.visibleCount)}
          hint={t(`${pageTx}.metrics.visibleHint`)}
          labelClassName="whitespace-nowrap overflow-hidden text-ellipsis tracking-[0.14em]"
          hintClassName="whitespace-nowrap overflow-hidden text-ellipsis"
        />
        <DashboardMetricCard
          icon={ClipboardCheck}
          label={t(`${pageTx}.metrics.arrivalsLabel`)}
          value={String(metrics.arrivalsReady)}
          hint={t(`${pageTx}.metrics.arrivalsHint`)}
          labelClassName="whitespace-nowrap overflow-hidden text-ellipsis tracking-[0.14em]"
          hintClassName="whitespace-nowrap overflow-hidden text-ellipsis"
        />
        <DashboardMetricCard
          icon={DoorClosedLocked}
          label={t(`${pageTx}.metrics.departuresLabel`)}
          value={String(metrics.departuresToday)}
          hint={t(`${pageTx}.metrics.departuresHint`)}
          labelClassName="whitespace-nowrap overflow-hidden text-ellipsis tracking-[0.14em]"
          hintClassName="whitespace-nowrap overflow-hidden text-ellipsis"
        />
        <DashboardMetricCard
          icon={Receipt}
          label={t(`${pageTx}.metrics.balanceLabel`)}
          value={String(metrics.balancesDue)}
          hint={t(`${pageTx}.metrics.balanceHint`)}
          tone="light"
          cardClassName="!bg-white !text-brand-ink !border-brand-surface-border !shadow-sm"
          labelClassName="whitespace-nowrap overflow-hidden text-ellipsis tracking-[0.14em]"
          hintClassName="whitespace-nowrap overflow-hidden text-ellipsis"
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <DashboardPanel
          title={t('navReservations')}
          description={t('staffDashboardPage.queueDescription')}
        >
          {loading ? (
            <LoadingState message={t(`${pageTx}.loading`)} />
          ) : error ? (
            <ErrorState
              title={t(`${pageTx}.errorTitle`)}
              message={error}
              onRetry={reload}
            />
          ) : previewReservations.length === 0 ? (
            <EmptyState
              title={t(`${pageTx}.emptyTitle`)}
              message={t(`${pageTx}.emptyDescription`)}
            />
          ) : (
            <div className="space-y-3">
              {previewReservations.map((reservation) => (
                <div
                  key={reservation.id ?? reservation.confirmationNumber}
                  className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-5"
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-black tracking-tight text-brand-ink [overflow-wrap:anywhere] break-words">
                        {reservation.guestName || t('common.guest')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                        {getReservationWorkspaceActionLabel(reservation, today, t)}
                      </p>
                    </div>
                    <Button variant="unstyled" size="none"
                      type="button"
                      onClick={() =>
                        navigate(`/reservations?selected=${reservation.confirmationNumber}`)
                      }
                      className="inline-flex min-w-0 h-10 items-center justify-center rounded-full border border-brand-surface-border bg-white px-4 text-sm font-bold text-brand-ink transition hover:border-brand-primary/40 hover:bg-brand-surface-light"
                    >
                      {t('staffDashboardPage.openReservation')}
                    </Button>
                  </div>

                  <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-brand-surface-border bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                        {t('confirmationNumber')}
                      </p>
                      <LtrText className="mt-2 text-sm font-bold text-brand-ink">
                        {reservation.confirmationNumber}
                      </LtrText>
                    </div>
                    <div className="rounded-2xl border border-brand-surface-border bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                        {t('common.room')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                        {reservation.roomNumber || t('unassigned')}
                      </p>
                      <p className="mt-1 text-xs font-medium text-brand-ink-muted break-words">
                        {translateKnownValue(reservation.roomTypeName, t) || t('unassigned')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-brand-surface-border bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                        {t('checkInPage.reservationTotal')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                        {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="unstyled" size="none"
                type="button"
                onClick={() => navigate('/reservations')}
                className="inline-flex min-w-0 h-12 items-center justify-center rounded-full bg-brand-primary px-6 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
              >
                {t('navReservations')}
              </Button>
            </div>
          )}
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title={t(`${pageTx}.actionsTitle`)}
            description={t(`${pageTx}.actionsDescription`)}
          >
            <div className="grid min-w-0 gap-3">
              {quickActions.map((action) => (
                <DashboardQuickAction key={action.title} {...action} />
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={t(`${pageTx}.workspaceNotesTitle`)}
            description={t(`${pageTx}.workspaceNotesDescription`)}
          >
            <div className="grid min-w-0 gap-3">
              {[
                t(`${pageTx}.workspaceNote1`),
                t(`${pageTx}.workspaceNote2`),
                t(`${pageTx}.workspaceNote3`),
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4 text-sm font-medium leading-6 text-brand-ink-muted"
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
