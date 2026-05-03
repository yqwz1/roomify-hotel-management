import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  CalendarDays,
  LifeBuoy,
  Mail,
  ReceiptText,
  Receipt,
  UserRound,
} from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthProvider';
import {
  extractGuestReservationError,
  getGuestReservations,
} from '../services/guestReservationService';
import { getRoleCodeLabel } from '../utils/localization';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getPaymentStatusLabel,
  getReservationStatusLabel,
} from '../utils/localization';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Guest%20Support`;

function GuestStayCard({ reservation, propertyName, language, t }) {
  const roomLabel = reservation.roomNumber
    ? t('roomNumber', { number: reservation.roomNumber })
    : t('guestDashboardPage.roomPending');
  const roomTypeLabel = reservation.roomType || t('guestDashboardPage.roomTypePending');
  const statusLabel = reservation.status
    ? getReservationStatusLabel(reservation.status, t)
    : t('common.pending');
  const paymentStatusLabel = reservation.paymentStatus
    ? getPaymentStatusLabel(reservation.paymentStatus, t)
    : t('common.pending');
  const totalAmountLabel = reservation.totalAmount == null
    ? '-'
    : formatLocalizedCurrency(reservation.totalAmount, language);

  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
            {propertyName}
          </p>
          <h4 className="mt-2 text-xl font-black tracking-tight text-zinc-950">
            {roomTypeLabel}
          </h4>
          <p className="mt-1 text-sm font-medium text-zinc-500">{roomLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-600">
            {statusLabel}
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-600">
            {paymentStatusLabel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('confirmationNumber')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950">
            {reservation.confirmation || '-'}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('checkInDate')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950">
            {formatLocalizedDate(reservation.checkInDate, language, { dateStyle: 'medium' })}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('checkOutDate')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950">
            {formatLocalizedDate(reservation.checkOutDate, language, { dateStyle: 'medium' })}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('common.room')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950">{roomLabel}</p>
        </div>
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('common.stayTotal')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950">{totalAmountLabel}</p>
        </div>
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('status')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950">{statusLabel}</p>
        </div>
      </div>
    </article>
  );
}

export default function GuestDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const pageTx = 'guestDashboardPage';
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationError, setReservationError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const displayName = useMemo(
    () => user?.username || user?.email || t('guestFallback') || t('roleGuest'),
    [user?.email, user?.username, t]
  );

  useEffect(() => {
    let isActive = true;

    const loadReservations = async () => {
      setLoadingReservations(true);
      setReservationError('');

      try {
        const data = await getGuestReservations();
        if (!isActive) return;
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isActive) return;
        setReservationError(extractGuestReservationError(err));
        setReservations([]);
      } finally {
        if (isActive) {
          setLoadingReservations(false);
        }
      }
    };

    loadReservations();

    return () => {
      isActive = false;
    };
  }, [reloadToken, user?.email]);

  const handleRetry = () => {
    setReloadToken((current) => current + 1);
  };

  const nextReservation = reservations[0] ?? null;
  const outstandingBalance = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.outstandingBalance ?? 0),
    0
  );
  const finalizedInvoices = reservations.filter((reservation) => reservation.invoiceFinalized).length;
  const propertyName = t(`${pageTx}.propertyName`, {
    brand: t('brandName'),
  });

  const reservationCountValue = loadingReservations
    ? t('common.pending')
    : String(reservations.length);
  const reservationCountHint = loadingReservations
    ? t(`${pageTx}.metrics.staysHintLoading`)
    : reservations.length > 0
      ? t(`${pageTx}.metrics.staysHint`, { count: reservations.length })
      : t(`${pageTx}.metrics.staysHintEmpty`);
  const nextStayValue = loadingReservations
    ? t('common.pending')
    : nextReservation?.checkInDate
      ? formatLocalizedDate(nextReservation.checkInDate, i18n.language, { dateStyle: 'medium' })
      : t(`${pageTx}.metrics.noStayValue`);
  const nextStayHint = loadingReservations
    ? t(`${pageTx}.metrics.nextStayHintLoading`)
    : nextReservation
      ? `${propertyName} · ${nextReservation.status ? getReservationStatusLabel(nextReservation.status, t) : t('common.pending')}`
      : t(`${pageTx}.metrics.nextStayHintEmpty`);
  const sanitizedNextStayHint = nextStayHint.replace(/Â·/g, '·');
  const totalValue = loadingReservations
    ? t('common.pending')
    : nextReservation
      ? nextReservation.totalAmount == null
        ? '-'
        : formatLocalizedCurrency(nextReservation.totalAmount, i18n.language)
      : t(`${pageTx}.metrics.noStayValue`);
  const totalHint = loadingReservations
    ? t(`${pageTx}.metrics.totalHintLoading`)
    : nextReservation
      ? nextReservation.paymentStatus
        ? getPaymentStatusLabel(nextReservation.paymentStatus, t)
        : t('common.pending')
      : t(`${pageTx}.metrics.totalHintEmpty`);

  const accountItems = [
    { label: t('usernameLabel'), value: user?.username || '-' },
    { label: t('emailLabel'), value: user?.email || '-' },
    { label: t('roleLabel'), value: getRoleCodeLabel(user?.roles?.[0] || 'ROLE_GUEST', t) },
    { label: t(`${pageTx}.supportContact`), value: SUPPORT_EMAIL },
    {
      label: t('checkoutPage.outstandingBalanceLabel'),
      value: formatLocalizedCurrency(outstandingBalance, i18n.language),
    },
    {
      label: t('common.finalized'),
      value: String(finalizedInvoices),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.eyebrow`)}
        title={t('guestDashboardTitle')}
        description={t(`${pageTx}.description`, { name: displayName })}
        meta={[
          loadingReservations
            ? t(`${pageTx}.liveStaySyncLoading`)
            : t(`${pageTx}.liveStaySyncLoaded`, { count: reservations.length }),
          t(`${pageTx}.directHotelContact`),
          nextReservation
            ? t(`${pageTx}.nextStayMeta`, {
                date: formatLocalizedDate(nextReservation.checkInDate, i18n.language, {
                  dateStyle: 'medium',
                }),
              })
            : t(`${pageTx}.noStayMeta`),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{displayName}</p>
              <p className="truncate text-sm text-white/65">{user?.email || SUPPORT_EMAIL}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={CalendarDays}
          label={t(`${pageTx}.metrics.staysLabel`)}
          value={reservationCountValue}
          hint={reservationCountHint}
        />
        <DashboardMetricCard
          icon={BedDouble}
          label={t(`${pageTx}.metrics.nextStayLabel`)}
          value={nextStayValue}
          hint={sanitizedNextStayHint}
        />
        <DashboardMetricCard
          icon={Receipt}
          label={t(`${pageTx}.metrics.totalLabel`)}
          value={totalValue}
          hint={totalHint}
        />
        <DashboardMetricCard
          icon={Mail}
          label={t(`${pageTx}.metrics.supportEmailLabel`)}
          value={SUPPORT_EMAIL}
          hint={SUPPORT_EMAIL}
          valueClassName="text-xl sm:text-2xl"
          hintClassName="text-xs sm:text-sm text-zinc-400"
        />
        <DashboardMetricCard
          icon={LifeBuoy}
          label={t(`${pageTx}.metrics.helpDeskLabel`)}
          value={t(`${pageTx}.metrics.helpDeskValue`)}
          hint={t(`${pageTx}.metrics.helpDeskHint`)}
          tone="light"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          title={t(`${pageTx}.stayTitle`)}
          description={t(`${pageTx}.stayDescription`)}
        >
          {loadingReservations ? (
            <LoadingState message={t(`${pageTx}.loadingReservations`)} />
          ) : reservationError ? (
            <ErrorState
              title={t(`${pageTx}.errorTitle`)}
              message={reservationError}
              onRetry={handleRetry}
            />
          ) : reservations.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                icon={BedDouble}
                title={t(`${pageTx}.emptyTitle`)}
                message={t(`${pageTx}.emptyMessage`)}
              />
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  {t('navGetHelp')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-950 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  {t('navBrowseRooms')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {reservations.map((reservation) => (
                <GuestStayCard
                  key={`${reservation.confirmation}-${reservation.checkInDate}`}
                  reservation={reservation}
                  propertyName={propertyName}
                  language={i18n.language}
                  t={t}
                />
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.accountTitle`)}
          description={t(`${pageTx}.accountDescription`)}
        >
          <div className="grid gap-3">
            {accountItems.map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{item.value}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel
          title={t(`${pageTx}.actionsTitle`)}
          description={t(`${pageTx}.actionsDescription`)}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardQuickAction
              icon={LifeBuoy}
              title={t('navGetHelp')}
              description={t(`${pageTx}.bookingsDescription`)}
              onClick={() => navigate('/bookings')}
            />
            <DashboardQuickAction
              icon={BedDouble}
              title={t('navBrowseRooms')}
              description={t(`${pageTx}.browseDescription`)}
              onClick={() => navigate('/search')}
            />
            <DashboardQuickAction
              icon={ReceiptText}
              title={t('navBillingStatus')}
              description={t('guestBillingStatusPage.description')}
              onClick={() => navigate('/guest/billing-status')}
            />
            <DashboardQuickAction
              icon={Mail}
              title={t(`${pageTx}.contactFrontDeskTitle`)}
              description={t(`${pageTx}.supportDescription`)}
              onClick={() => window.location.assign(SUPPORT_LINK)}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.reservationHelpTitle`)}
          description={t(`${pageTx}.reservationHelpDescription`)}
        >
          <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-1">
            {t(`${pageTx}.tips`, { returnObjects: true }).map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-600"
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
