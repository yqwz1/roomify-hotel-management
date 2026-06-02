import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreditCard, Printer, RotateCcw, ShieldCheck } from 'lucide-react';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { getGuestReservations } from '../services/guestReservationService';
import { extractPaymentError, payGuestReservation } from '../services/paymentService';
import { formatLocalizedCurrency, formatLocalizedDate } from '../utils/localization';
import { useTranslation } from 'react-i18next';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

function ReceiptView({ payment, reservation, language, onRetry }) {
  const dateTime = payment?.paidAt || payment?.createdAt;

  return (
    <div className="motion-status-success rounded-[1.5rem] border border-brand-surface-border bg-white p-5 print:border-0 print:p-0">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-brand-surface-border pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
            Demo Payment Gateway
          </p>
          <h2 className="mt-2 text-2xl font-black text-brand-ink break-words">Roomify Payment Receipt</h2>
        </div>
        <span className="rounded-full bg-brand-success/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
          {payment?.paymentStatus}
        </span>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
        {[
          ['Reservation ID', payment?.reservationId || reservation?.id],
          ['Invoice ID', payment?.invoiceNumber || reservation?.invoiceNumber || 'Pending'],
          ['Transaction ID', payment?.gatewayReference],
          ['Guest name', payment?.guestName],
          ['Room', [payment?.roomNumber, payment?.roomType].filter(Boolean).join(' - ')],
          ['Check-in', formatLocalizedDate(reservation?.checkInDate, language, { dateStyle: 'medium' })],
          ['Check-out', formatLocalizedDate(reservation?.checkOutDate, language, { dateStyle: 'medium' })],
          ['Amount', `${formatLocalizedCurrency(payment?.amount ?? reservation?.outstandingBalance ?? 0, language)} SAR`],
          ['Payment method', payment?.paymentMethod],
          ['Last four digits', payment?.lastFourDigits ? `**** ${payment.lastFourDigits}` : '-'],
          ['Status', payment?.paymentStatus],
          ['Date/time', dateTime ? new Date(dateTime).toLocaleString() : '-'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-brand-surface-border bg-brand-surface-light px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">{label}</p>
            <p className="mt-2 break-words text-sm font-bold text-brand-ink">{value || '-'}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row print:hidden">
        <Button variant="unstyled" size="none"
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white"
        >
          <Printer className="h-4 w-4 shrink-0" />
          Print Receipt
        </Button>
        <Button variant="unstyled" size="none"
          type="button"
          onClick={onRetry}
          className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-surface-border bg-white px-5 py-3 text-sm font-bold text-brand-ink"
        >
          Back to My Reservations
        </Button>
      </div>
    </div>
  );
}

export default function DemoPaymentGateway() {
  const { confirmationNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState(location.state?.payment ?? null);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = await getGuestReservations();
        if (active) setReservations(data);
      } catch (err) {
        if (active) setLoadError(err?.message || 'Unable to load reservation.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const reservation = useMemo(() => {
    const fromState = location.state?.reservation;
    if (fromState?.confirmationNumber === confirmationNumber || fromState?.confirmation === confirmationNumber) {
      return fromState;
    }
    return reservations.find((item) => item.confirmationNumber === confirmationNumber || item.confirmation === confirmationNumber);
  }, [confirmationNumber, location.state?.reservation, reservations]);

  const payableAmount = Number(reservation?.outstandingBalance ?? reservation?.totalPrice ?? 0);
  const isPaid = payment?.paymentStatus === 'PAID';
  const isFailed = payment?.paymentStatus === 'FAILED';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPaymentError('');
    setSubmitting(true);
    try {
      const response = await payGuestReservation(confirmationNumber, {
        paymentMethod: 'CREDIT_CARD_DEMO',
        cardNumber,
        cardholderName,
      });
      setPayment(response);
      if (response.paymentStatus === 'FAILED') {
        setPaymentError(response.failureReason || response.message || 'Demo payment failed.');
      }
    } catch (err) {
      setPaymentError(extractPaymentError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading Demo Payment Gateway..." />;
  if (loadError) return <ErrorState title="Demo Payment Gateway" message={loadError} onRetry={() => navigate(0)} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="motion-slide-up rounded-[1.5rem] border border-brand-primary/20 bg-white p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-primary break-words">Demo Payment Gateway</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-ink break-words">Complete mock payment</h1>
          </div>
          <ShieldCheck className="h-10 w-10 text-brand-primary shrink-0" />
        </div>
      </div>

      {isPaid ? (
        <ReceiptView
          payment={payment}
          reservation={reservation}
          language={i18n.language}
          onRetry={() => navigate('/guest/dashboard')}
        />
      ) : (
        <DashboardPanel
          title="Mock checkout"
          description="Use the provided demo card numbers. This form never sends data to an external payment provider."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              <div className="motion-card-lift rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">Reservation</p>
                <p className="mt-2 text-sm font-bold text-brand-ink break-words">{confirmationNumber}</p>
              </div>
              <div className="motion-card-lift rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">Amount</p>
                <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                  {formatLocalizedCurrency(payableAmount, i18n.language)} SAR
                </p>
              </div>
              <div className="motion-card-lift rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">Invoice</p>
                <p className="mt-2 text-sm font-bold text-brand-ink break-words">{reservation?.invoiceStatus || 'PENDING'}</p>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">Cardholder name</span>
                <Input
                  value={cardholderName}
                  onChange={(event) => setCardholderName(event.target.value)}
                  className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-white px-4 text-sm font-semibold text-brand-ink"
                  placeholder="Demo Guest"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">Card number</span>
                <div className="relative">
                  <CreditCard className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-hint shrink-0" />
                  <Input
                    value={cardNumber}
                    onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                    className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-white ps-11 pe-4 text-sm font-semibold text-brand-ink"
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                  />
                </div>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">Expiry</span>
                <Input
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value.replace(/[^\d/]/g, '').slice(0, 5))}
                  className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-white px-4 text-sm font-semibold text-brand-ink"
                  placeholder="MM/YY"
                  inputMode="numeric"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">CVV</span>
                <Input
                  value={cvv}
                  onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-white px-4 text-sm font-semibold text-brand-ink"
                  placeholder="123"
                  inputMode="numeric"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4 text-sm font-semibold text-brand-ink-muted">
              Success: 4242 4242 4242 4242. Declined: 4000 0000 0000 0002. Insufficient funds:
              4000 0000 0000 9995. Expired: 4000 0000 0000 0069.
            </div>

            {paymentError ? (
              <div className="motion-status-error rounded-2xl border border-brand-danger/30 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
                {paymentError}
              </div>
            ) : null}

            {isFailed ? (
              <div className="motion-status-error rounded-2xl border border-brand-surface-border bg-white p-4 text-sm font-semibold text-brand-ink-muted">
                The reservation was cancelled after the failed payment. Please create a new reservation if you want to book this room.
              </div>
            ) : null}

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              {!isFailed ? (
                <Button variant="unstyled" size="none"
                  type="submit"
                  disabled={submitting}
                  className="motion-press inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                      <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                      <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                      <span>Processing...</span>
                    </>
                  ) : 'Pay Now'}
                </Button>
              ) : null}
              <Button variant="unstyled" size="none"
                type="button"
                onClick={() => navigate('/guest/dashboard')}
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-surface-border bg-white px-5 py-3 text-sm font-bold text-brand-ink"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                Back to My Reservations
              </Button>
            </div>
          </form>
        </DashboardPanel>
      )}
    </div>
  );
}
