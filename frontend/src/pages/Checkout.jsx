import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DoorClosed,
  Receipt,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ConfirmationToast from '../components/ConfirmationToast';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useTranslation } from 'react-i18next';
import {
  checkOutReservation,
  extractReservationError,
  getBill,
} from '../services/reservationService';
import {
  normalizeReservationStatusLabel,
  reservationStatusRules,
} from '../domain/reservations/statusRules';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateKnownValue,
} from '../utils/localization';

function BillBreakdown({ bill, t, language }) {
  if (!bill) {
    return (
      <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
        <p className="text-sm font-bold text-zinc-950">{t('checkoutPage.noBillTitle')}</p>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          {t('checkoutPage.noBillDescription')}
        </p>
      </div>
    );
  }

  const rows = [
    {
      label: t('checkoutPage.roomChargeLabel', {
        count: bill.nights ?? 0,
        rate: formatLocalizedCurrency(bill.roomRate, language),
      }),
      value: formatLocalizedCurrency(bill.roomCharge, language),
    },
    {
      label: t('checkoutPage.serviceCharges'),
      value: formatLocalizedCurrency(bill.serviceCharges, language),
      hidden: !Number(bill.serviceCharges),
    },
    {
      label: t('checkoutPage.vatLabel', {
        rate: (Number(bill.vatRate ?? 0) * 100).toFixed(0),
      }),
      value: formatLocalizedCurrency(bill.vatAmount, language),
    },
    {
      label: t('checkoutPage.discounts'),
      value: `-${formatLocalizedCurrency(bill.discountAmount, language)}`,
      hidden: !Number(bill.discountAmount),
      muted: true,
    },
  ].filter((row) => !row.hidden);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <span className={`text-sm font-medium ${row.muted ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {row.label}
          </span>
          <span className="text-sm font-bold text-zinc-950">{row.value}</span>
        </div>
      ))}

      <div className="border-t border-zinc-200 pt-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-zinc-950">{t('checkoutPage.grossBalance')}</span>
          <span className="text-base font-black text-zinc-950">
            {formatLocalizedCurrency(bill.balanceDue, language)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-emerald-700">{t('checkoutPage.totalPaidLabel')}</span>
          <span className="text-sm font-bold text-emerald-700">
            -{formatLocalizedCurrency(bill.totalPaid, language)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-zinc-200 pt-3">
          <span className="text-sm font-bold text-zinc-950">{t('checkoutPage.outstandingBalanceLabel')}</span>
          <span
            className={`text-lg font-black ${
              Number(bill.outstandingBalance ?? bill.balanceDue ?? 0) > 0
                ? 'text-rose-900'
                : 'text-emerald-700'
            }`}
          >
            {formatLocalizedCurrency(bill.outstandingBalance ?? bill.balanceDue, language)}
          </span>
        </div>
      </div>

      {Array.isArray(bill.lineItems) && bill.lineItems.length > 0 && (
        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
            {t('checkoutPage.lineItems')}
          </p>
          <div className="mt-3 space-y-2">
            {bill.lineItems.map((item, index) => {
              const amount = Number(item?.amount ?? 0);
              const credit = Boolean(item?.credit);

              return (
                <div
                  key={`${item?.label ?? 'line'}-${index}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="font-medium text-zinc-600">
                    {item?.label ? translateKnownValue(item.label, t) : t('checkoutPage.lineItemFallback')}
                  </span>
                  <span className="font-bold text-zinc-950">
                    {credit ? `-${formatLocalizedCurrency(amount, language)}` : formatLocalizedCurrency(amount, language)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [toast, setToast] = useState(null);

  const initialQuery = useMemo(
    () => String(location.state?.initialQuery ?? '').trim(),
    [location.state?.initialQuery]
  );

  const fetchBill = useCallback(async (confirmationNumber) => {
    if (!confirmationNumber) return;

    setBillLoading(true);
    setCheckoutError(null);
    try {
      const result = await getBill(confirmationNumber);
      setBill(result);
    } catch (err) {
      setBill(null);
      const message = extractReservationError(err);
      setCheckoutError(message);
      setToast({ message, type: 'error' });
    } finally {
      setBillLoading(false);
    }
  }, []);

  const handleSelect = async (reservation) => {
    setSelected(reservation);
    setBill(null);
    setCheckoutSuccess(false);
    await fetchBill(reservation.confirmationNumber);
  };

  const handleReset = () => {
    setSelected(null);
    setBill(null);
    setCheckoutError(null);
    setCheckoutSuccess(false);
  };

  const handleCheckout = async () => {
    if (!selected?.confirmationNumber || checkoutLoading) return;

    const outstandingBalance = Number(
      bill?.outstandingBalance ?? bill?.balanceDue ?? 0
    );

    if (outstandingBalance > 0) {
      setCheckoutError(
        t('checkoutPage.outstandingError', {
          amount: formatLocalizedCurrency(outstandingBalance, i18n.language),
        })
      );
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      await checkOutReservation(selected.confirmationNumber);
      setCheckoutSuccess(true);
      setToast({
        message: t('checkoutPage.successToast', { name: selected.guestName }),
        type: 'success',
      });
      setSelected((prev) => (prev ? { ...prev, status: 'CHECKED_OUT' } : prev));
    } catch (err) {
      const message = extractReservationError(err);
      setCheckoutError(message);
      setToast({ message, type: 'error' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const outstandingBalance = Number(
    bill?.outstandingBalance ?? bill?.balanceDue ?? 0
  );
  const canCheckOut =
    selected &&
    reservationStatusRules.canCheckOut(selected.status) &&
    !billLoading &&
    outstandingBalance === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <DashboardHero
        eyebrow={t('checkoutPage.heroEyebrow')}
        title={t('checkoutTitle')}
        description={t('checkoutPage.description')}
        meta={[
          t('checkoutPage.billingRequired'),
          selected ? `${t('checkInPage.reservation')}: ${selected.confirmationNumber}` : t('checkInPage.awaitingSelection'),
          checkoutSuccess ? t('checkoutPage.departureCompleted') : t('checkoutPage.openWorkflow'),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            {t('checkoutPage.gateTitle')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('checkoutPage.outstanding')}
              </p>
              <p className="mt-2 text-lg font-black">
                {bill ? formatLocalizedCurrency(outstandingBalance, i18n.language) : t('checkoutPage.noBill')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('checkoutPage.status')}
              </p>
              <p className="mt-2 text-lg font-black">
                {selected ? getReservationStatusLabel(selected.status, t) : t('common.pending')}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel initialQuery={initialQuery} onSelect={handleSelect} />

        {!selected ? (
          <DashboardPanel
            title={t('checkoutPage.selectTitle')}
            description={t('checkoutPage.selectDescription')}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {t('checkoutPage.tips', { returnObjects: true }).map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </DashboardPanel>
        ) : (
          <div className="space-y-6">
            <DashboardPanel
              title={t('checkoutPage.summaryTitle')}
              description={t('checkoutPage.summaryDescription')}
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('common.guest')}
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {selected.guestEmail || t('common.noGuestEmailProvided')}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('checkInPage.confirmation')}
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('common.stay')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {formatLocalizedDate(selected.checkInDate, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {formatLocalizedDate(selected.checkOutDate, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {t('roomNumber', { number: selected.roomNumber })} | {translateKnownValue(selected.roomTypeName, t)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('checkoutPage.outstandingBalanceLabel')}
                  </p>
                  <p
                    className={`mt-2 text-lg font-black ${
                      outstandingBalance > 0 ? 'text-rose-900' : 'text-emerald-700'
                    }`}
                  >
                    {bill ? formatLocalizedCurrency(outstandingBalance, i18n.language) : t('loadingMessage')}
                  </p>
                </div>
              </div>

              {!reservationStatusRules.canCheckOut(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  {t('checkoutPage.statusBlocked', {
                    status: getReservationStatusLabel(selected.status, t) || normalizeReservationStatusLabel(selected.status),
                  })}
                </div>
              )}

              {reservationStatusRules.canCheckOut(selected.status) &&
                outstandingBalance > 0 && (
                  <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                    {t('checkoutPage.outstandingBlocked')}
                  </div>
                )}

              {checkoutSuccess && (
                <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  {t('checkoutPage.successBanner')}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title={t('checkoutPage.finalBillTitle')}
              description={t('checkoutPage.finalBillDescription')}
              action={
                billLoading ? (
                  <span className="text-sm font-medium text-zinc-500">{t('checkoutPage.loadingBill')}</span>
                ) : null
              }
            >
              <BillBreakdown bill={bill} t={t} language={i18n.language} />

              {checkoutError && (
                <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  {checkoutError}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title={t('checkoutPage.controlsTitle')}
              description={t('checkoutPage.controlsDescription')}
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: Receipt,
                    title: t('checkoutPage.billReviewTitle'),
                    description: t('checkoutPage.billReviewDescription'),
                  },
                  {
                    icon: AlertTriangle,
                    title: t('checkoutPage.balanceGuardTitle'),
                    description: t('checkoutPage.balanceGuardDescription'),
                  },
                  {
                    icon: DoorClosed,
                    title: t('checkoutPage.departureTitle'),
                    description: t('checkoutPage.departureDescription'),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-3 text-sm font-bold text-zinc-950">{item.title}</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={checkoutLoading}
                  className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-6 py-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  {t('checkoutPage.resetWorkflow')}
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckOut || checkoutLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  {checkoutLoading ? (
                    t('checkoutPage.processing')
                  ) : checkoutSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {t('checkoutPage.complete')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      {t('checkoutPage.action')}
                    </>
                  )}
                </button>
              </div>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
