import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Receipt, Send, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { getInvoiceHistory } from '../services/invoiceService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getInvoiceDeliveryStatusLabel,
  getPaymentStatusLabel,
  translateWithFallback,
} from '../utils/localization';

function StatusBadge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-zinc-200 bg-white text-zinc-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

const getDeliveryTone = (status) => {
  switch (status) {
    case 'SENT':
      return 'success';
    case 'FAILED':
    case 'ERROR':
      return 'danger';
    case 'ATTEMPT':
      return 'info';
    default:
      return 'neutral';
  }
};

const getPaymentTone = (status) => {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PARTIALLY_PAID':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
};

export default function Invoices() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const pageTx = 'invoicesPage';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadInvoices = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getInvoiceHistory();
        if (ignore) return;
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ignore) return;
        setInvoices([]);
        setError(err?.response?.data?.message || err?.message || 'Unable to load invoices');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInvoices();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const summary = useMemo(() => {
    const outstandingReservations = invoices.filter(
      (invoice) => Number(invoice.outstandingBalance ?? 0) > 0
    ).length;
    const finalizedCount = invoices.filter((invoice) => invoice.invoiceFinalized).length;
    const paidCount = invoices.filter((invoice) => invoice.paymentStatus === 'PAID').length;
    const totalOutstanding = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.outstandingBalance ?? 0),
      0
    );

    return {
      outstandingReservations,
      finalizedCount,
      paidCount,
      totalOutstanding,
    };
  }, [invoices]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, `${pageTx}.eyebrow`, 'Invoice center')}
        title={translateWithFallback(t, 'invoicePreview', 'Invoices')}
        description={translateWithFallback(
          t,
          `${pageTx}.description`,
          'Track invoice history by reservation, open any invoice record, and review payment and delivery state from one finance workspace.'
        )}
        meta={[
          translateWithFallback(t, `${pageTx}.metaCount`, '{{count}} invoice records', {
            count: invoices.length,
          }),
          translateWithFallback(t, `${pageTx}.metaOutstanding`, '{{count}} balances due', {
            count: summary.outstandingReservations,
          }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {translateWithFallback(t, `${pageTx}.heroCardTitle`, 'Outstanding total')}
          </p>
          <p className="mt-4 text-3xl font-black">
            {formatLocalizedCurrency(summary.totalOutstanding, i18n.language)}
          </p>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={Receipt}
          label={translateWithFallback(t, `${pageTx}.metrics.totalLabel`, 'Invoices')}
          value={String(invoices.length)}
          hint={translateWithFallback(t, `${pageTx}.metrics.totalHint`, 'Reservation-linked invoice history')}
        />
        <DashboardMetricCard
          icon={WalletCards}
          label={translateWithFallback(t, `${pageTx}.metrics.finalizedLabel`, 'Finalized')}
          value={String(summary.finalizedCount)}
          hint={translateWithFallback(t, `${pageTx}.metrics.finalizedHint`, 'Ready for PDF and delivery')}
        />
        <DashboardMetricCard
          icon={WalletCards}
          label={translateWithFallback(t, `${pageTx}.metrics.paidLabel`, 'Paid')}
          value={String(summary.paidCount)}
          hint={translateWithFallback(t, `${pageTx}.metrics.paidHint`, 'Closed payment records')}
        />
        <DashboardMetricCard
          icon={Send}
          label={translateWithFallback(t, `${pageTx}.metrics.outstandingLabel`, 'Outstanding')}
          value={formatLocalizedCurrency(summary.totalOutstanding, i18n.language)}
          hint={translateWithFallback(t, `${pageTx}.metrics.outstandingHint`, 'Reservations still carrying balances')}
          tone="dark"
        />
      </div>

      <DashboardPanel
        title={translateWithFallback(t, `${pageTx}.listTitle`, 'Invoice history')}
        description={translateWithFallback(
          t,
          `${pageTx}.listDescription`,
          'This page turns invoices into a real module instead of a single preview utility.'
        )}
      >
        {loading ? (
          <LoadingState
            message={translateWithFallback(t, `${pageTx}.loading`, 'Loading invoice history...')}
          />
        ) : error ? (
          <ErrorState
            title={translateWithFallback(t, `${pageTx}.errorTitle`, 'Invoice history unavailable')}
            message={error}
            onRetry={() => setReloadToken((current) => current + 1)}
          />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={translateWithFallback(t, `${pageTx}.emptyTitle`, 'No invoices yet')}
            message={translateWithFallback(
              t,
              `${pageTx}.emptyMessage`,
              'Checkout and billing actions will populate this finance center automatically.'
            )}
          />
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <article
                key={`${invoice.reservationId}-${invoice.confirmationNumber}`}
                className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-black tracking-tight text-zinc-950">
                      {invoice.invoiceNumber || translateWithFallback(t, 'common.pending', 'Pending')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {invoice.guestName || translateWithFallback(t, 'common.guest', 'Guest')}
                      {invoice.roomNumber ? ` · ${t('roomNumber', { number: invoice.roomNumber })}` : ''}
                      {invoice.confirmationNumber ? ` · ${invoice.confirmationNumber}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={getPaymentTone(invoice.paymentStatus)}>
                      {getPaymentStatusLabel(invoice.paymentStatus, t)}
                    </StatusBadge>
                    <StatusBadge tone={getDeliveryTone(invoice.deliveryStatus)}>
                      {getInvoiceDeliveryStatusLabel(invoice.deliveryStatus, t)}
                    </StatusBadge>
                    <StatusBadge tone={invoice.invoiceFinalized ? 'success' : 'warning'}>
                      {invoice.invoiceFinalized
                        ? translateWithFallback(t, 'common.finalized', 'Finalized')
                        : translateWithFallback(t, 'common.pending', 'Pending')}
                    </StatusBadge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                      {translateWithFallback(t, `${pageTx}.checkInLabel`, 'Check-in')}
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950">
                      {formatLocalizedDate(invoice.checkInDate, i18n.language, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                      {translateWithFallback(t, `${pageTx}.checkOutLabel`, 'Check-out')}
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950">
                      {formatLocalizedDate(invoice.checkOutDate, i18n.language, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                      {translateWithFallback(t, 'common.total', 'Total')}
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950">
                      {formatLocalizedCurrency(invoice.totalPrice ?? 0, i18n.language)}
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                      {translateWithFallback(t, 'checkoutPage.outstandingBalanceLabel', 'Outstanding balance')}
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950">
                      {formatLocalizedCurrency(invoice.outstandingBalance ?? 0, i18n.language)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end border-t border-zinc-200 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/invoices/${invoice.reservationId}`)}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    {translateWithFallback(t, `${pageTx}.openCta`, 'Open invoice details')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
