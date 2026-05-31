import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, RefreshCcw, RotateCcw, Search, ShieldCheck, X } from 'lucide-react';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthProvider';
import { extractPaymentError, listPayments, refundPayment } from '../services/paymentService';
import { formatLocalizedCurrency } from '../utils/localization';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const FILTERS = ['ALL', 'PAID', 'FAILED', 'PENDING', 'CANCELLED', 'REFUNDED'];
const REFUND_ROLES = new Set(['ROLE_STAFF', 'ROLE_MANAGER', 'ROLE_ADMIN']);
const isRefundable = (payment, roles = []) =>
  roles.some((role) => REFUND_ROLES.has(role)) &&
  String(payment?.paymentStatus || '').toUpperCase() === 'PAID';

function PaymentFact({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-brand-ink">{value || '-'}</p>
    </div>
  );
}

function ReceiptModal({ payment, language, onClose }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-w-0 items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="roomify-page-enter max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[1.75rem] bg-white shadow-2xl">
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-brand-surface-border px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary break-words">
              Roomify payment receipt
            </p>
            <h2 className="mt-2 text-xl font-black text-brand-ink break-words">{payment.gatewayReference || '-'}</h2>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={onClose} aria-label="Close receipt">
            <X className="h-4 w-4 shrink-0" />
          </Button>
        </div>

        <div className="p-5">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <PaymentFact label="Guest" value={payment.guestName || payment.guestEmail} />
            <PaymentFact label="Reservation" value={payment.confirmationNumber} />
            <PaymentFact label="Invoice" value={payment.invoiceNumber || payment.invoiceStatus} />
            <PaymentFact
              label="Amount"
              value={`${formatLocalizedCurrency(payment.amount ?? 0, language)} ${payment.currency || 'SAR'}`}
            />
            <PaymentFact label="Method" value={payment.paymentMethod} />
            <PaymentFact label="Last four" value={payment.lastFourDigits ? `**** ${payment.lastFourDigits}` : '-'} />
            <PaymentFact label="Status" value={payment.paymentStatus} />
            <PaymentFact label="Date" value={payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'} />
            {payment.refundedAt ? (
              <PaymentFact label="Refunded" value={new Date(payment.refundedAt).toLocaleString()} />
            ) : null}
            {payment.refundReason ? <PaymentFact label="Refund reason" value={payment.refundReason} /> : null}
          </div>
          <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => window.print()} className="h-auto rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-deep">
              Print receipt
            </Button>
            <Button variant="outline" type="button" onClick={onClose} className="h-auto rounded-full border-brand-surface-border px-5 py-3 text-sm font-bold">
              <RotateCcw className="h-4 w-4 shrink-0" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefundModal({ payment, onCancel, onConfirm, loading }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-w-0 items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="roomify-page-enter w-full max-w-lg rounded-[1.75rem] border border-brand-surface-border bg-white p-5 shadow-2xl">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-danger/10 text-brand-danger">
            <RefreshCcw className="h-5 w-5 shrink-0" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-black tracking-tight text-brand-ink">Refund this paid demo payment?</p>
            <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted">
              This is allowed only for PAID payments. The payment will be marked REFUNDED and the reservation invoice state will update.
            </p>
          </div>
        </div>
        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
          <PaymentFact label="Transaction" value={payment.gatewayReference} />
          <PaymentFact label="Amount" value={`${payment.amount ?? 0} ${payment.currency || 'SAR'}`} />
        </div>
        <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" onClick={onCancel} disabled={loading} className="h-auto rounded-full border-brand-surface-border px-5 py-3 text-sm font-bold">
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading} className="h-auto rounded-full bg-brand-danger px-5 py-3 text-sm font-bold text-white hover:bg-brand-danger/90">
            {loading ? 'Refunding...' : 'Confirm refund'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentHistory() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const [filter, setFilter] = useState('ALL');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [refundCandidate, setRefundCandidate] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPayments(await listPayments(filter));
    } catch (err) {
      setError(extractPaymentError(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const visiblePayments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return payments;
    return payments.filter((payment) =>
      [
        payment.gatewayReference,
        payment.confirmationNumber,
        payment.invoiceNumber,
        payment.guestName,
        payment.guestEmail,
        payment.reservationId,
        payment.paymentId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [payments, query]);

  const totals = useMemo(() => {
    const paid = payments.filter((payment) => String(payment.paymentStatus).toUpperCase() === 'PAID');
    const refunded = payments.filter((payment) => String(payment.paymentStatus).toUpperCase() === 'REFUNDED');
    return {
      count: payments.length,
      paidAmount: paid.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
      refundable: paid.length,
      refunded: refunded.length,
    };
  }, [payments]);

  const handleRefund = async () => {
    if (!refundCandidate) return;
    setRefundingId(refundCandidate.paymentId);
    setNotice('');
    setError('');
    try {
      await refundPayment(refundCandidate.paymentId, 'Demo refund from payment history');
      setNotice('Payment refunded successfully.');
      setRefundCandidate(null);
      await load();
    } catch (err) {
      setError(extractPaymentError(err));
    } finally {
      setRefundingId(null);
    }
  };

  if (loading) return <LoadingState message="Loading payment history..." />;
  if (error && payments.length === 0) return <ErrorState title="Payment history" message={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="roomify-card-interactive overflow-hidden rounded-[1.75rem] border border-brand-primary/20 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)]">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[1fr_0.9fr]">
          <div className="bg-[linear-gradient(135deg,#1A2B3A_0%,#264B6B_100%)] p-6 text-white sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/65 break-words">
              Demo Payment Gateway
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Payment history</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Review receipts, filter transaction states, and refund paid mock payments from one operational view.
            </p>
          </div>
          <div className="grid min-w-0 gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <PaymentFact label="Transactions" value={String(totals.count)} />
            <PaymentFact label="Paid volume" value={formatLocalizedCurrency(totals.paidAmount, i18n.language)} />
            <PaymentFact label="Refundable" value={String(totals.refundable)} />
            <PaymentFact label="Refunded" value={String(totals.refunded)} />
          </div>
        </div>
      </div>

      <DashboardPanel title="Mock payment transactions" description="Refund actions appear only for PAID payments. Guests do not have access to this view.">
        <div className="mb-5 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item}
                type="button"
                variant="unstyled"
                size="none"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                  filter === item
                    ? 'bg-brand-primary text-white shadow-brand-cta'
                    : 'border border-brand-surface-border bg-white text-brand-ink hover:bg-brand-surface-light'
                }`}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-hint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guest, transaction, reservation, invoice"
              className="h-11 w-full rounded-full border border-brand-surface-border bg-white ps-11 pe-4 text-sm font-semibold text-brand-ink transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-focus"
            />
          </div>
        </div>

        {notice ? (
          <div className="mb-4 rounded-2xl border border-brand-success/30 bg-brand-success/10 p-4 text-sm font-bold text-brand-success">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-2xl border border-brand-danger/30 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
            {error}
          </div>
        ) : null}

        {visiblePayments.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No matching payments"
            message="Adjust the status filter or search term to find a transaction."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-start text-sm">
                <thead className="text-xs font-black uppercase tracking-[0.14em] text-brand-ink-hint">
                  <tr>
                    {['Transaction ID', 'Guest', 'Reservation', 'Invoice', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map((head) => (
                      <th key={head} className="border-b border-brand-surface-border px-3 py-3 text-start">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map((payment) => (
                    <tr key={payment.paymentId} className="border-b border-brand-surface-border transition hover:bg-brand-surface-light/70">
                      <td className="px-3 py-3 font-bold text-brand-ink">{payment.gatewayReference || '-'}</td>
                      <td className="px-3 py-3 text-brand-ink-muted">{payment.guestName || payment.guestEmail || '-'}</td>
                      <td className="px-3 py-3">{payment.confirmationNumber}</td>
                      <td className="px-3 py-3">{payment.invoiceNumber || payment.invoiceStatus || 'PENDING'}</td>
                      <td className="px-3 py-3">{formatLocalizedCurrency(payment.amount ?? 0, i18n.language)} {payment.currency || 'SAR'}</td>
                      <td className="px-3 py-3">{payment.paymentMethod}</td>
                      <td className="px-3 py-3"><StatusPill status={payment.paymentStatus} size="sm" /></td>
                      <td className="px-3 py-3">{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 flex-wrap gap-2">
                          <Button variant="outline" size="sm" type="button" onClick={() => setSelectedReceipt(payment)} className="rounded-full border-brand-surface-border">
                            <Eye className="h-3.5 w-3.5 shrink-0" />
                            Receipt
                          </Button>
                          {isRefundable(payment, roles) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => setRefundCandidate(payment)}
                              disabled={refundingId === payment.paymentId}
                              className="rounded-full border-brand-danger/40 text-brand-danger hover:bg-brand-danger/5"
                            >
                              <RefreshCcw className="h-3.5 w-3.5 shrink-0" />
                              Refund
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid min-w-0 gap-4 lg:hidden">
              {visiblePayments.map((payment) => (
                <article key={payment.paymentId} className="roomify-card-interactive rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">Transaction</p>
                      <p className="mt-1 break-words text-sm font-black text-brand-ink">{payment.gatewayReference || '-'}</p>
                    </div>
                    <StatusPill status={payment.paymentStatus} size="sm" />
                  </div>
                  <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                    <PaymentFact label="Guest" value={payment.guestName || payment.guestEmail} />
                    <PaymentFact label="Reservation" value={payment.confirmationNumber} />
                    <PaymentFact label="Amount" value={`${formatLocalizedCurrency(payment.amount ?? 0, i18n.language)} ${payment.currency || 'SAR'}`} />
                    <PaymentFact label="Invoice" value={payment.invoiceNumber || payment.invoiceStatus || 'PENDING'} />
                  </div>
                  <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row">
                    <Button variant="outline" type="button" onClick={() => setSelectedReceipt(payment)} className="h-auto rounded-full border-brand-surface-border px-4 py-3 text-sm font-bold">
                      <Eye className="h-4 w-4 shrink-0" />
                      Receipt
                    </Button>
                    {isRefundable(payment, roles) ? (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setRefundCandidate(payment)}
                        disabled={refundingId === payment.paymentId}
                        className="h-auto rounded-full border-brand-danger/40 px-4 py-3 text-sm font-bold text-brand-danger hover:bg-brand-danger/5"
                      >
                        <RefreshCcw className="h-4 w-4 shrink-0" />
                        Refund
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </DashboardPanel>

      <ReceiptModal payment={selectedReceipt} language={i18n.language} onClose={() => setSelectedReceipt(null)} />
      <RefundModal
        payment={refundCandidate}
        loading={refundingId === refundCandidate?.paymentId}
        onCancel={() => setRefundCandidate(null)}
        onConfirm={handleRefund}
      />
    </div>
  );
}
