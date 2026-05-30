import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MailCheck, MailWarning, RefreshCcw, Search } from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { Button } from '../components/ui/button';
import {
  extractEmailDeliveryError,
  getEmailDeliveries,
  getEmailDeliveryStats,
  retryEmailDelivery,
} from '../services/notificationService';
import {
  formatLocalizedDateTime,
  formatLocalizedNumber,
  translateWithFallback,
} from '../utils/localization';

import { NativeSelect } from "@/components/ui/native-select";
const STATUS_OPTIONS = ['', 'PENDING', 'PROCESSING', 'SENT', 'FAILED'];
const TYPE_OPTIONS = [
  '',
  'RESERVATION_CREATED',
  'RESERVATION_CANCELLED',
  'PAYMENT_COMPLETED',
  'CHECKIN_REMINDER',
  'PAYMENT_REMINDER',
  'ROOM_READY',
  'SERVICE_REQUEST_COMPLETED',
  'PASSWORD_RESET',
  'STAFF_WELCOME',
];

export default function AdminNotifications() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    recipient: '',
    status: '',
    type: '',
  });
  const [retryingId, setRetryingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [deliveryStats, deliveryItems] = await Promise.all([
        getEmailDeliveryStats(),
        getEmailDeliveries({
          recipient: filters.recipient || undefined,
          status: filters.status || undefined,
          type: filters.type || undefined,
        }),
      ]);

      setStats(deliveryStats);
      setDeliveries(Array.isArray(deliveryItems) ? deliveryItems : []);
      setError('');
    } catch (err) {
      setError(extractEmailDeliveryError(err));
    } finally {
      setLoading(false);
    }
  }, [filters.recipient, filters.status, filters.type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDeliveries = useMemo(() => {
    if (!filters.recipient) {
      return deliveries;
    }
    const query = filters.recipient.toLowerCase();
    return deliveries.filter((delivery) => delivery.recipient?.toLowerCase().includes(query));
  }, [deliveries, filters.recipient]);

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      const updated = await retryEmailDelivery(id);
      setDeliveries((current) =>
        current.map((delivery) => (delivery.id === id ? updated : delivery))
      );
      await loadData();
    } catch (err) {
      setError(extractEmailDeliveryError(err));
    } finally {
      setRetryingId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState message={translateWithFallback(t, 'adminNotifications.loading', 'Loading email delivery dashboard...')} />
      </div>
    );
  }

  if (error && !stats && deliveries.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState
          title={translateWithFallback(t, 'adminNotifications.errorTitle', 'Email delivery dashboard unavailable')}
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'adminNotifications.eyebrow', 'Operational messaging')}
        title={translateWithFallback(t, 'adminNotifications.title', 'Notification Delivery Dashboard')}
        description={translateWithFallback(
          t,
          'adminNotifications.description',
          'Track production email delivery, isolate failures, and retry queued messages without exposing SMTP secrets.'
        )}
        meta={[
          translateWithFallback(t, 'adminNotifications.metaSent', '{{count}} sent', { count: stats?.sent ?? 0 }),
          translateWithFallback(t, 'adminNotifications.metaFailed', '{{count}} failed', { count: stats?.failed ?? 0 }),
          translateWithFallback(t, 'adminNotifications.metaPending', '{{count}} pending', { count: stats?.pending ?? 0 }),
        ]}
      />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={MailCheck}
          label={translateWithFallback(t, 'adminNotifications.metrics.sent', 'Sent')}
          value={formatLocalizedNumber(stats?.sent ?? 0, i18n.language)}
          hint={translateWithFallback(t, 'adminNotifications.metrics.sentHint', 'Successfully delivered emails.')}
        />
        <DashboardMetricCard
          icon={MailWarning}
          label={translateWithFallback(t, 'adminNotifications.metrics.failed', 'Failed')}
          value={formatLocalizedNumber(stats?.failed ?? 0, i18n.language)}
          hint={translateWithFallback(t, 'adminNotifications.metrics.failedHint', 'Emails that need intervention or retry.')}
        />
        <DashboardMetricCard
          icon={RefreshCcw}
          label={translateWithFallback(t, 'adminNotifications.metrics.processing', 'Processing')}
          value={formatLocalizedNumber(stats?.processing ?? 0, i18n.language)}
          hint={translateWithFallback(t, 'adminNotifications.metrics.processingHint', 'Currently being delivered by the async worker.')}
        />
        <DashboardMetricCard
          icon={Search}
          label={translateWithFallback(t, 'adminNotifications.metrics.pending', 'Pending')}
          value={formatLocalizedNumber(stats?.pending ?? 0, i18n.language)}
          hint={translateWithFallback(t, 'adminNotifications.metrics.pendingHint', 'Queued for the next dispatch cycle.')}
        />
      </div>

      <DashboardPanel
        title={translateWithFallback(t, 'adminNotifications.filtersTitle', 'Filters')}
        description={translateWithFallback(t, 'adminNotifications.filtersDescription', 'Filter by recipient, delivery status, or notification type.')}
        action={
          <Button type="button" variant="outline" onClick={loadData} className="border-brand-surface-border">
            <RefreshCcw className="h-4 w-4 shrink-0" />
            {t('retry')}
          </Button>
        }
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'adminNotifications.recipientFilter', 'Recipient')}
            </span>
            <input
              type="text"
              value={filters.recipient}
              onChange={(event) => setFilters((current) => ({ ...current, recipient: event.target.value }))}
              placeholder="guest@roomify.com"
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'adminNotifications.statusFilter', 'Status')}
            </span>
            <NativeSelect
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status || 'all-statuses'} value={status}>
                  {status || translateWithFallback(t, 'adminNotifications.allStatuses', 'All statuses')}
                </option>
              ))}
            </NativeSelect>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'adminNotifications.typeFilter', 'Type')}
            </span>
            <NativeSelect
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type || 'all-types'} value={type}>
                  {type || translateWithFallback(t, 'adminNotifications.allTypes', 'All types')}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title={translateWithFallback(t, 'adminNotifications.historyTitle', 'Delivery History')}
        description={translateWithFallback(t, 'adminNotifications.historyDescription', 'Searchable delivery history for sent and failed notifications.')}
      >
        {error ? (
          <div className="rounded-[1.2rem] border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <LoadingState message={translateWithFallback(t, 'adminNotifications.loadingTable', 'Refreshing delivery records...')} />
        ) : filteredDeliveries.length === 0 ? (
          <EmptyState
            title={translateWithFallback(t, 'adminNotifications.emptyTitle', 'No deliveries found')}
            message={translateWithFallback(t, 'adminNotifications.emptyMessage', 'Adjust your filters or wait for the next notification event.')}
            icon={MailCheck}
          />
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <article
                key={delivery.id}
                className="rounded-[1.4rem] border border-brand-surface-border bg-brand-surface-light p-4"
              >
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                        {delivery.status}
                      </span>
                      <span className="rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                        {delivery.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black text-brand-ink break-words">{delivery.subject}</p>
                    <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">{delivery.recipient}</p>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                      {translateWithFallback(t, 'adminNotifications.attempts', 'Attempts: {{count}}', { count: delivery.attemptCount })}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                      {formatLocalizedDateTime(delivery.createdAt, i18n.language)}
                    </p>
                    {delivery.errorMessage ? (
                      <p className="mt-3 rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-3 py-3 text-sm font-medium text-brand-danger break-words">
                        {delivery.errorMessage}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex min-w-0 shrink-0 items-center gap-2">
                    {delivery.sentAt ? (
                      <span className="text-xs font-semibold text-brand-ink-muted break-words">
                        {formatLocalizedDateTime(delivery.sentAt, i18n.language)}
                      </span>
                    ) : null}
                    {delivery.status === 'FAILED' ? (
                      <Button
                        type="button"
                        onClick={() => handleRetry(delivery.id)}
                        disabled={retryingId === delivery.id}
                        className="rounded-full bg-brand-primary px-4 text-white hover:bg-brand-primary-deep"
                      >
                        <RefreshCcw className="h-4 w-4 shrink-0" />
                        {retryingId === delivery.id
                          ? translateWithFallback(t, 'adminNotifications.retrying', 'Retrying...')
                          : translateWithFallback(t, 'adminNotifications.retry', 'Retry')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
