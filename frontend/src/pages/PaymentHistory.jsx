import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, RefreshCcw, RotateCcw } from 'lucide-react';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { extractPaymentError, listPayments, refundPayment } from '../services/paymentService';
import { formatLocalizedCurrency } from '../utils/localization';
import { useTranslation } from 'react-i18next';

import { Button } from "@/components/ui/button";
const FILTERS = ['ALL', 'PAID', 'FAILED', 'PENDING', 'CANCELLED', 'REFUNDED'];
const isRefundable = (payment) => ['PAID', 'SUCCESS'].includes(String(payment?.paymentStatus || '').toUpperCase());

export default function PaymentHistory() {
  const { i18n } = useTranslation();
  const [filter, setFilter] = useState('ALL');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
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

  const handleRefund = async (payment) => {
    if (!window.confirm('Are you sure you want to refund this payment? This action will mark the payment as refunded.')) {
      return;
    }
    setRefundingId(payment.paymentId);
    setNotice('');
    try {
      await refundPayment(payment.paymentId, 'Demo refund from payment history');
      setNotice('Payment refunded successfully.');
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
      <div className="rounded-[1.5rem] border border-brand-primary/20 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-primary break-words">Demo Payment Gateway</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-ink break-words">Payment history</h1>
      </div>

      <DashboardPanel title="Mock payment transactions" description="Review receipts, filter statuses, and refund successful demo payments.">
        <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button variant="unstyled" size="none"
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                  filter === item ? 'bg-brand-primary text-white' : 'border border-brand-surface-border bg-white text-brand-ink'
                }`}
              >
                {item}
              </Button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guest, transaction, reservation, invoice"
            className="h-11 w-full rounded-full border border-brand-surface-border bg-white px-4 text-sm font-semibold text-brand-ink lg:max-w-sm"
          />
        </div>

        {notice ? <div className="mb-4 rounded-2xl bg-brand-success/10 p-4 text-sm font-bold text-brand-success">{notice}</div> : null}
        {error ? <div className="mb-4 rounded-2xl bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-black uppercase tracking-[0.14em] text-brand-ink-hint">
              <tr>
                {['Transaction ID', 'Guest', 'Reservation', 'Invoice', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map((head) => (
                  <th key={head} className="border-b border-brand-surface-border px-3 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((payment) => (
                <tr key={payment.paymentId} className="border-b border-brand-surface-border">
                  <td className="px-3 py-3 font-bold text-brand-ink">{payment.gatewayReference || '-'}</td>
                  <td className="px-3 py-3 text-brand-ink-muted">{payment.guestName || payment.guestEmail || '-'}</td>
                  <td className="px-3 py-3">{payment.confirmationNumber}</td>
                  <td className="px-3 py-3">{payment.invoiceNumber || payment.invoiceStatus || 'PENDING'}</td>
                  <td className="px-3 py-3">{formatLocalizedCurrency(payment.amount ?? 0, i18n.language)} {payment.currency || 'SAR'}</td>
                  <td className="px-3 py-3">{payment.paymentMethod}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-brand-surface-light px-3 py-1 text-xs font-black break-words">{payment.paymentStatus}</span>
                  </td>
                  <td className="px-3 py-3">{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 flex-wrap gap-2">
                      <Button variant="unstyled" size="none"
                        type="button"
                        onClick={() => setSelectedReceipt(payment)}
                        className="inline-flex min-w-0 items-center gap-1 rounded-full border border-brand-surface-border px-3 py-2 text-xs font-bold"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        Receipt
                      </Button>
                      {isRefundable(payment) ? (
                        <Button variant="unstyled" size="none"
                          type="button"
                          onClick={() => handleRefund(payment)}
                          disabled={refundingId === payment.paymentId}
                          className="inline-flex min-w-0 items-center gap-1 rounded-full border border-brand-danger/40 px-3 py-2 text-xs font-bold text-brand-danger disabled:opacity-60"
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
      </DashboardPanel>

      {selectedReceipt ? (
        <div className="fixed inset-0 z-50 flex min-w-0 items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[1.5rem] bg-white p-5">
            <div className="flex min-w-0 items-start justify-between gap-4 border-b border-brand-surface-border pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary break-words">Roomify Payment Receipt</p>
                <h2 className="mt-2 text-xl font-black text-brand-ink break-words">{selectedReceipt.gatewayReference}</h2>
              </div>
              <Button variant="unstyled" size="none" type="button" onClick={() => setSelectedReceipt(null)} className="rounded-full border px-3 py-2 text-sm font-bold">
                Close
              </Button>
            </div>
            <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              {Object.entries({
                Guest: selectedReceipt.guestName || selectedReceipt.guestEmail,
                Reservation: selectedReceipt.confirmationNumber,
                Invoice: selectedReceipt.invoiceNumber || selectedReceipt.invoiceStatus,
                Amount: `${formatLocalizedCurrency(selectedReceipt.amount ?? 0, i18n.language)} ${selectedReceipt.currency || 'SAR'}`,
                Method: selectedReceipt.paymentMethod,
                'Last four': selectedReceipt.lastFourDigits ? `**** ${selectedReceipt.lastFourDigits}` : '-',
                Status: selectedReceipt.paymentStatus,
              }).map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">{label}</p>
                  <p className="mt-2 break-words text-sm font-bold text-brand-ink">{value || '-'}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex min-w-0 gap-3">
              <Button variant="unstyled" size="none" type="button" onClick={() => window.print()} className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white">
                Print Receipt
              </Button>
              <Button variant="unstyled" size="none" type="button" onClick={() => setSelectedReceipt(null)} className="inline-flex min-w-0 items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold">
                <RotateCcw className="h-4 w-4 shrink-0" />
                Back
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
