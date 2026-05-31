import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  BriefcaseBusiness,
  CalendarDays,
  LifeBuoy,
  Mail,
  ReceiptText,
  Receipt,
  Trash2,
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
import { deleteMyAccount } from '../services/authService';
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
  translateWithFallback,
} from '../utils/localization';

import { Button } from "@/components/ui/button";
const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Guest%20Support`;

function GuestStayCard({ reservation, propertyName, language, t }) {
  const navigate = useNavigate();
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
  const reservationStatus = String(reservation.status || '').toUpperCase();
  const paymentStatus = String(reservation.paymentStatus || '').toUpperCase();
  const needsPayment = reservationStatus !== 'CANCELLED'
    && (['PENDING', 'UNPAID', 'FAILED', 'PARTIALLY_PAID'].includes(paymentStatus)
      || reservationStatus === 'PAYMENT_PENDING');
  const failedPaymentCancelled = reservationStatus === 'CANCELLED' && paymentStatus === 'FAILED';

  return (
    <article className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
            {propertyName}
          </p>
          <h4 className="mt-2 text-xl font-black tracking-tight text-brand-ink break-words">
            {roomTypeLabel}
          </h4>
          <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">{roomLabel}</p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <span className="rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
            {statusLabel}
          </span>
          <span className="rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
            {paymentStatusLabel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.15rem] border border-brand-surface-border bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {t('confirmationNumber')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">
            {reservation.confirmation || '-'}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-brand-surface-border bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {t('checkInDate')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">
            {formatLocalizedDate(reservation.checkInDate, language, { dateStyle: 'medium' })}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-brand-surface-border bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {t('checkOutDate')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">
            {formatLocalizedDate(reservation.checkOutDate, language, { dateStyle: 'medium' })}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-brand-surface-border bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {t('common.room')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">{roomLabel}</p>
        </div>
        <div className="rounded-[1.15rem] border border-brand-surface-border bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {t('common.stayTotal')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">{totalAmountLabel}</p>
        </div>
        <div className="rounded-[1.15rem] border border-brand-surface-border bg-white px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {t('status')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">{statusLabel}</p>
        </div>
      </div>

      {needsPayment ? (
        <div className="mt-5 rounded-[1.25rem] border border-brand-primary/25 bg-white p-4">
          <p className="text-sm font-bold text-brand-ink break-words">Payment is required before this reservation can be confirmed.</p>
          <Button variant="unstyled" size="none"
            type="button"
            onClick={() => navigate(`/guest/payments/${reservation.confirmationNumber || reservation.confirmation}`, {
              state: { reservation },
            })}
            className="mt-3 inline-flex min-w-0 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white"
          >
            {paymentStatus === 'FAILED' ? 'Retry Payment' : 'Pay Now'}
          </Button>
        </div>
      ) : null}

      {failedPaymentCancelled ? (
        <div className="mt-5 rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 p-4">
          <p className="text-sm font-black text-brand-ink break-words">Payment failed and this reservation was cancelled.</p>
          <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted break-words">
            The room has been released for the selected dates. Start a new search if you want to book again.
          </p>
          <Button
            variant="unstyled"
            size="none"
            type="button"
            onClick={() => navigate('/search')}
            className="mt-3 inline-flex min-w-0 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white"
          >
            Search rooms
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export default function GuestDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const pageTx = 'guestDashboardPage';
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationError, setReservationError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isGuest = (user?.roles ?? []).includes('ROLE_GUEST');

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('confirmDeleteMyAccount'))) return;

    try {
      setIsDeletingAccount(true);
      await deleteMyAccount();
      logout();
      navigate('/login', { replace: true, state: { accountDeleted: true } });
    } catch {
      window.alert(t('deleteMyAccountFailed'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

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
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-ink break-words">
              <UserRound className="h-5 w-5 shrink-0" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{displayName}</p>
              <p className="truncate text-sm text-white/65">{user?.email || SUPPORT_EMAIL}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          hintClassName="text-xs sm:text-sm text-brand-ink-hint"
        />
        <DashboardMetricCard
          icon={LifeBuoy}
          label={t(`${pageTx}.metrics.helpDeskLabel`)}
          value={t(`${pageTx}.metrics.helpDeskValue`)}
          hint={t(`${pageTx}.metrics.helpDeskHint`)}
          tone="light"
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
              <div className="flex min-w-0 flex-wrap justify-center gap-3">
                <Button variant="unstyled" size="none"
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="inline-flex min-w-0 items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
                >
                  {t('navGetHelp')}
                </Button>
                <Button variant="unstyled" size="none"
                  type="button"
                  onClick={() => navigate('/search')}
                  className="inline-flex min-w-0 items-center justify-center rounded-full border border-brand-surface-border bg-white px-5 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-primary/30 hover:bg-brand-surface-light"
                >
                  {t('navBrowseRooms')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid min-w-0 gap-4">
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
          <div className="grid min-w-0 gap-3">
            {accountItems.map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-ink break-words">{item.value}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel
          title={t(`${pageTx}.actionsTitle`)}
          description={t(`${pageTx}.actionsDescription`)}
        >
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardQuickAction
              icon={LifeBuoy}
              title={t('navGetHelp')}
              description={t(`${pageTx}.bookingsDescription`)}
              onClick={() => navigate('/bookings')}
            />
            <DashboardQuickAction
              icon={BedDouble}
              title={translateWithFallback(t, 'navBookRoom', 'Book room')}
              description={translateWithFallback(
                t,
                `${pageTx}.bookRoomDescription`,
                'Open the existing room search flow to browse available rooms.'
              )}
              onClick={() => navigate('/search')}
            />
            <DashboardQuickAction
              icon={BriefcaseBusiness}
              title={translateWithFallback(t, 'navRequestService', 'Request Service')}
              description={translateWithFallback(
                t,
                'guestServiceRequests.dashboardDescription',
                'Submit a service request and track its status from one place.'
              )}
              onClick={() => navigate('/guest/service-requests')}
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
          <div className="grid min-w-0 gap-4 md:grid-cols-1 xl:grid-cols-1">
            {t(`${pageTx}.tips`, { returnObjects: true }).map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4 text-sm font-medium leading-6 text-brand-ink-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      {isGuest && (
        <div className="rounded-[1.5rem] border border-brand-danger/30 bg-brand-danger/5 p-6">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-danger break-words">
                {t(`${pageTx}.dangerZoneTitle`)}
              </p>
              <p className="mt-2 max-w-xl text-sm font-medium text-brand-ink-muted break-words">
                {t(`${pageTx}.dangerZoneDescription`)}
              </p>
            </div>
            <Button variant="unstyled" size="none"
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-brand-danger/40 bg-white px-5 py-3 text-sm font-bold text-brand-danger transition hover:border-brand-danger/60 hover:bg-brand-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
              title={t('deleteMyAccount')}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {isDeletingAccount ? t('deletingMyAccount') : t('deleteMyAccount')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
