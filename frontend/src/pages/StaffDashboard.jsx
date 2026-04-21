import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';
import { useReservationQueue } from '../hooks/useReservationQueue';
import {
  formatLocalizedCurrency,
  translateKnownValue,
} from '../utils/localization';
import {
  getReservationWorkspaceActionLabel,
} from '../utils/reservationWorkspace';

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
        onClick: () => navigate('/book'),
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
        icon: Receipt,
        title: t('invoicePreview'),
        description: t(`${pageTx}.actions.invoiceDescription`),
        onClick: () => navigate('/invoices'),
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t(`${pageTx}.workspaceTitle`)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.currentFocus`)}
              </p>
              <p className="mt-2 text-3xl font-black">{t('navReservations')}</p>
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
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
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
                  className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-black tracking-tight text-zinc-950 [overflow-wrap:anywhere]">
                        {reservation.guestName || t('common.guest')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {getReservationWorkspaceActionLabel(reservation, today, t)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/reservations?selected=${reservation.confirmationNumber}`)
                      }
                      className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-950 transition hover:border-zinc-950 hover:bg-zinc-50"
                    >
                      {t('staffDashboardPage.openReservation')}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('confirmationNumber')}
                      </p>
                      <LtrText className="mt-2 text-sm font-bold text-zinc-950">
                        {reservation.confirmationNumber}
                      </LtrText>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('common.room')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {reservation.roomNumber || t('unassigned')}
                      </p>
                      <p className="mt-1 text-xs font-medium text-zinc-500">
                        {translateKnownValue(reservation.roomTypeName, t) || t('unassigned')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('checkInPage.reservationTotal')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => navigate('/reservations')}
                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800"
              >
                {t('navReservations')}
              </button>
            </div>
          )}
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
