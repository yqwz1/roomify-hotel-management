import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DoorClosed,
  Receipt,
  Wallet,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmationToast from '../components/ConfirmationToast';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SuccessState from '../components/common/SuccessState';
import ModalFrame from '../components/common/ModalFrame';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import { Button } from '../components/ui/button';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import {
  normalizeReservationStatusLabel,
  reservationStatusRules,
} from '../domain/reservations/statusRules';
import { createPayment, extractPaymentError } from '../services/paymentService';
import {
  checkOutReservation,
  extractReservationError,
  getBill,
} from '../services/reservationService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateTime,
  getPaymentStatusLabel,
  getReservationStatusLabel,
  translateBillLineItemLabel,
  translateKnownValue,
} from '../utils/localization';

const PAYMENT_STATUS_STYLES = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  PARTIALLY_PAID: 'border-amber-200 bg-amber-50 text-amber-900',
  PAYMENT_PENDING: 'border-amber-200 bg-amber-50 text-amber-900',
  UNPAID: 'border-rose-200 bg-rose-50 text-rose-900',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-900',
};

const PAYMENT_METHODS = ['CASH', 'CARD', 'ONLINE'];
const PAYMENT_BLOCKING_STATUSES = new Set(['UNPAID', 'PARTIALLY_PAID', 'FAILED', 'PAYMENT_PENDING']);

const normalizePaymentStatus = (status) => String(status ?? '').trim().toUpperCase();
const humanizePaymentMethod = (method) =>
  String(method ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

function PaymentStatusBadge({ status, t }) {
  const normalized = normalizePaymentStatus(status);
  const tone = PAYMENT_STATUS_STYLES[normalized] ?? 'border-zinc-200 bg-zinc-50 text-zinc-600';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${tone}`}
      data-testid="payment-status"
    >
      {getPaymentStatusLabel(normalized || 'PAYMENT_PENDING', t)}
    </span>
  );
}

function BillBreakdown({ bill, t, language }) {
  const paymentStatus = normalizePaymentStatus(bill.paymentStatus);
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
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
            {t('checkoutPage.paymentStatusLabel')}
          </p>
          <div className="mt-3">
            <PaymentStatusBadge status={paymentStatus} t={t} />
          </div>
        </div>
        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
            {t('common.finalized')}
          </p>
          <p className="mt-3 text-sm font-bold text-zinc-950">
            {bill.invoiceFinalized ? t('common.yes') : t('common.no')}
          </p>
        </div>
      </div>

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
                Number(bill.outstandingBalance ?? bill.balanceDue ?? 0) > 0 ? 'text-rose-900' : 'text-emerald-700'
              }`}
            >
              {formatLocalizedCurrency(bill.outstandingBalance ?? bill.balanceDue, language)}
            </span>
          </div>
        </div>

        {Array.isArray(bill.lineItems) && bill.lineItems.length > 0 ? (
          <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
              {t('checkoutPage.lineItems')}
            </p>
            <div className="mt-3 space-y-2">
              {bill.lineItems.map((item, index) => {
                const amount = Number(item?.amount ?? 0);
                const credit = Boolean(item?.credit);

                return (
                  <div key={`${item?.label ?? 'line'}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-zinc-600">
                      {item?.label ? translateBillLineItemLabel(item.label, t) : t('checkoutPage.lineItemFallback')}
                    </span>
                    <span className="font-bold text-zinc-950">
                      {credit ? `-${formatLocalizedCurrency(amount, language)}` : formatLocalizedCurrency(amount, language)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PaymentReceiptCard({ payment, t, language }) {
  return (
    <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5" data-testid="payment-receipt">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {t('checkoutPage.receiptTitle')}
          </p>
          <p className="mt-2 text-lg font-black text-emerald-950">
            {formatLocalizedCurrency(payment.amount, language)}
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-900/80">
            {payment.message || t('checkoutPage.paymentRecorded')}
          </p>
        </div>
        <PaymentStatusBadge status={payment.paymentStatus} t={t} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {t('checkoutPage.receiptMethod')}
          </p>
          <p className="mt-2 text-sm font-bold text-emerald-950">{humanizePaymentMethod(payment.paymentMethod)}</p>
        </div>
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {t('checkoutPage.receiptRemaining')}
          </p>
          <p className="mt-2 text-sm font-bold text-emerald-950">
            {formatLocalizedCurrency(payment.remainingBalance, language)}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {t('checkoutPage.receiptTotalPaid')}
          </p>
          <p className="mt-2 text-sm font-bold text-emerald-950">
            {formatLocalizedCurrency(payment.totalPaid, language)}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {t('checkoutPage.receiptCapturedAt')}
          </p>
          <p className="mt-2 text-sm font-bold text-emerald-950">
            {formatLocalizedDateTime(payment.createdAt, language, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      {payment.gatewayReference ? (
        <div className="mt-4 rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {t('checkoutPage.receiptReference')}
          </p>
          <p className="mt-2 text-sm font-bold text-emerald-950">
            <LtrText>{payment.gatewayReference}</LtrText>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PaymentDialog({ outstandingBalance, language, t, onClose, onSubmit, submitting }) {
  const [amount, setAmount] = useState(String(Number(outstandingBalance ?? 0).toFixed(2)));
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const numericAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(numericAmount)) {
      setFormError(t('checkoutPage.paymentAmountRequired'));
      return;
    }
    if (numericAmount <= 0) {
      setFormError(t('checkoutPage.paymentAmountPositive'));
      return;
    }
    if (numericAmount > Number(outstandingBalance ?? 0)) {
      setFormError(
        t('checkoutPage.paymentAmountExceeded', {
          amount: formatLocalizedCurrency(outstandingBalance, language),
        })
      );
      return;
    }

    const result = await onSubmit({
      amount: numericAmount.toFixed(2),
      paymentMethod,
    });

    if (result.success) {
      onClose();
      return;
    }

    setFormError(result.error);
  };

  return (
    <ModalFrame
      title={t('checkoutPage.paymentModalTitle')}
      description={t('checkoutPage.paymentModalDescription')}
      onClose={onClose}
      closeLabel={t('closeDialog')}
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('checkoutPage.outstandingBalanceLabel')}
          </p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {formatLocalizedCurrency(outstandingBalance, language)}
          </p>
        </div>

        {formError ? (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {formError}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {t('checkoutPage.paymentAmountLabel')}
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {t('checkoutPage.paymentMethodLabel')}
            </span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {humanizePaymentMethod(method)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
          {t('checkoutPage.paymentModalNote')}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="h-12 border-zinc-200">
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={submitting} className="h-12 bg-zinc-950 text-white hover:bg-zinc-800">
            {submitting ? t('checkoutPage.paymentSubmitting') : t('checkoutPage.paymentSubmit')}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  const initialQuery = useMemo(
    () => String(location.state?.initialQuery ?? '').trim(),
    [location.state?.initialQuery]
  );

  const fetchBill = useCallback(async (confirmationNumber) => {
    if (!confirmationNumber) return;

    setBillLoading(true);
    setBill(null);
    setBillError(null);
    setCheckoutError(null);
    try {
      const result = await getBill(confirmationNumber);
      setBill(result);
    } catch (err) {
      const message = extractReservationError(err);
      setBillError(message);
      setToast({ message, type: 'error' });
    } finally {
      setBillLoading(false);
    }
  }, []);

  const handleSelect = async (reservation) => {
    setSelected(reservation);
    setCheckoutSuccess(false);
    setCheckoutError(null);
    setPaymentModalOpen(false);
    setPaymentError(null);
    setPaymentReceipt(null);
    await fetchBill(reservation.confirmationNumber);
  };

  const handleReset = () => {
    setSelected(null);
    setBill(null);
    setBillError(null);
    setCheckoutError(null);
    setCheckoutSuccess(false);
    setPaymentModalOpen(false);
    setPaymentError(null);
    setPaymentReceipt(null);
  };

  const handleRetryBill = useCallback(async () => {
    if (!selected?.confirmationNumber || billLoading) return;
    await fetchBill(selected.confirmationNumber);
  }, [billLoading, fetchBill, selected?.confirmationNumber]);

  const outstandingBalance = Number(bill?.outstandingBalance ?? bill?.balanceDue ?? 0);
  const paymentStatus = normalizePaymentStatus(bill?.paymentStatus);
  const reservationCanCheckout = selected ? reservationStatusRules.canCheckOut(selected.status) : false;

  const blockingMessage = useMemo(() => {
    if (!selected) return null;

    if (!reservationCanCheckout) {
      return t('checkoutPage.statusBlocked', {
        status:
          getReservationStatusLabel(selected.status, t) ||
          normalizeReservationStatusLabel(selected.status),
      });
    }

    if (billLoading) return null;
    if (billError) return t('checkoutPage.billLoadFailed');
    if (!bill) return t('checkoutPage.billRequiredBlocked');
    if (!bill.invoiceFinalized) return t('checkoutPage.invoiceNotFinalizedBlocked');
    if (paymentStatus === 'FAILED') return t('checkoutPage.paymentFailedBlocked');
    if (outstandingBalance > 0) {
      return t('checkoutPage.outstandingError', {
        amount: formatLocalizedCurrency(outstandingBalance, i18n.language),
      });
    }
    if (PAYMENT_BLOCKING_STATUSES.has(paymentStatus)) {
      return t('checkoutPage.paymentPendingBlocked');
    }

    return null;
  }, [
    bill,
    billError,
    billLoading,
    i18n.language,
    outstandingBalance,
    paymentStatus,
    reservationCanCheckout,
    selected,
    t,
  ]);

  const canCheckOut = Boolean(selected && bill && !billLoading && !checkoutLoading && !blockingMessage);
  const canRecordPayment = Boolean(
    selected &&
      bill &&
      !billLoading &&
      !billError &&
      selected.status === 'CHECKED_IN' &&
      outstandingBalance > 0 &&
      !checkoutSuccess
  );

  const handlePaymentSubmit = async ({ amount, paymentMethod }) => {
    if (!selected?.confirmationNumber || paymentLoading) {
      return { success: false, error: t('checkoutPage.paymentUnavailable') };
    }

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const result = await createPayment({
        confirmationNumber: selected.confirmationNumber,
        amount,
        paymentMethod,
      });

      setPaymentReceipt(result);
      await fetchBill(selected.confirmationNumber);
      setToast({
        message: t('checkoutPage.paymentSuccessToast', {
          amount: formatLocalizedCurrency(result.amount, i18n.language),
        }),
        type: 'success',
      });

      return { success: true };
    } catch (err) {
      const message = extractPaymentError(err);
      setPaymentError(message);
      return { success: false, error: message };
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selected?.confirmationNumber || checkoutLoading) return;

    if (blockingMessage) {
      setCheckoutError(blockingMessage);
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {paymentModalOpen ? (
        <PaymentDialog
          outstandingBalance={outstandingBalance}
          language={i18n.language}
          t={t}
          onClose={() => setPaymentModalOpen(false)}
          onSubmit={handlePaymentSubmit}
          submitting={paymentLoading}
        />
      ) : null}

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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t('checkoutPage.gateTitle')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('checkoutPage.outstanding')}
              </p>
              <p className="mt-2 text-lg font-black">
                {bill ? formatLocalizedCurrency(outstandingBalance, i18n.language) : t('checkoutPage.noBill')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
          <DashboardPanel title={t('checkoutPage.selectTitle')} description={t('checkoutPage.selectDescription')}>
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
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('common.guest')}</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {selected.guestEmail || t('common.noGuestEmailProvided')}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('checkInPage.confirmation')}</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('common.stay')}</p>
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
                  <p className={`mt-2 text-lg font-black ${outstandingBalance > 0 ? 'text-rose-900' : 'text-emerald-700'}`}>
                    {bill
                      ? formatLocalizedCurrency(outstandingBalance, i18n.language)
                      : billLoading
                        ? t('checkoutPage.loadingBill')
                        : t('common.notLoaded')}
                  </p>
                </div>
              </div>

              {!checkoutSuccess && blockingMessage ? (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  {blockingMessage}
                </div>
              ) : null}

              {checkoutSuccess ? (
                <div className="mt-4">
                  <SuccessState
                    title={t('checkoutPage.complete')}
                    message={t('checkoutPage.successBanner')}
                  />
                </div>
              ) : null}
            </DashboardPanel>

            <DashboardPanel
              title={t('checkoutPage.finalBillTitle')}
              description={t('checkoutPage.finalBillDescription')}
              action={
                bill ? (
                  <PaymentStatusBadge status={paymentStatus} t={t} />
                ) : billLoading ? (
                  <span className="text-sm font-medium text-zinc-500">{t('checkoutPage.loadingBill')}</span>
                ) : null
              }
            >
              {billLoading ? (
                <LoadingState message={t('checkoutPage.loadingBill')} />
              ) : billError ? (
                <ErrorState title={t('checkoutPage.billLoadFailed')} message={billError} onRetry={handleRetryBill} />
              ) : !bill ? (
                <EmptyState title={t('checkoutPage.noBillTitle')} message={t('checkoutPage.noBillDescription')} />
              ) : (
                <BillBreakdown bill={bill} t={t} language={i18n.language} />
              )}
            </DashboardPanel>

            <DashboardPanel
              title={t('checkoutPage.paymentPanelTitle')}
              description={t('checkoutPage.paymentPanelDescription')}
            >
              {billLoading ? (
                <LoadingState message={t('checkoutPage.paymentPreparing')} />
              ) : billError ? (
                <ErrorState title={t('checkoutPage.billLoadFailed')} message={billError} onRetry={handleRetryBill} />
              ) : !bill ? (
                <EmptyState
                  title={t('checkoutPage.paymentEmptyTitle')}
                  message={t('checkoutPage.paymentEmptyDescription')}
                  icon={Wallet}
                />
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('checkoutPage.paymentPanelOutstanding')}
                      </p>
                      <p className="mt-2 text-lg font-black text-zinc-950">
                        {formatLocalizedCurrency(outstandingBalance, i18n.language)}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('checkoutPage.paymentStatusLabel')}
                      </p>
                      <div className="mt-3">
                        <PaymentStatusBadge status={paymentStatus} t={t} />
                      </div>
                    </div>
                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('common.finalized')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {bill.invoiceFinalized ? t('common.yes') : t('common.no')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-zinc-500">
                      {outstandingBalance > 0 ? t('checkoutPage.paymentPanelHint') : t('checkoutPage.paymentSettledHint')}
                    </p>
                    <Button
                      type="button"
                      onClick={() => setPaymentModalOpen(true)}
                      disabled={!canRecordPayment || paymentLoading}
                      className="h-12 bg-zinc-950 text-white hover:bg-zinc-800"
                    >
                      <Wallet className="h-4 w-4" />
                      {t('checkoutPage.openPaymentModal')}
                    </Button>
                  </div>

                  {paymentError ? (
                    <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                      {paymentError}
                    </div>
                  ) : null}

                  {paymentReceipt ? (
                    <PaymentReceiptCard payment={paymentReceipt} t={t} language={i18n.language} />
                  ) : (
                    <EmptyState
                      title={t('checkoutPage.receiptEmptyTitle')}
                      message={t('checkoutPage.receiptEmptyDescription')}
                      icon={Receipt}
                    />
                  )}
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
                    <div key={item.title} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
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

              {checkoutError ? (
                <div className="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  {checkoutError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={checkoutLoading}
                  className="h-14 w-full border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  {t('checkoutPage.resetWorkflow')}
                </Button>
                <Button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckOut || checkoutLoading}
                  className="h-14 w-full bg-zinc-950 text-sm font-bold text-white hover:bg-zinc-800"
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
                </Button>
              </div>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
