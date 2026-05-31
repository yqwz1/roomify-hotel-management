import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Printer,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import StatusPill from '../components/StatusPill';
import { getGuestReservations } from '../services/guestReservationService';
import { extractPaymentError, payGuestReservation } from '../services/paymentService';
import { formatLocalizedCurrency, formatLocalizedDate } from '../utils/localization';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const DEMO_CARDS = [
  { number: '4242 4242 4242 4242', result: 'PAID', tone: 'success' },
  { number: '4000 0000 0000 0002', result: 'CARD_DECLINED', tone: 'danger' },
  { number: '4000 0000 0000 9995', result: 'INSUFFICIENT_FUNDS', tone: 'danger' },
  { number: '4000 0000 0000 0069', result: 'EXPIRED_CARD', tone: 'danger' },
];

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const getDigits = (value) => String(value ?? '').replace(/\D/g, '');

const maskLastFour = (value) => {
  const digits = getDigits(value);
  return digits.length >= 4 ? `**** ${digits.slice(-4)}` : '-';
};

function Field({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
        {label}
      </span>
      {children}
    </label>
  );
}

function ReceiptView({ payment, reservation, language, onBack }) {
  const dateTime = payment?.paidAt || payment?.createdAt;
  const amount = payment?.amount ?? reservation?.outstandingBalance ?? reservation?.totalPrice ?? 0;

  return (
    <div className="roomify-card-interactive rounded-[1.5rem] border border-brand-success/30 bg-white p-5 shadow-[0_20px_50px_-32px_rgba(29,158,117,0.45)] print:border-0 print:p-0 print:shadow-none">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-brand-surface-border pb-5">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-success break-words">
            Demo Payment Gateway
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink break-words">
            Roomify payment receipt
          </h2>
          <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
            Mock transaction accepted. No real card network was contacted.
          </p>
        </div>
        <StatusPill status={payment?.paymentStatus ?? 'PAID'} />
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
        {[
          ['Reservation', payment?.confirmationNumber || reservation?.confirmationNumber || reservation?.confirmation],
          ['Invoice', payment?.invoiceNumber || reservation?.invoiceNumber || 'Pending'],
          ['Transaction', payment?.gatewayReference],
          ['Guest', payment?.guestName],
          ['Room', [payment?.roomNumber, payment?.roomType].filter(Boolean).join(' - ')],
          ['Check-in', formatLocalizedDate(reservation?.checkInDate, language, { dateStyle: 'medium' })],
          ['Check-out', formatLocalizedDate(reservation?.checkOutDate, language, { dateStyle: 'medium' })],
          ['Amount', `${formatLocalizedCurrency(amount, language)} ${payment?.currency || 'SAR'}`],
          ['Method', payment?.paymentMethod],
          ['Card', payment?.lastFourDigits ? `**** ${payment.lastFourDigits}` : '-'],
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
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-auto rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-deep"
        >
          <Printer className="h-4 w-4 shrink-0" />
          Print receipt
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={onBack}
          className="h-auto rounded-full border-brand-surface-border px-5 py-3 text-sm font-bold"
        >
          Back to my reservations
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
  const [validationError, setValidationError] = useState('');

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

  const payableAmount = Number(reservation?.outstandingBalance ?? reservation?.totalPrice ?? reservation?.totalAmount ?? 0);
  const isPaid = payment?.paymentStatus === 'PAID';
  const isFailed = payment?.paymentStatus === 'FAILED';
  const canSubmit = !submitting && !isFailed && !isPaid;

  const validate = () => {
    if (!cardholderName.trim()) return 'Enter the cardholder name for the demo receipt.';
    if (getDigits(cardNumber).length !== 16) return 'Enter one of the 16-digit demo card numbers.';
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Use MM/YY for the demo expiry date.';
    if (getDigits(cvv).length < 3) return 'Enter a 3 or 4 digit demo CVV.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPaymentError('');
    const validationMessage = validate();
    setValidationError(validationMessage);
    if (validationMessage) return;

    setSubmitting(true);
    try {
      const response = await payGuestReservation(confirmationNumber, {
        paymentMethod: 'CREDIT_CARD_DEMO',
        cardNumber,
        cardholderName: cardholderName.trim(),
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
    <div className="roomify-page-enter mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="roomify-card-interactive overflow-hidden rounded-[1.75rem] border border-brand-primary/20 bg-white shadow-[0_24px_70px_-36px_rgba(7,59,76,0.5)]">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="roomify-luxe-gradient relative overflow-hidden p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.22),transparent_16rem),radial-gradient(circle_at_18%_92%,rgba(214,168,79,0.24),transparent_15rem)]" />
            <p className="relative text-xs font-black uppercase tracking-[0.24em] text-brand-champagne/80 break-words">
              Demo Payment Gateway
            </p>
            <h1 className="relative mt-3 font-heading text-3xl font-black tracking-tight sm:text-5xl">Complete mock payment</h1>
            <p className="relative mt-3 max-w-2xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              This checkout is for graduation/demo use only. It stores only the last four digits and never connects to a real payment provider.
            </p>
            <div className="relative mt-6 flex min-w-0 flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/85">
                Guest-owned reservation
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/85">
                Mock cards only
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid min-w-0 gap-3">
              {[
                ['Reservation', confirmationNumber],
                ['Amount due', `${formatLocalizedCurrency(payableAmount, i18n.language)} SAR`],
                ['Invoice', reservation?.invoiceStatus || 'PENDING'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">{label}</p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">{value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isPaid ? (
        <ReceiptView
          payment={payment}
          reservation={reservation}
          language={i18n.language}
          onBack={() => navigate('/guest/dashboard')}
        />
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <DashboardPanel
            title="Mock checkout"
            description="Use a demo card number below. Failed demo payments cancel the reservation and release the room, matching the backend rule."
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Cardholder name">
                  <input
                    value={cardholderName}
                    onChange={(event) => setCardholderName(event.target.value)}
                    className="roomify-field"
                    placeholder="Demo Guest"
                    autoComplete="cc-name"
                  />
                </Field>
                <Field label="Card number">
                  <div className="relative">
                    <CreditCard className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-hint shrink-0" />
                    <input
                      value={cardNumber}
                      onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                      className="roomify-field ps-11"
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                  </div>
                </Field>
                <Field label="Expiry">
                  <input
                    value={expiry}
                    onChange={(event) => setExpiry(event.target.value.replace(/[^\d/]/g, '').slice(0, 5))}
                    className="roomify-field"
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />
                </Field>
                <Field label="CVV">
                  <input
                    value={cvv}
                    onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="roomify-field"
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/10 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <p className="text-sm font-semibold leading-6 text-brand-ink">
                    Demo safety: the UI sends a mock card number to the local backend only for deterministic test behavior. The backend stores/display last four digits only.
                  </p>
                </div>
              </div>

              {validationError ? (
                <div className="rounded-2xl border border-brand-warning/30 bg-brand-warning/10 p-4 text-sm font-bold text-brand-warning">
                  {validationError}
                </div>
              ) : null}

              {paymentError ? (
                <div className="rounded-2xl border border-brand-danger/30 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
                  {paymentError}
                </div>
              ) : null}

              {isFailed ? (
                <div className="rounded-2xl border border-brand-danger/30 bg-brand-danger/10 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand-danger" />
                    <div>
                      <p className="text-sm font-black text-brand-ink">Reservation cancelled after failed payment</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted">
                        The room is available again. Create a new reservation from room search to retry the booking flow.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {submitting ? (
                <div className="roomify-shimmer roomify-hover-glow rounded-2xl border border-brand-primary/20 bg-brand-surface-light p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="roomify-processing-dot h-3 w-3 rounded-full bg-brand-primary" />
                    <p className="text-sm font-bold text-brand-ink">Processing mock authorization...</p>
                  </div>
                </div>
              ) : null}

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                {canSubmit ? (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-auto rounded-full px-6 py-4 text-sm font-bold text-white disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    {submitting ? 'Processing...' : `Pay ${maskLastFour(cardNumber)}`}
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate('/guest/dashboard')}
                  className="h-auto rounded-full border-brand-surface-border px-6 py-4 text-sm font-bold"
                >
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  Back to my reservations
                </Button>
              </div>
            </form>
          </DashboardPanel>

          <DashboardPanel title="Demo cards" description="Deterministic outcomes for QA and presentation rehearsals.">
            <div className="space-y-3">
              {DEMO_CARDS.map((card) => (
                <button
                  key={card.number}
                  type="button"
                  onClick={() => setCardNumber(card.number)}
                  className="roomify-card-interactive w-full rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4 text-start hover:border-brand-primary/35 hover:bg-white"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-black text-brand-ink">{card.number}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink-muted">{card.result}</p>
                    </div>
                    {card.tone === 'success' ? (
                      <CheckCircle2 className="roomify-success-burst h-5 w-5 shrink-0 rounded-full text-brand-success" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 shrink-0 text-brand-danger" />
                    )}
                  </div>
                </button>
              ))}
              <div className="rounded-2xl border border-brand-surface-border bg-white p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <ReceiptText className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                  <p className="text-sm font-medium leading-6 text-brand-ink-muted">
                    Successful payments show a receipt. Failed payments preserve the current rule: cancel reservation, mark invoice cancelled, and release availability.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-brand-success/30 bg-brand-success/10 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-success" />
                  <p className="text-sm font-semibold leading-6 text-brand-ink">
                    For a clean demo, start with 4242. Use declined cards only when showing failure handling.
                  </p>
                </div>
              </div>
            </div>
          </DashboardPanel>
        </div>
      )}
    </div>
  );
}
