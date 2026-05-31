import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DoorClosed,
  Receipt,
  Wallet,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { readReservationLookupNavigationState } from '../utils/reservationLookup';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateTime,
  getPaymentStatusLabel,
  getRoomStatusLabel,
  getReservationStatusLabel,
  translateBillLineItemLabel,
  translateKnownValue,
} from '../utils/localization';
import { getStatusBadgeClasses } from '../utils/statusPresentation';

import { NativeSelect } from "@/components/ui/native-select";
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
  const tone = getStatusBadgeClasses(normalized);

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
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
            {t('checkoutPage.paymentStatusLabel')}
          </p>
          <div className="mt-3">
            <PaymentStatusBadge status={paymentStatus} t={t} />
          </div>
        </div>
        <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
            {t('common.finalized')}
          </p>
          <p className="mt-3 text-sm font-bold text-brand-ink break-words">
            {bill.invoiceFinalized ? t('common.yes') : t('common.no')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 items-center justify-between gap-4">
            <span className={`text-sm font-medium ${row.muted ? 'text-brand-ink-hint' : 'text-brand-ink-muted'}`}>
              {row.label}
            </span>
            <span className="text-sm font-bold text-brand-ink break-words">{row.value}</span>
          </div>
        ))}

        <div className="border-t border-brand-surface-border pt-3">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <span className="text-sm font-bold text-brand-ink break-words">{t('checkoutPage.grossBalance')}</span>
            <span className="text-base font-black text-brand-ink break-words">
              {formatLocalizedCurrency(bill.balanceDue, language)}
            </span>
          </div>
          <div className="mt-2 flex min-w-0 items-center justify-between gap-4">
            <span className="text-sm font-medium text-brand-success break-words">{t('checkoutPage.totalPaidLabel')}</span>
            <span className="text-sm font-bold text-brand-success break-words">
              -{formatLocalizedCurrency(bill.totalPaid, language)}
            </span>
          </div>
          <div className="mt-3 flex min-w-0 items-center justify-between gap-4 border-t border-brand-surface-border pt-3">
            <span className="text-sm font-bold text-brand-ink break-words">{t('checkoutPage.outstandingBalanceLabel')}</span>
            <span
              className={`text-lg font-black ${
                Number(bill.outstandingBalance ?? bill.balanceDue ?? 0) > 0 ? 'text-brand-danger' : 'text-brand-success'
              }`}
            >
              {formatLocalizedCurrency(bill.outstandingBalance ?? bill.balanceDue, language)}
            </span>
          </div>
        </div>

        {Array.isArray(bill.lineItems) && bill.lineItems.length > 0 ? (
          <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
              {t('checkoutPage.lineItems')}
            </p>
            <div className="mt-3 space-y-2">
              {bill.lineItems.map((item, index) => {
                const amount = Number(item?.amount ?? 0);
                const credit = Boolean(item?.credit);

                return (
                  <div key={`${item?.label ?? 'line'}-${index}`} className="flex min-w-0 items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-brand-ink-muted break-words">
                      {item?.label ? translateBillLineItemLabel(item.label, t) : t('checkoutPage.lineItemFallback')}
                    </span>
                    <span className="font-bold text-brand-ink break-words">
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
    <div className="rounded-[1.4rem] border border-brand-success/30 bg-brand-success/10 p-5" data-testid="payment-receipt">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
            {t('checkoutPage.receiptTitle')}
          </p>
          <p className="mt-2 text-lg font-black text-brand-ink break-words">
            {formatLocalizedCurrency(payment.amount, language)}
          </p>
          <p className="mt-1 text-sm font-medium text-brand-success/80 break-words">
            {payment.message || t('checkoutPage.paymentRecorded')}
          </p>
        </div>
        <PaymentStatusBadge status={payment.paymentStatus} t={t} />
      </div>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
            {t('checkoutPage.receiptMethod')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">{humanizePaymentMethod(payment.paymentMethod)}</p>
        </div>
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
            {t('checkoutPage.receiptRemaining')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">
            {formatLocalizedCurrency(payment.remainingBalance, language)}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
            {t('checkoutPage.receiptTotalPaid')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">
            {formatLocalizedCurrency(payment.totalPaid, language)}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
            {t('checkoutPage.receiptCapturedAt')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">
            {formatLocalizedDateTime(payment.createdAt, language, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      {payment.gatewayReference ? (
        <div className="mt-4 rounded-[1.15rem] border border-white/70 bg-white/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
            {t('checkoutPage.receiptReference')}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-ink break-words">
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
        <div className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {t('checkoutPage.outstandingBalanceLabel')}
          </p>
          <p className="mt-2 text-2xl font-black text-brand-ink break-words">
            {formatLocalizedCurrency(outstandingBalance, language)}
          </p>
        </div>

        {formError ? (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {formError}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {t('checkoutPage.paymentAmountLabel')}
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {t('checkoutPage.paymentMethodLabel')}
            </span>
            <NativeSelect
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {humanizePaymentMethod(method)}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>

        <div className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink-muted">
          {t('checkoutPage.paymentModalNote')}
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="h-12 border-brand-surface-border bg-white text-brand-ink hover:bg-brand-surface-light">
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={submitting} className="h-12 bg-brand-primary text-white hover:bg-brand-primary-deep">
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
  const {
    initialFilters,
    initialQuery,
    workflowIntent,
    initialReservation,
  } = readReservationLookupNavigationState(location.state);
  const navigate = useNavigate();
  const paymentFirstMode = workflowIntent === 'payment';
  const [selected, setSelected] = useState(initialReservation);
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

  useEffect(() => {
    if (!initialReservation?.confirmationNumber) {
      return;
    }

    setSelected(initialReservation);
    setCheckoutSuccess(false);
    setCheckoutError(null);
    setPaymentModalOpen(false);
    setPaymentError(null);
    setPaymentReceipt(null);
    void fetchBill(initialReservation.confirmationNumber);
  }, [fetchBill, initialReservation]);

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
      reservationStatusRules.canCollectPayment(selected.status) &&
      outstandingBalance > 0 &&
      !checkoutSuccess
  );
  const pageTitle = paymentFirstMode ? t('checkoutPage.paymentTitle') : t('checkoutTitle');
  const pageEyebrow = paymentFirstMode
    ? t('checkoutPage.paymentHeroEyebrow')
    : t('checkoutPage.heroEyebrow');
  const pageDescription = paymentFirstMode
    ? t('checkoutPage.paymentDescription')
    : t('checkoutPage.description');
  const workflowMeta = checkoutSuccess
    ? t('checkoutPage.departureCompleted')
    : paymentFirstMode
      ? paymentReceipt
        ? t('checkoutPage.paymentCaptured')
        : t('checkoutPage.paymentOpenWorkflow')
      : t('checkoutPage.openWorkflow');
  const gateTitle = paymentFirstMode
    ? t('checkoutPage.paymentGateTitle')
    : t('checkoutPage.gateTitle');
  const selectDescription = paymentFirstMode
    ? t('checkoutPage.paymentSelectDescription')
    : t('checkoutPage.selectDescription');
  const selectionTips = paymentFirstMode
    ? t('checkoutPage.paymentTips', { returnObjects: true })
    : t('checkoutPage.tips', { returnObjects: true });
  const summaryTitle = paymentFirstMode
    ? t('checkoutPage.paymentSummaryTitle')
    : t('checkoutPage.summaryTitle');
  const summaryDescription = paymentFirstMode
    ? t('checkoutPage.paymentSummaryDescription')
    : t('checkoutPage.summaryDescription');
  const finalBillDescription = paymentFirstMode
    ? t('checkoutPage.paymentBillDescription')
    : t('checkoutPage.finalBillDescription');
  const controlsTitle = paymentFirstMode
    ? t('checkoutPage.paymentModeControlsTitle')
    : t('checkoutPage.controlsTitle');
  const controlsDescription = paymentFirstMode
    ? t('checkoutPage.paymentModeControlsDescription')
    : t('checkoutPage.controlsDescription');

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
    <div className="roomify-page-enter mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
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
        eyebrow={pageEyebrow}
        title={pageTitle}
        description={pageDescription}
        meta={[
          t('checkoutPage.billingRequired'),
          selected ? `${t('checkInPage.reservation')}: ${selected.confirmationNumber}` : t('checkInPage.awaitingSelection'),
          workflowMeta,
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {gateTitle}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('checkoutPage.outstanding')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {bill ? formatLocalizedCurrency(outstandingBalance, i18n.language) : t('checkoutPage.noBill')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('checkoutPage.status')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {selected ? getReservationStatusLabel(selected.status, t) : t('common.pending')}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel
          initialFilters={initialFilters}
          initialQuery={initialQuery}
          onSelect={handleSelect}
        />

        {!selected ? (
          <DashboardPanel title={t('checkoutPage.selectTitle')} description={selectDescription}>
            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              {selectionTips.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4 text-sm font-medium leading-6 text-brand-ink-muted"
                >
                  {item}
                </div>
              ))}
            </div>
          </DashboardPanel>
        ) : (
          <div className="space-y-6">
            <DashboardPanel
              title={summaryTitle}
              description={summaryDescription}
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('common.guest')}</p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">{selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                    {selected.guestEmail || t('common.noGuestEmailProvided')}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('checkInPage.confirmation')}</p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('common.stay')}</p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
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
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                    {t('roomNumber', { number: selected.roomNumber })} | {translateKnownValue(selected.roomTypeName, t)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                    {t('checkoutPage.outstandingBalanceLabel')}
                  </p>
                  <p className={`mt-2 text-lg font-black ${outstandingBalance > 0 ? 'text-brand-danger' : 'text-brand-success'}`}>
                    {bill
                      ? formatLocalizedCurrency(outstandingBalance, i18n.language)
                      : billLoading
                        ? t('checkoutPage.loadingBill')
                        : t('common.notLoaded')}
                  </p>
                </div>
              </div>

              {!checkoutSuccess && blockingMessage ? (
                <div className="mt-4 rounded-[1.25rem] border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-medium text-brand-warning">
                  {blockingMessage}
                </div>
              ) : null}

              {checkoutSuccess ? (
                <div className="mt-4">
                  <SuccessState
                    title={t('checkoutPage.complete')}
                    message={t('checkoutPage.successBanner')}
                  />
                  {selected ? (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-[1.35rem] border border-brand-success/30 bg-brand-success/10 p-4">
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-success break-words">
                              {t('checkoutPage.roomStatusTitle')}
                            </p>
                            <p className="mt-2 text-sm font-medium text-brand-success break-words">
                              {t('checkoutPage.roomStatusDescription', {
                                roomNumber: selected.roomNumber,
                                status: getRoomStatusLabel('NEEDS_CLEANING', t),
                              })}
                            </p>
                          </div>
                          <span className="inline-flex min-w-0 items-center rounded-full border border-brand-success/30 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
                            {getRoomStatusLabel('NEEDS_CLEANING', t)}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-muted break-words">
                              {t('checkoutPage.nextStepTitle')}
                            </p>
                            <p className="mt-2 text-sm font-medium text-brand-ink break-words">
                              {t('checkoutPage.nextStepDescription')}
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={() =>
                              navigate('/invoice-preview', {
                                state: { confirmationNumber: selected.confirmationNumber },
                              })
                            }
                            className="h-12 bg-brand-primary text-sm font-bold text-white hover:bg-brand-primary-deep"
                          >
                            <Receipt className="h-4 w-4 shrink-0" />
                            {t('checkoutPage.openInvoicePreview')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </DashboardPanel>

            <DashboardPanel
              title={t('checkoutPage.finalBillTitle')}
              description={finalBillDescription}
              action={
                bill ? (
                  <PaymentStatusBadge status={paymentStatus} t={t} />
                ) : billLoading ? (
                  <span className="text-sm font-medium text-brand-ink-muted break-words">{t('checkoutPage.loadingBill')}</span>
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
                  <div className="grid min-w-0 gap-4 md:grid-cols-3">
                    <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                        {t('checkoutPage.paymentPanelOutstanding')}
                      </p>
                      <p className="mt-2 text-lg font-black text-brand-ink break-words">
                        {formatLocalizedCurrency(outstandingBalance, i18n.language)}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                        {t('checkoutPage.paymentStatusLabel')}
                      </p>
                      <div className="mt-3">
                        <PaymentStatusBadge status={paymentStatus} t={t} />
                      </div>
                    </div>
                    <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                        {t('common.finalized')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                        {bill.invoiceFinalized ? t('common.yes') : t('common.no')}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-brand-ink-muted break-words">
                      {outstandingBalance > 0 ? t('checkoutPage.paymentPanelHint') : t('checkoutPage.paymentSettledHint')}
                    </p>
                    <Button
                      type="button"
                      onClick={() => setPaymentModalOpen(true)}
                      disabled={!canRecordPayment || paymentLoading}
                      className="h-12 bg-brand-primary text-white hover:bg-brand-primary-deep"
                    >
                      <Wallet className="h-4 w-4 shrink-0" />
                      {t('checkoutPage.openPaymentModal')}
                    </Button>
                  </div>

                  {paymentError ? (
                    <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
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
              title={controlsTitle}
              description={controlsDescription}
            >
              <div className="grid min-w-0 gap-3 md:grid-cols-3">
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
                    <div key={item.title} className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                      <span className="flex min-w-0 h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-ink shadow-sm break-words">
                        <Icon className="h-4 w-4 shrink-0" />
                      </span>
                      <p className="mt-3 text-sm font-bold text-brand-ink break-words">{item.title}</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted break-words">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {checkoutError ? (
                <div className="mt-5 rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
                  {checkoutError}
                </div>
              ) : null}

              <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={checkoutLoading}
                  className="h-14 w-full border-brand-surface-border text-sm font-bold text-brand-ink hover:bg-brand-surface-light"
                >
                  {t('checkoutPage.resetWorkflow')}
                </Button>
                <Button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckOut || checkoutLoading}
                  className="h-14 w-full bg-brand-primary text-sm font-bold text-white hover:bg-brand-primary-deep"
                >
                  {checkoutLoading ? (
                    t('checkoutPage.processing')
                  ) : checkoutSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {t('checkoutPage.complete')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 shrink-0" />
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
