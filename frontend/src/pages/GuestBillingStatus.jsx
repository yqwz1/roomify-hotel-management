import { useEffect, useMemo, useState } from 'react';
import { Receipt, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  extractGuestReservationError,
  getGuestReservations,
} from '../services/guestReservationService';
import {
  extractGuestBillingError,
  recordGuestReservationPayment,
} from '../services/guestBillingService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getBooleanLabel,
  getPaymentStatusLabel,
  translateWithFallback,
} from '../utils/localization';

import { Button } from "@/components/ui/button";
function GuestPaymentForm({
  reservation,
  language,
  submitting,
  paymentState,
  onAmountChange,
  onSubmit,
  t,
}) {
  const confirmation =
    reservation.confirmationNumber || reservation.confirmation || '-';
  const outstandingBalance = Number(reservation.outstandingBalance ?? 0);

  return (
    <div className="mt-4 rounded-[1.35rem] border border-zinc-200 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400 break-words">
            {translateWithFallback(t, 'guestBillingStatusPage.payNowLabel', 'Pay now')}
          </p>
          <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 break-words">
                {t('checkoutPage.paymentAmountLabel')}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={paymentState.amount}
                onChange={(event) => onAmountChange(confirmation, event.target.value)}
                className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </label>
            <Button variant="unstyled" size="none"
              type="button"
              disabled={submitting}
              onClick={() => onSubmit(reservation)}
              className="inline-flex min-w-0 h-12 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {submitting
                ? translateWithFallback(
                    t,
                    'guestBillingStatusPage.processingPayment',
                    'Processing payment...'
                  )
                : translateWithFallback(t, 'guestBillingStatusPage.payNowAction', 'Pay balance')}
            </Button>
          </div>
          {paymentState.error ? (
            <p className="mt-3 text-sm font-medium text-rose-700 break-words">{paymentState.error}</p>
          ) : null}
          {paymentState.successMessage ? (
            <p className="mt-3 text-sm font-semibold text-emerald-700 break-words">
              {paymentState.successMessage}
            </p>
          ) : null}
        </div>
        <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-end">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 break-words">
            {t('checkoutPage.outstandingBalanceLabel')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950 break-words">
            {formatLocalizedCurrency(outstandingBalance, language)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GuestBillingStatus() {
  const { t, i18n } = useTranslation();
  const pageTx = 'guestBillingStatusPage';
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [paymentFormByReservation, setPaymentFormByReservation] = useState({});
  const [submittingConfirmation, setSubmittingConfirmation] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadReservations = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getGuestReservations();
        if (ignore) return;
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ignore) return;
        setReservations([]);
        setError(extractGuestReservationError(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadReservations();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const billingSummary = useMemo(() => {
    const outstandingBalance = reservations.reduce(
      (sum, reservation) => sum + Number(reservation.outstandingBalance ?? 0),
      0
    );
    const totalPaid = reservations.reduce(
      (sum, reservation) => sum + Number(reservation.totalPaid ?? 0),
      0
    );
    const finalizedInvoices = reservations.filter(
      (reservation) => reservation.invoiceFinalized
    ).length;
    const balancesDue = reservations.filter(
      (reservation) => Number(reservation.outstandingBalance ?? 0) > 0
    ).length;

    return {
      outstandingBalance,
      totalPaid,
      finalizedInvoices,
      balancesDue,
    };
  }, [reservations]);

  const handleRetry = () => {
    setReloadToken((current) => current + 1);
  };

  const getPaymentState = (confirmation, outstandingBalance) => {
    const existing = paymentFormByReservation[confirmation];
    if (existing) return existing;

    return {
      amount: Number(outstandingBalance ?? 0) > 0 ? Number(outstandingBalance).toFixed(2) : '',
      error: '',
      successMessage: '',
    };
  };

  const updatePaymentState = (confirmation, updater) => {
    setPaymentFormByReservation((current) => {
      const previous = current[confirmation] ?? {
        amount: '',
        error: '',
        successMessage: '',
      };
      const next =
        typeof updater === 'function' ? updater(previous) : { ...previous, ...updater };

      return {
        ...current,
        [confirmation]: next,
      };
    });
  };

  const handlePaymentAmountChange = (confirmation, amount) => {
    updatePaymentState(confirmation, (previous) => ({
      ...previous,
      amount,
      error: '',
      successMessage: '',
    }));
  };

  const handlePaymentSubmit = async (reservation) => {
    const confirmation = reservation.confirmationNumber || reservation.confirmation || '';
    const outstandingBalance = Number(reservation.outstandingBalance ?? 0);
    const paymentState = getPaymentState(confirmation, outstandingBalance);
    const amountText = String(paymentState.amount ?? '').trim();
    const numericAmount = Number(amountText);

    if (!amountText || Number.isNaN(numericAmount)) {
      updatePaymentState(confirmation, {
        error: t('checkoutPage.paymentAmountRequired'),
        successMessage: '',
      });
      return;
    }

    if (numericAmount <= 0) {
      updatePaymentState(confirmation, {
        error: t('checkoutPage.paymentAmountPositive'),
        successMessage: '',
      });
      return;
    }

    if (numericAmount > outstandingBalance) {
      updatePaymentState(confirmation, {
        error: t('checkoutPage.paymentAmountExceeded', {
          amount: formatLocalizedCurrency(outstandingBalance, i18n.language),
        }),
        successMessage: '',
      });
      return;
    }

    setSubmittingConfirmation(confirmation);
    updatePaymentState(confirmation, {
      error: '',
      successMessage: '',
    });

    try {
      const bill = await recordGuestReservationPayment(
        confirmation,
        numericAmount.toFixed(2)
      );

      const nextOutstanding = Number(bill.outstandingBalance ?? 0);
      updatePaymentState(confirmation, {
        amount: nextOutstanding > 0 ? nextOutstanding.toFixed(2) : '',
        error: '',
        successMessage: translateWithFallback(
          t,
          'guestBillingStatusPage.paymentSuccess',
          'Payment recorded successfully. Remaining balance: {{amount}}',
          {
            amount: formatLocalizedCurrency(nextOutstanding, i18n.language),
          }
        ),
      });
      setReloadToken((current) => current + 1);
    } catch (err) {
      updatePaymentState(confirmation, {
        error: extractGuestBillingError(err),
        successMessage: '',
      });
    } finally {
      setSubmittingConfirmation(null);
    }
  };

  return (
    <div className="roomify-page-enter mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, `${pageTx}.eyebrow`, 'Guest billing')}
        title={t('navBillingStatus')}
        description={translateWithFallback(
          t,
          `${pageTx}.description`,
          'Review invoice state, amounts paid, and any remaining balances across your active stays.'
        )}
        meta={[
          translateWithFallback(
            t,
            `${pageTx}.metaReservations`,
            '{{count}} stays tracked',
            { count: reservations.length }
          ),
          translateWithFallback(
            t,
            `${pageTx}.metaOutstanding`,
            '{{count}} balances due',
            { count: billingSummary.balancesDue }
          ),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300 break-words">
            {translateWithFallback(t, `${pageTx}.heroCardTitle`, 'Current balance')}
          </p>
          <p className="mt-4 text-3xl font-black break-words">
            {formatLocalizedCurrency(billingSummary.outstandingBalance, i18n.language)}
          </p>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={Receipt}
          label={translateWithFallback(t, `${pageTx}.metrics.trackedLabel`, 'Tracked Stays')}
          value={String(reservations.length)}
          hint={translateWithFallback(
            t,
            `${pageTx}.metrics.trackedHint`,
            'Reservations returned by the guest reservations endpoint.'
          )}
        />
        <DashboardMetricCard
          icon={WalletCards}
          label={translateWithFallback(t, `${pageTx}.metrics.paidLabel`, 'Total Paid')}
          value={formatLocalizedCurrency(billingSummary.totalPaid, i18n.language)}
          hint={translateWithFallback(
            t,
            `${pageTx}.metrics.paidHint`,
            'Total confirmed payments across your stays.'
          )}
        />
        <DashboardMetricCard
          icon={Receipt}
          label={translateWithFallback(t, `${pageTx}.metrics.outstandingLabel`, 'Outstanding')}
          value={formatLocalizedCurrency(billingSummary.outstandingBalance, i18n.language)}
          hint={translateWithFallback(
            t,
            `${pageTx}.metrics.outstandingHint`,
            'Remaining balances that may still need staff support.'
          )}
        />
        <DashboardMetricCard
          icon={Receipt}
          label={translateWithFallback(t, `${pageTx}.metrics.finalizedLabel`, 'Finalized Invoices')}
          value={String(billingSummary.finalizedInvoices)}
          hint={translateWithFallback(
            t,
            `${pageTx}.metrics.finalizedHint`,
            'Invoices marked finalized by the backend.'
          )}
          tone="light"
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          title={translateWithFallback(t, `${pageTx}.billingTitle`, 'Billing by Reservation')}
          description={translateWithFallback(
            t,
            `${pageTx}.billingDescription`,
            'Review invoice references, payment state, and balances for each stay.'
          )}
        >
          {loading ? (
            <LoadingState
              message={translateWithFallback(
                t,
                `${pageTx}.loading`,
                'Loading billing details...'
              )}
            />
          ) : error ? (
            <ErrorState
              title={translateWithFallback(
                t,
                `${pageTx}.errorTitle`,
                'Billing details unavailable'
              )}
              message={error}
              onRetry={handleRetry}
            />
          ) : reservations.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t(`${pageTx}.emptyTitle`)}
              message={t(`${pageTx}.emptyMessage`)}
            />
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => {
                const confirmation =
                  reservation.confirmationNumber || reservation.confirmation || '-';

                return (
                  <article
                    key={`${confirmation}-${reservation.checkInDate}`}
                    className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-black tracking-tight text-zinc-950 break-words">
                          {confirmation}
                        </p>
                        <p className="mt-1 text-sm font-medium text-zinc-500 break-words">
                          {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                            dateStyle: 'medium',
                          })}{' '}
                          -{' '}
                          {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                            dateStyle: 'medium',
                          })}
                        </p>
                      </div>
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-700 break-words">
                        {reservation.paymentStatus
                          ? getPaymentStatusLabel(reservation.paymentStatus, t)
                          : t('common.pending')}
                      </span>
                    </div>

                    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 break-words">
                          {translateWithFallback(t, `${pageTx}.invoiceNumberLabel`, 'Invoice')}
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-950 break-words">
                          {reservation.invoiceNumber || '-'}
                        </p>
                      </div>
                      <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 break-words">
                          {translateWithFallback(t, `${pageTx}.invoiceFinalizedLabel`, 'Finalized')}
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-950 break-words">
                          {getBooleanLabel(Boolean(reservation.invoiceFinalized), t)}
                        </p>
                      </div>
                      <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 break-words">
                          {t('checkoutPage.totalPaidLabel')}
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-950 break-words">
                          {formatLocalizedCurrency(reservation.totalPaid ?? 0, i18n.language)}
                        </p>
                      </div>
                      <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 break-words">
                          {t('checkoutPage.outstandingBalanceLabel')}
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-950 break-words">
                          {formatLocalizedCurrency(
                            reservation.outstandingBalance ?? 0,
                            i18n.language
                          )}
                        </p>
                      </div>
                    </div>

                    {Number(reservation.outstandingBalance ?? 0) > 0 ? (
                      <GuestPaymentForm
                        reservation={reservation}
                        language={i18n.language}
                        submitting={submittingConfirmation === confirmation}
                        paymentState={getPaymentState(
                          confirmation,
                          reservation.outstandingBalance
                        )}
                        onAmountChange={handlePaymentAmountChange}
                        onSubmit={handlePaymentSubmit}
                        t={t}
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={translateWithFallback(t, `${pageTx}.helpTitle`, 'Billing Help')}
          description={translateWithFallback(
            t,
            `${pageTx}.helpDescription`,
            'Use these paths when you need hotel assistance with balances or invoice delivery.'
          )}
        >
          <div className="grid min-w-0 gap-3">
            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400 break-words">
                {translateWithFallback(t, `${pageTx}.summaryBalanceDue`, 'Balances Due')}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-950 break-words">
                {billingSummary.balancesDue}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400 break-words">
                {translateWithFallback(t, `${pageTx}.summaryOutstanding`, 'Outstanding Balance')}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-950 break-words">
                {formatLocalizedCurrency(billingSummary.outstandingBalance, i18n.language)}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-3 pt-2">
              <Link
                to="/bookings"
                className="inline-flex min-w-0 items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-black"
              >
                {t('navGetHelp')}
              </Link>
              <Link
                to="/guest/dashboard"
                className="inline-flex min-w-0 items-center rounded-full border border-zinc-900 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
              >
                {t('navMyStay')}
              </Link>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
