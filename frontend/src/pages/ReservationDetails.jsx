import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightLeft,
  CalendarDays,
  CreditCard,
  FileText,
  Hotel,
  Receipt,
  UserRound,
  XCircle,
  Eye,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import StatusPill from '../components/StatusPill';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import {
  extractReservationError,
  getReservationByConfirmationNumber,
  getAllReservations,
} from '../services/reservationService';
import { reservationStatusRules } from '../domain/reservations/statusRules';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getBooleanLabel,
  getPaymentStatusLabel,
  getReservationStatusLabel,
  translateKnownValue,
} from '../utils/localization';

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
      ? 'border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300 hover:bg-rose-100'
      : 'border-zinc-200 bg-zinc-50 text-zinc-950 hover:border-zinc-300 hover:bg-white';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[1.35rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 ${toneClass}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 opacity-80">{description}</p>
    </button>
  );
}

export default function ReservationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmationNumber: routeConfirmation } = useParams();
  const { t, i18n } = useTranslation();

  const confirmationNumber = useMemo(() => {
    const fromState = location.state?.confirmationNumber;
    return String(fromState ?? routeConfirmation ?? '').trim();
  }, [location.state?.confirmationNumber, routeConfirmation]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [reservationsList, setReservationsList] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!confirmationNumber) {
          const result = await getAllReservations();
          setReservationsList(result);
        } else {
          const result = await getReservationByConfirmationNumber(confirmationNumber);
          setReservation(result);
        }
      } catch (err) {
        setError(extractReservationError(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [confirmationNumber, t]);

  if (loading) {
    return <LoadingState message={t('reservationDetailsPage.loading')} />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('reservationDetailsPage.errorTitle')}
        message={error}
        onRetry={() => navigate(0)}
      />
    );
  }

  if (!confirmationNumber && reservationsList) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        <DashboardHero
          eyebrow={t('bookings')}
          title={t('bookings')}
          description={t('reservationLookupPanel.description')}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reservationsList.map((res) => (
            <div key={res.id || res.confirmationNumber} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-black">
              <div className="mb-4 flex items-start justify-between">
                <div>
                   <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">{t('checkInPage.confirmation')}</p>
                   <p className="mt-1 text-sm font-bold"><LtrText>{res.confirmationNumber}</LtrText></p>
                </div>
                <StatusPill status={res.status} size="sm" />
              </div>
              <div className="mb-4 space-y-2">
                 <p className="text-sm font-medium text-zinc-600">
                    <UserRound className="mr-2 inline h-4 w-4"/>
                    {res.guestName || res.guest?.name || t('common.guest')}
                 </p>
                 <p className="text-sm font-medium text-zinc-600">
                    <Hotel className="mr-2 inline h-4 w-4"/>
                    {t('roomNum', { number: res.roomNumber || res.room?.roomNumber || t('unassigned') })}
                 </p>
                 <p className="text-sm font-medium text-zinc-600">
                    <Receipt className="mr-2 inline h-4 w-4"/>
                    {res.paymentStatus ? getPaymentStatusLabel(res.paymentStatus, t) : t('nightsCount', { count: res.nights })}
                 </p>
              </div>
              <button 
                 onClick={() => navigate(`/reservations/${res.confirmationNumber}`)}
                 className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-2.5 text-sm font-bold transition hover:bg-zinc-200 text-zinc-900">
                 <Eye className="h-4 w-4" /> {t('common.selectReservation')}
              </button>
            </div>
          ))}
          {reservationsList.length === 0 && (
             <div className="col-span-full py-12 text-center text-sm font-medium text-zinc-500">
                {t('reservationLookupPanel.emptyDescription')}
             </div>
          )}
        </div>
      </div>
    );
  }

  if (!reservation && confirmationNumber) {
    return (
      <ErrorState
        title={t('reservationDetailsPage.emptyTitle')}
        message={t('reservationDetailsPage.emptyDescription')}
      />
    );
  }

  const guestName = reservation.guestName || reservation.guest?.name || t('common.guest');
  const guestEmail = reservation.guestEmail || reservation.guest?.email || t('common.noGuestEmailProvided');
  const roomNumber = reservation.roomNumber || reservation.room?.roomNumber || '-';
  const roomTypeName = reservation.roomTypeName || reservation.room?.roomTypeName || t('unassigned');
  const floor = reservation.floor || reservation.room?.floor || '-';
  const nights = reservation.nights ?? reservation.dates?.nights ?? 0;
  const totalPrice = reservation.totalPrice ?? reservation.pricing?.totalPrice ?? 0;
  const totalPaid = reservation.totalPaid;
  const outstandingBalance = reservation.outstandingBalance;
  const paymentStatus = reservation.paymentStatus;
  const invoiceFinalized =
    typeof reservation.invoiceFinalized === 'boolean' ? reservation.invoiceFinalized : null;
  const financialFacts = [
    {
      label: t('checkoutPage.paymentStatusLabel'),
      value: paymentStatus ? getPaymentStatusLabel(paymentStatus, t) : null,
    },
    {
      label: t('checkoutPage.totalPaidLabel'),
      value:
        totalPaid != null ? formatLocalizedCurrency(totalPaid, i18n.language) : null,
    },
    {
      label: t('checkoutPage.outstandingBalanceLabel'),
      value:
        outstandingBalance != null
          ? formatLocalizedCurrency(outstandingBalance, i18n.language)
          : null,
    },
    {
      label: t('common.finalized'),
      value:
        invoiceFinalized != null ? getBooleanLabel(invoiceFinalized, t) : null,
    },
  ].filter((item) => item.value != null);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
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
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t('reservationDetailsPage.confirmationNumber')}
          </p>
          <p className="mt-4 text-2xl font-black">
            <LtrText>{reservation.confirmationNumber}</LtrText>
          </p>
          <div className="mt-4 flex items-center gap-3">
            <StatusPill status={reservation.status} />
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <DashboardPanel
            title={t('reservationDetailsPage.overviewTitle')}
            description={t('reservationDetailsPage.overviewDescription')}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      {t('common.guest')}
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">{guestName}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">{guestEmail}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <Hotel className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      {t('common.room')}
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">
                      {t('roomNumber', { number: roomNumber })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {translateKnownValue(roomTypeName, t)} | {t('floorNum', { floor })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      {t('reservationDetailsPage.stayWindow')}
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950">
                      {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <Receipt className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      {t('reservationDetailsPage.financials')}
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">
                      {formatLocalizedCurrency(totalPrice, i18n.language)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {paymentStatus
                        ? `${t('checkoutPage.paymentStatusLabel')}: ${getPaymentStatusLabel(paymentStatus, t)}`
                        : t('nightsCount', { count: nights })}
                    </p>
                    {outstandingBalance != null ? (
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {t('checkoutPage.outstandingBalanceLabel')}: {' '}
                        {formatLocalizedCurrency(outstandingBalance, i18n.language)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={t('reservationDetailsPage.actionCenterTitle')}
            description={t('reservationDetailsPage.actionCenterDescription')}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ActionButton
                icon={CreditCard}
                title={t('reservationDetailsPage.checkInTitle')}
                description={t('reservationDetailsPage.checkInDescription')}
                onClick={() =>
                  navigate('/check-in', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canCheckIn(reservation.status)}
              />
              <ActionButton
                icon={ArrowRightLeft}
                title={t('reservationDetailsPage.modifyTitle')}
                description={t('reservationDetailsPage.modifyDescription')}
                onClick={() =>
                  navigate('/reservations/modify', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canModify(reservation.status)}
              />
              <ActionButton
                icon={XCircle}
                title={t('reservationDetailsPage.cancelTitle')}
                description={t('reservationDetailsPage.cancelDescription')}
                onClick={() =>
                  navigate('/reservations/cancel', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canCancel(reservation.status)}
                tone="danger"
              />
              <ActionButton
                icon={Receipt}
                title={t('checkoutTitle')}
                description={t('reservationDetailsPage.checkoutDescription')}
                onClick={() =>
                  navigate('/checkout', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canCheckOut(reservation.status)}
              />
              <ActionButton
                icon={FileText}
                title={t('reservationDetailsPage.invoiceTitle')}
                description={t('reservationDetailsPage.invoiceDescription')}
                onClick={() =>
                  navigate('/invoice-preview', {
                    state: { confirmationNumber: reservation.confirmationNumber },
                  })
                }
              />
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={t('reservationDetailsPage.factsTitle')}
            description={t('reservationDetailsPage.factsDescription')}
            action={<StatusPill status={reservation.status} />}
          >
            <dl className="space-y-4">
              {[
                {
                  label: t('reservationDetailsPage.confirmationNumber'),
                  value: <LtrText>{reservation.confirmationNumber}</LtrText>,
                },
                { label: t('reservationDetailsPage.guestName'), value: guestName },
                { label: t('reservationDetailsPage.guestEmail'), value: guestEmail },
                {
                  label: t('reservationDetailsPage.roomNumber'),
                  value: t('roomNumber', { number: roomNumber }),
                },
                {
                  label: t('reservationDetailsPage.roomType'),
                  value: translateKnownValue(roomTypeName, t),
                },
                {
                  label: t('reservationDetailsPage.nightlyRate'),
                  value: formatLocalizedCurrency(reservation.roomRate, i18n.language),
                },
                { label: t('subtotal'), value: formatLocalizedCurrency(reservation.subtotal, i18n.language) },
                { label: t('taxes10'), value: formatLocalizedCurrency(reservation.taxes, i18n.language) },
                {
                  label: t('reservationDetailsPage.totalPrice'),
                  value: formatLocalizedCurrency(totalPrice, i18n.language),
                },
                ...financialFacts,
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <dt className="text-sm font-medium text-zinc-500">{item.label}</dt>
                  <dd className="text-sm font-bold text-zinc-950">{item.value}</dd>
                </div>
              ))}
            </dl>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
