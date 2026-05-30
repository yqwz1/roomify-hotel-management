import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRightLeft,
  ClipboardCheck,
  FileText,
  Receipt,
  Wallet,
  XCircle,
} from 'lucide-react';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import LoadingState from '../common/LoadingState';
import StatusPill from '../StatusPill';
import { Button } from '../ui/button';
import { LtrText } from '../LtrText';
import DashboardHero from '../dashboard/DashboardHero';
import DashboardPanel from '../dashboard/DashboardPanel';
import { reservationStatusRules } from '../../domain/reservations/statusRules';
import {
  extractReservationError,
  getReservationByConfirmationNumber,
} from '../../services/reservationService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getBooleanLabel,
  getPaymentStatusLabel,
  getReservationStatusLabel,
  translateKnownValue,
} from '../../utils/localization';

function ActionButton({
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false,
  tone = 'default',
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-brand-danger/30 bg-brand-danger/10 text-brand-danger hover:border-brand-danger/40 hover:bg-brand-danger/15'
      : 'border-brand-surface-border bg-brand-surface-light text-brand-ink hover:border-brand-surface-border hover:bg-white';

  return (
    <Button variant="unstyled" size="none"
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[1.35rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:border-brand-surface-border disabled:bg-brand-primary-tint disabled:text-brand-ink-hint ${toneClass}`}
    >
      <span className="flex min-w-0 h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Icon className="h-4 w-4 shrink-0" />
      </span>
      <p className="mt-3 text-sm font-bold break-words">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 opacity-80 break-words">{description}</p>
    </Button>
  );
}

function FactRow({ label, value, ltr = false }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 rounded-[1.15rem] border border-brand-surface-border bg-brand-primary-tint/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm font-medium text-brand-ink-muted">{label}</dt>
      <dd className="w-full text-sm font-bold text-brand-ink sm:w-auto sm:text-right">
        {ltr ? <LtrText>{value}</LtrText> : value}
      </dd>
    </div>
  );
}

function ReservationDetailBody({
  reservation,
  queueContext,
  onBack,
  onAction,
  variant,
}) {
  const { t, i18n } = useTranslation();

  const guestName = reservation.guestName || reservation.guest?.name || t('common.guest');
  const guestEmail =
    reservation.guestEmail || reservation.guest?.email || t('common.noGuestEmailProvided');
  const guestPhone = reservation.guestPhone || reservation.guest?.phone || '-';
  const guestIdNumber = reservation.guestIdNumber || reservation.guest?.idNumber || '-';
  const guestNationality = reservation.guestNationality || reservation.guest?.nationality || '-';
  const roomNumber = reservation.roomNumber || reservation.room?.roomNumber || '-';
  const roomTypeName =
    reservation.roomTypeName || reservation.room?.roomTypeName || t('unassigned');
  const floor = reservation.floor || reservation.room?.floor || '-';
  const nights = reservation.nights ?? reservation.dates?.nights ?? 0;
  const totalPrice = reservation.totalPrice ?? reservation.pricing?.totalPrice ?? 0;
  const totalPaid = reservation.totalPaid;
  const outstandingBalance = reservation.outstandingBalance;
  const paymentStatus = reservation.paymentStatus;
  const invoiceFinalized =
    typeof reservation.invoiceFinalized === 'boolean' ? reservation.invoiceFinalized : null;
  const roomRate = reservation.roomRate ?? reservation.pricing?.roomRate ?? 0;
  const subtotal = reservation.subtotal ?? reservation.pricing?.subtotal ?? 0;
  const taxes = reservation.taxes ?? reservation.pricing?.taxes ?? 0;

  const headerCard = (
    <div className="rounded-[1.75rem] border border-brand-surface-border bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
            {t('reservationDetailsPage.confirmationNumber')}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-brand-ink break-words">
            <LtrText>{reservation.confirmationNumber}</LtrText>
          </p>
          <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
            {guestName} | {translateKnownValue(roomTypeName, t)}
          </p>
        </div>

        <div className="flex min-w-0 flex-col items-start gap-3 sm:items-end">
          <StatusPill status={reservation.status} />
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-semibold text-brand-ink">
            {t('nightsCount', { count: nights })}
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <div className="space-y-6">
      {variant === 'inline' ? headerCard : null}

      <DashboardPanel
        title={t('reservationDetailsPage.actionCenterTitle')}
        description={t('reservationDetailsPage.actionCenterDescription')}
      >
        <div className="mb-4 rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4 text-sm font-medium leading-6 text-brand-ink-muted">
          {t('reservationDetailsPage.actionHubNote')}
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionButton
            icon={ClipboardCheck}
            title={t('reservationDetailsPage.checkInTitle')}
            description={t('reservationDetailsPage.checkInDescription')}
            onClick={() => onAction?.('checkIn', reservation)}
            disabled={!reservationStatusRules.canCheckIn(reservation.status)}
          />
          <ActionButton
            icon={Wallet}
            title={t('reservationDetailsPage.paymentTitle')}
            description={t('reservationDetailsPage.paymentDescription')}
            onClick={() => onAction?.('payment', reservation)}
            disabled={!reservationStatusRules.canCollectPayment(reservation.status)}
          />
          <ActionButton
            icon={ArrowRightLeft}
            title={t('reservationDetailsPage.modifyTitle')}
            description={t('reservationDetailsPage.modifyDescription')}
            onClick={() => onAction?.('modify', reservation)}
            disabled={!reservationStatusRules.canModify(reservation.status)}
          />
          <ActionButton
            icon={XCircle}
            title={t('reservationDetailsPage.cancelTitle')}
            description={t('reservationDetailsPage.cancelDescription')}
            onClick={() => onAction?.('cancel', reservation)}
            disabled={!reservationStatusRules.canCancel(reservation.status)}
            tone="danger"
          />
          <ActionButton
            icon={Receipt}
            title={t('checkoutTitle')}
            description={t('reservationDetailsPage.checkoutDescription')}
            onClick={() => onAction?.('checkout', reservation)}
            disabled={!reservationStatusRules.canCheckOut(reservation.status)}
          />
          <ActionButton
            icon={FileText}
            title={t('reservationDetailsPage.invoiceTitle')}
            description={t('reservationDetailsPage.invoiceDescription')}
            onClick={() => onAction?.('invoice', reservation)}
          />
        </div>
      </DashboardPanel>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-6">
          <DashboardPanel
            title={t('common.guest')}
            description={t('reservationDetailsPage.overviewDescription')}
          >
            <dl className="space-y-4">
              <FactRow label={t('reservationDetailsPage.guestName')} value={guestName} />
              <FactRow label={t('reservationDetailsPage.guestEmail')} value={guestEmail} ltr />
              <FactRow label={t('phoneNumber')} value={guestPhone} ltr />
              <FactRow label={t('idPassport')} value={guestIdNumber} ltr />
              <FactRow label={t('nationality')} value={guestNationality} />
            </dl>
          </DashboardPanel>

          <DashboardPanel
            title={t('common.stay')}
            description={t('reservationDetailsPage.overviewDescription')}
          >
            <dl className="space-y-4">
              <FactRow
                label={t('reservationDetailsPage.roomNumber')}
                value={roomNumber}
                ltr
              />
              <FactRow
                label={t('reservationDetailsPage.roomType')}
                value={translateKnownValue(roomTypeName, t)}
              />
              <FactRow label={t('floor')} value={t('floorNum', { floor })} />
              <FactRow
                label={t('checkInDate')}
                value={formatLocalizedDate(reservation.checkInDate, i18n.language, {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
              <FactRow
                label={t('checkOutDate')}
                value={formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
              <FactRow label={t('nights')} value={t('nightsCount', { count: nights })} />
            </dl>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={t('navBilling')}
            description={t('reservationDetailsPage.factsDescription')}
            action={<StatusPill status={reservation.status} />}
          >
            <dl className="space-y-4">
              <FactRow
                label={t('reservationDetailsPage.nightlyRate')}
                value={formatLocalizedCurrency(roomRate, i18n.language)}
                ltr
              />
              <FactRow
                label={t('subtotal')}
                value={formatLocalizedCurrency(subtotal, i18n.language)}
                ltr
              />
              <FactRow
                label={t('taxes15')}
                value={formatLocalizedCurrency(taxes, i18n.language)}
                ltr
              />
              <FactRow
                label={t('reservationDetailsPage.totalPrice')}
                value={formatLocalizedCurrency(totalPrice, i18n.language)}
                ltr
              />
              <FactRow
                label={t('checkoutPage.paymentStatusLabel')}
                value={paymentStatus ? getPaymentStatusLabel(paymentStatus, t) : '-'}
              />
              <FactRow
                label={t('checkoutPage.totalPaidLabel')}
                value={formatLocalizedCurrency(totalPaid ?? 0, i18n.language)}
                ltr
              />
              <FactRow
                label={t('checkoutPage.outstandingBalanceLabel')}
                value={formatLocalizedCurrency(outstandingBalance ?? 0, i18n.language)}
                ltr
              />
              <FactRow
                label={t('common.finalized')}
                value={invoiceFinalized == null ? '-' : getBooleanLabel(invoiceFinalized, t)}
              />
            </dl>
          </DashboardPanel>

          {queueContext.length > 0 ? (
            <DashboardPanel
              title={t('reservationDetailsPage.queueContextTitle')}
              description={t('reservationDetailsPage.queueContextDescription')}
            >
              <dl className="space-y-4">
                {queueContext.map((item) => (
                  <FactRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    ltr={Boolean(item.ltr)}
                  />
                ))}
              </dl>
            </DashboardPanel>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (variant === 'page') {
    return (
      <div className="space-y-6">
        {onBack ? (
          <Button
            variant="outline"
            className="w-full rounded-full border-brand-surface-border text-brand-ink hover:bg-brand-primary-tint sm:w-auto"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {t('reservationDetailsPage.backToQueue')}
          </Button>
        ) : null}

        <DashboardHero
          eyebrow={t('reservationDetailsPage.heroEyebrow')}
          title={t('reservationDetailsPage.heroTitle')}
          description={t('reservationDetailsPage.heroDescription')}
          meta={[
            getReservationStatusLabel(reservation.status, t),
            t('roomNumber', { number: roomNumber }),
            t('nightsCount', { count: nights }),
          ]}
        >
          {headerCard}
        </DashboardHero>

        {content}
      </div>
    );
  }

  return content;
}

export function ReservationDetailLoader({
  confirmationNumber,
  queueContext = [],
  onBack,
  onAction,
  variant = 'page',
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadReservation = async () => {
      if (!confirmationNumber) {
        setReservation(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getReservationByConfirmationNumber(confirmationNumber);
        if (ignore) return;
        setReservation(result);
      } catch (err) {
        if (ignore) return;
        setReservation(null);
        setError(extractReservationError(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadReservation();

    return () => {
      ignore = true;
    };
  }, [confirmationNumber, reloadNonce]);

  if (loading) {
    return <LoadingState message={t('reservationDetailsPage.loading')} />;
  }

  if (!confirmationNumber) {
    return (
      <EmptyState
        title={t('reservationDetailsPage.emptyTitle')}
        message={t('reservationDetailsPage.emptyDescription')}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t('reservationDetailsPage.errorTitle')}
        message={error}
        onRetry={() => setReloadNonce((current) => current + 1)}
      />
    );
  }

  if (!reservation) {
    return (
      <EmptyState
        title={t('reservationDetailsPage.emptyTitle')}
        message={t('reservationDetailsPage.emptyDescription')}
      />
    );
  }

  return (
    <ReservationDetailBody
      reservation={reservation}
      queueContext={queueContext}
      onBack={onBack}
      onAction={onAction}
      variant={variant}
    />
  );
}

export default ReservationDetailBody;
